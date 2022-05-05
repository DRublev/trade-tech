import 'dotenv/config';
import { createSdk } from 'invest-nodejs-grpc-sdk';

import TradeShare from './tradeShare';
import { Strategies } from './strategies';
import * as strategies from './strategies';
import AccountService from './accountService';
import { AccessLevel, AccountStatus, AccountType } from 'invest-nodejs-grpc-sdk/dist/generated/users';
import { chooseFromConsole } from './consoleReader';
import { NoAccessException } from './exceptions';
import InstrumentsService from './instrumentsService';
import ExchangeService from './exchangeService';
import { Share } from 'invest-nodejs-grpc-sdk/dist/generated/instruments';

/** TODO
  ** ✅ get all accounts
  ** ✅ choose account from console
  ** ✅ read tickers list from hardcode
  ** ✅ check if tickers from config are tradable
  ** -- check if exchange is open, if not wait till open
  ** -- subscribe for candles stream
  ** -- poll orders
  ** -- 
  ** -- 
  ** -- 
  ** -- 
*/

if (!process.env.TOKEN) {
  console.error('Необходимо подставить токен с полным доступ в переменную окружения TOKEN');
  process.exit(1);
}

const client = createSdk(process.env.TOKEN, 'DRublev');
const shares: { [ticker: string]: TradeShare } = {
  VEON: { maxToTradeAmount: 10, priceStep: 0.01, strategy: Strategies.Example },
  SBER: { maxToTradeAmount: 10, priceStep: 0.01, strategy: Strategies.Example },
  // SPCE: { maxToTradeAmount: 10, priceStep: 0.01, strategy: Strategies.Example },
};
const instrumentsService = new InstrumentsService(client);
const exchangeService = new ExchangeService(client);
let accountId = null;
let tradableShares: Share[] = [];


/**
 * Статус работы бирж
 */
let exchangesStatuses = {};
let watchIntervalId;

const start = async () => {
  try {
    // await chooseAccount();

    await prepareSharesList();


    await watchForExchangeTimetable();
    // Обновляем статус работы бирж с переодичностью в 1 час
    /* В качестве улучшения можно использовать механизм Pub/Sub
       и подписываться на события изменения статуса работы биржи из сервиса ExchangeService
    */
    watchIntervalId = setInterval(watchForExchangeTimetable, 1000 * 60); // 1 час
    process.on('beforeExit', () => {
      if (watchIntervalId) {
        clearInterval(watchIntervalId);
      }
    });

    await startTrading();

  } catch (e) {
    console.error(e);
  }
};

/**
 * Вывести список аккаунтов и выбрать один из них
 * @returns {Promise<void>} Устанавливает accountId, выбранный пользователем
 */
const chooseAccount = async () => {
  try {
    const accountService = new AccountService(client);
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

const prepareSharesList = async () => {
  try {
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
    for await (const exchange of exchanges) {
      try {
        const isWorking = await exchangeService.isWorking(exchange);
        exchangesStatuses[exchange] = isWorking;
      } catch (e) {
        console.warn(`Ошибка при проверке работы биржи ${exchange}: ${e.message}`);
      }
    }
  } catch (e) {
    console.error('Ошибка при получении расписания работы биржи', e.message);
  }
};

const startTrading = async () => {
  return;
};

start();