import 'dotenv/config';
import { EventEmitter } from 'events';
import { createSdk } from 'invest-nodejs-grpc-sdk';
import { Share } from 'invest-nodejs-grpc-sdk/dist/generated/instruments';
import { AccessLevel, AccountStatus, AccountType } from 'invest-nodejs-grpc-sdk/dist/generated/users';
import {
  MarketDataRequest,
  SubscriptionAction,
  SubscriptionInterval,
} from 'invest-nodejs-grpc-sdk/dist/generated/marketdata';

import TradeShare from './tradeShare';
import { Strategies } from './strategies';
import * as strategies from './strategies';
import AccountService from './accountService';
import { chooseFromConsole } from './consoleReader';
import { NoAccessException } from './exceptions';
import InstrumentsService from './instrumentsService';
import ExchangeService from './exchangeService';
import { PostOrderRequest } from 'invest-nodejs-grpc-sdk/dist/generated/orders';
import OrdersService from './ordersService';

/** TODO
  ** ✅ get all accounts
  ** ✅ choose account from console
  ** ✅ read tickers list from hardcode
  ** ✅ check if tickers from config are tradable
  ** ✅ check if exchange is open, if not wait till open
  ** ✅ subscribe for candles stream
  ** -- implement Example strategy
  ** -- post orders
  ** -- subscribe for order changes from strategy
*/

if (!process.env.TOKEN) {
  console.error('Необходимо подставить токен с полным доступ в переменную окружения TOKEN');
  process.exit(1);
}

// При значении true все заявки будут выставляться в режиме песочницы
const isSandbox = true;

const client = createSdk(process.env.TOKEN, 'DRublev');
const shares: { [ticker: string]: TradeShare } = {
  VEON: {
    candleInterval: SubscriptionInterval.SUBSCRIPTION_INTERVAL_ONE_MINUTE,
    maxToTradeAmount: 10,
    priceStep: 0.01,
    strategy: Strategies.Example,
  },
  // SPCE: { 
  //   candleInterval: SubscriptionInterval.SUBSCRIPTION_INTERVAL_ONE_MINUTE, 
  //   maxToTradeAmount: 10, 
  //   priceStep: 0.01, 
  //   strategy: Strategies.Example,
  // },
};
const instrumentsService = new InstrumentsService(client);
const exchangeService = new ExchangeService(client);
const ordersService = new OrdersService(client, isSandbox);
let accountId = null;
let tradableShares: Share[] = [];

const killSwitch = new AbortController();

/**
 * Статус работы бирж
 * Формат { SPB: true/false }
 */
let exchangesStatuses = {};
let watchIntervalId = null;


/**
 * Список событий для подписки
 * Может быть расширен с расширением функционала
 * Например, при добавлении поддержки подписки на события стакана
 */
const events = {
  receive: (figi: string) => `receive:${figi}`,
};
const candlesEventEmitter = new EventEmitter();
async function* getSubscribeCandlesRequest() {
  while (!killSwitch.signal.aborted) {
    await sleep(1000);
    yield MarketDataRequest.fromPartial({
      subscribeCandlesRequest: {
        subscriptionAction: SubscriptionAction.SUBSCRIPTION_ACTION_SUBSCRIBE,
        instruments: tradableShares
          .map((share) => ({
            figi: share.figi,
            interval: shares[share.ticker].candleInterval,
          })),
      },
    });
  }
};

const start = async () => {
  try {
    // await chooseAccount();
    await prepareSharesList();


    // Обновляем статус работы бирж с переодичностью в 1 час
    /* В качестве улучшения можно использовать механизм Pub/Sub
     * и подписываться на события изменения статуса работы биржи из сервиса ExchangeService
     */
    await watchForExchangeTimetable();
    // setTimeout(() => {
    //   exchangesStatuses['SPB'] = true;
    // }, 5000);
    watchIntervalId = setInterval(watchForExchangeTimetable, 1000 * 60); // 1 час

    // Код для подчитски мусора и остановки бота в непредвиденных ситуациях
    process.on('SIGINT', function () {
      killSwitch.abort();
      if (watchIntervalId) {
        clearInterval(watchIntervalId);
      }
    });

    const candlesStream = await client.marketDataStream.marketDataStream(getSubscribeCandlesRequest());
    const tradingPromises = tradableShares.map(startTrading);

    for await (const response of candlesStream) {
      // При получении новой свечи уведомляем всех подписчиков (коими являются стратегии) об этом
      if (response.candle) {
        console.log('128 index', response.candle);
        candlesEventEmitter.emit(events.receive(response.candle.figi), response.candle);
      }
      // } else {
      //   const o = Math.random();
      //   console.log('135 index', o);
      //   candlesEventEmitter.emit(events.receive('BBG000QCW561'), { figi: 'BBG000QCW561', open: o });
      // }
    }

    /*
    * Запуск псевдо-параллельной торговли по всем инструментов
    * В целях упрощения сделано на базе Promise.allSettled, эффективнее было бы использовать workerfarm или аналог
    */
    await Promise.allSettled(tradingPromises);
  } catch (e) {
    console.error(e);

    // Если какая-либо операция была в процессе выполнения (например, цикл торговли) - она будет отменена
    killSwitch.abort();
  }
};

/**
 * Вывести список аккаунтов и выбрать один из них
 * @returns {Promise<void>} Устанавливает accountId, выбранный пользователем из консоли
 */
