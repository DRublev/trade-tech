import 'dotenv/config';
import * as fs from 'fs';
import { Duplex } from "stream";
import { randomUUID } from 'crypto';
import { Strategies, getStrategyConstructor, IStrategy } from 'shared-kernel';
import logger from './old/logger';
import Sdk from './sdk';
import assembleSdk from 'shared-kernel/built/src/infra/tinkoff/sdk';

if (!process.env.TINKOFF_TOKEN) {
  logger.error('Необходимо подставить токен с полным доступ в переменную окружения TOKEN');
  process.exit(1);
}

process.on('exit', (code) => {
  console.log('Exit with code', code);
});
process.on('uncaughtException', console.error);

export const createSdk = (isSandbox: boolean, token: string) => {
  const mainBuild: Function = assembleSdk;
  Sdk.bindSdk(mainBuild(token, isSandbox), isSandbox);
}



let watchIntervalId = null;
let watchOrderIntervalIds: Record<string, any> = {};
const accountId = process.env.TINKOFF_ACCOUNT_ID;

let logsFileStream: fs.WriteStream;
let strategy: IStrategy;

const isSandbox = false;

const config = {
  // figi: 'BBG000L69KL5', // TCX
  // parameters: {
  //   availableBalance: 50,
  //   maxHolding: 1,
  //   minSpread: 0.04,
  //   moveOrdersOnStep: 1,
  //   lotsDistribution: 1,
  //   stopLoss: 0.4,
  // }
  // figi: 'BBG00H19F184',
  //   parameters: {
  //     availableBalance: 7,
  //     maxHolding: 1,
  //     minSpread: 0.04,
  //     moveOrdersOnStep: 1,
  //     lotsDistribution: 1,
  //     stopLoss: 0.08,
  //     watchAsk: 2,
  //   }
  
    figi: 'BBG00DHTYPH8', // GTLB
    parameters: {
      availableBalance: 53,
      maxHolding: 1,
      minSpread: 0.09,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.4,
    }
};

const start = async () => {
  try {
    process.on('SIGINT', async function () {
      if (watchIntervalId) {
        clearInterval(watchIntervalId);
      }
      Object.values(watchOrderIntervalIds).forEach((id) => clearInterval(id));
    });

    if (!Sdk.IsSdkBinded) {
      console.log('39 trading', 'not binded sdk');
      await createSdk(isSandbox, process.env.TINKOFF_TOKEN);
    }

    const StrategyConstructor = getStrategyConstructor(Strategies.SpreadScalping);
    const logStream = makeLogStream();
    console.log('28 worker', config);
    strategy = new StrategyConstructor(config.parameters, postOrder, cancelOrder, logStream);

    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    if (!fs.existsSync(`logs/${todayFormatted}`)) {
      fs.mkdirSync(`logs/${todayFormatted}`);
    }
    logsFileStream = fs.createWriteStream(
      `logs/${todayFormatted}/${config.figi}_spread_v${strategy.Version}.log`,
      { flags: 'a' },
    );
    logsFileStream.write(`\n---------- ${new Date().toTimeString()} \n`);


    const watchOrders = async (): Promise<any> => {
      try {
        const orderTradesStream = await Sdk.Sdk.OrdersService.getOrdersStream(accountId);
        for await (const trade of orderTradesStream) {
          logger.info(`Order ${trade.orderId} changed`, trade);
          strategy.onOrderChanged(trade);
          if (trade.lotsExecuted === trade.lotsRequested) {
            logger.info(`Order ${trade.orderId} completed, unsubscribing`);
            Sdk.Sdk.OrdersService.unsubscribe(trade.orderId);
          }
        }
      } catch (e) {
        logger.error(e);
        return watchOrders();
      }
    };

    const orderBookSubscribe = async () => {
      const stream = Sdk.Sdk.OrderbookStreamProvider.subscribe([{ figi: config.figi, depth: 20 }]);
      for await (const orderbook of stream) {
        try {
          await strategy.onOrderbook(orderbook);
        } catch (e) {
          logger.error(e);
        }
      }
    };
    await Promise.allSettled([orderBookSubscribe(), watchOrders()]);

  } catch (e) {
    logger.emerg(e);
  }
};

const postOrder = async (figi: string, lots: number, pricePerLot: number, isBuy: boolean) => {
  const orderId = randomUUID();
  console.log('61 trading', lots, pricePerLot);
  const placedOrderId = await Sdk.Sdk.OrdersService.place({
    figi,
    quantity: lots,
    price: pricePerLot,
    orderType: 'LIMIT',
    direction: isBuy ? 'BUY' : 'SELL',
    orderId,
    accountId,
  });
  Sdk.Sdk.OrdersService.subscribe([placedOrderId]);
  return placedOrderId;
};

const cancelOrder = async (orderId: string) => {
  logger.info(`Cancel order ${orderId}`);
  await Sdk.Sdk.OrdersService.cancel(orderId, accountId);
  Sdk.Sdk.OrdersService.unsubscribe(orderId);
};

const makeLogStream = (): Duplex => {
  const logStream = new Duplex();

  logStream.pipe(process.stdout);
  logStream._write = (chunk: Uint8Array, encoding, next) => {
    console.log(chunk.toString())
    if (logsFileStream) {
      logsFileStream.write(new Date().toLocaleTimeString() + ' ' + chunk);
    }
    next();
  };
  logStream._read = (s: any) => { };

  return logStream;
}

start();
