import 'dotenv/config';
import { createSdk } from 'invest-nodejs-grpc-sdk';

import TradeShare from './tradeShare';
import { Strategies } from './strategies';
import * as strategies from './strategies';
import AccountService from './accountService';
import { AccessLevel, Account, AccountStatus, AccountType } from 'invest-nodejs-grpc-sdk/dist/generated/users';
import { chooseFromConsole } from './consoleReader';
import { NoAccessException } from './exceptions';
import InstrumentsService from './instrumentsService';

/** TODO
  ** -- get all accounts
  ** -- choose account from console
  ** -- read tickers list from hardcode
  ** -- check if tickers from config are tradable
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
const shares: { [ticker: string]: TradeShare }  = {
  VEON: { maxToTradeAmount: 10, priceStep: 0.01, strategy: Strategies.Example },
}
  // { ticker: 'SPCE', maxToTradeAmount: 10, priceStep: 0.01, strategy: Strategies.Example },
];
const instrumentsService = new InstrumentsService(client);
let accountId = null;

const start = async () => {
  try {
    await chooseAccount();

    const [availableShares, notFoundShares] = await instrumentsService.filterByAvailable(Object.keys(shares));
    console.warn(`Не найдены инструменты: ${notFoundShares.join(', \n')} \n Они будут проигнорированы`);
    const sharesToTrade = await instrumentsService.getSharesByTickers(availableShares);
    const tradableShares = sharesToTrade.filter((share) => {
      if (!share.apiTradeAvailableFlag) {
        console.warn(`${share.ticker} недоступен для торговли`)ж
        
      }
    });
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
    if (e.name  === 'NoAccessException') {
      console.error(e.message);
      return process.exit(1);
    }

    console.warn(`Ошибка при выборе аккаунта: ${e.message} \n Попробуйте снова`);
    return chooseAccount();
  }
};


start();