const chooseAccount = async () => {
  try {
    const accountService = new AccountService(client, isSandbox);
    const allAccounts = await accountService.getList();

    const withTradeAccess = allAccounts
      .filter((account) => account.accessLevel === AccessLevel.ACCOUNT_ACCESS_LEVEL_FULL_ACCESS);

    const options = withTradeAccess.map((account) => ({
      name: `${account.name} | Статус: ${AccountStatus[account.status]} | Тип: ${AccountType[account.type]}`
        + ` | ${AccessLevel[account.accessLevel]}`,
      value: account.id,
    }));

    if (!options.length) {
      throw new NoAccessException('Нет аккаунта с доступом к торговле. Смените токен и попробуйте снова');
    }

    const chosen = await chooseFromConsole('Выберите аккаунт для торговли', options);
    accountId = chosen;

    return chosen;
  } catch (e) {
    if (e.name === 'NoAccessException') {
      console.error(e.message);
      return process.exit(1);
    }

    console.warn(`Ошибка при выборе аккаунта: ${e.message} \n Попробуйте снова`);
    return chooseAccount();
  }
};

/**
 * Получить список инструментов по конфигу, отфильтровать инструменты недоступные для торговли/покупки/продажи
 */
const prepareSharesList = async () => {
  try {
    console.info('Подготавливаю список инструментов...');
    const [availableShares, notFoundShares] = await instrumentsService.filterByAvailable(Object.keys(shares));
    if (notFoundShares.length) {
      const tickers = notFoundShares.map(s => s.ticker).join(', \n');
      console.warn(`Не найдены инструменты: ${tickers} \n Они будут проигнорированы`);
    }

    tradableShares = availableShares.filter((share) => {
      if (!share.apiTradeAvailableFlag) {
        console.warn(`${share.ticker} недоступен для торговли`);
        return false;
      }
      if (!share.buyAvailableFlag) {
        console.warn(`${share.ticker} недоступен для покупки`);
        return false;
      }
      if (!share.sellAvailableFlag) {
        console.warn(`${share.ticker} недоступен для продажи`);
        return false;
      }

      return true;
    });

    if (!tradableShares.length) {
      console.log('Нет доступных инструментов для торговли');
      process.exit(0);
    }
    console.info(`Запускаюсь на ${tradableShares.length} инструментах...`);
  } catch (e) {
    console.error('Ошибка при получении списка активов', e.message);
    process.exit(1);
  }
};

const watchForExchangeTimetable = async () => {
  try {
    if (!tradableShares.length) return;
    // Получаем список бирж, на которых торгуются акции
    const exchanges = tradableShares.reduce((acc, share) => {
      if (!acc.includes(share.exchange)) {
        acc.push(share.exchange);
      }
      return acc;
    }, []);

    // Обновляем текущий статус для каждой из интересующих нас бирж
    for (const exchange of exchanges) {
      try {
        const isWorking = await exchangeService.isWorking(exchange);
        console.info(`Обновляю статус биржи ${exchange} - ${isWorking ? 'работает' : 'не работает'}`);
        exchangesStatuses[exchange] = isWorking;
      } catch (e) {
        console.warn(`Ошибка при проверке работы биржи ${exchange}: ${e.message}`);
      }
    }
  } catch (e) {
    console.error('Ошибка при получении расписания работы биржи', e.message);
  }
};

const startTrading = async (share: Share) => {
  try {
    const shareTradeConfig: TradeShare = shares[share.ticker];
    if (!shareTradeConfig) {
      throw new ReferenceError(`Не найден конфиг для инструмента ${share.ticker}`);
    }

    const strategyKey = Strategies[shareTradeConfig.strategy];
    if (!strategies[strategyKey]) {
      throw new ReferenceError(` Не найдена стратегия для торговли ${shareTradeConfig.strategy}`);
    }

    console.info(`Запускаю стратегию ${strategyKey} для ${share.ticker}`);
    const strategy: strategies.IStrategy = new strategies[strategyKey](share, shareTradeConfig);

    if (!exchangesStatuses[share.exchange]) {
      console.warn(share.ticker, share.exchange, 'не работает, ожидаем изменения статуса работы биржи');
      while (!exchangesStatuses[share.exchange] && !killSwitch.signal.aborted) {
        await sleep(300);
      }
      console.info(share.ticker, share.exchange, ' снова работает, продолжаем торговлю');
    }

    candlesEventEmitter.on(events.receive(share.figi), async function (candle) {
      try {
        if (killSwitch.signal.aborted) return;
        console.debug('262 index', candle);
  
        const orders = strategy.onCandle(candle);
        console.debug('275 index', orders);
        if (orders) {
          for await (const order of orders) {
            const orderId = await ordersService.postOrder(order);
            if (orderId) {
              console.info(`Отправлена заявка ${orderId} на инструмент ${share.ticker}`);
              const orderTrades = await ordersService.watchForOrder(orderId, killSwitch.signal);
              if (orderTrades) {
                for await (const trade of orderTrades) {
                  await strategy.onChangeOrder(trade);
                }
              }
            }
          }
        }
      } catch (e) {
        console.error(share.ticker, `Ошибка при обработке свечи: ${e.message}`);
      }
    });
  } catch (e) {
    console.error(share.ticker, ' Ошибка при торговле', e.message);
    if (!(e instanceof ReferenceError)) {
      console.info(share.ticker, ' Пытаемся снова');
      return startTrading(share);
    }
  }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

start();