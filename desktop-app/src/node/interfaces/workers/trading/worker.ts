import { workerData, parentPort } from "worker_threads";
import * as fs from 'fs';
import { Duplex } from "stream";
import { randomUUID } from 'crypto';
import { Strategies, getStrategyConstructor, IStrategy } from 'shared-kernel';

import logger from '@/node/infra/Logger';
import { TinkoffSdk } from '@/node/app/tinkoff';
import storage from '@/node/infra/Storage';


const accountId = storage.get('accountId');

let logsFileStream: fs.WriteStream;
let strategy: IStrategy;

const startStrategy = async () => {
  try {
    const StrategyConstructor = getStrategyConstructor(Strategies.SpreadScalping);
    const logStream = makeLogStream();
    strategy = new StrategyConstructor(workerData, postOrder, cancelOrder, logStream);

    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }
    logsFileStream = fs.createWriteStream(
      `logs/${todayFormatted}_${workerData.figi}_spread_v${strategy.Version}.log`,
      { flags: 'a' },
    );
    logsFileStream.write(`\n---------- ${new Date().toTimeString} \n`);


    const watchOrders = async (): Promise<any> => {
      try {
        const orderTradesStream = await TinkoffSdk.Sdk.OrdersService.getOrdersStream(accountId);
        for await (const trade of orderTradesStream) {
          logger.info(`Order ${trade.orderId} changed`, trade);
          strategy.onOrderChanged(trade);
          if (trade.lotsExecuted === trade.lotsRequested) {
            logger.info(`Order ${trade.orderId} completed, unsubscribing`);
            TinkoffSdk.Sdk.OrdersService.unsubscribe(trade.orderId);
          }
        }
      } catch (e) {
        logger.error(e);
        return watchOrders();
      }
    };

    const orderBookSubscribe = async () => {
      const stream = TinkoffSdk.Sdk.OrderbookStreamProvider.subscribe([{ figi: workerData.figi, depth: 20 }]);
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
    console.log('10 worker', e);
    logger.error('START_TRADING', e);
  }
};

const postOrder = async (figi: string, lots: number, pricePerLot: number, isBuy: boolean) => {
  const orderId = randomUUID();
  console.log('61 trading', lots, pricePerLot);
  const placedOrderId = await TinkoffSdk.Sdk.OrdersService.place({
    figi,
    quantity: lots,
    price: pricePerLot,
    orderType: 'LIMIT',
    direction: isBuy ? 'BUY' : 'SELL',
    orderId,
    accountId,
  });
  TinkoffSdk.Sdk.OrdersService.subscribe([placedOrderId]);
  return placedOrderId;
};

const cancelOrder = async (orderId: string) => {
  logger.info(`Cancel order ${orderId}`);
  await TinkoffSdk.Sdk.OrdersService.cancel(orderId, accountId);
  TinkoffSdk.Sdk.OrdersService.unsubscribe(orderId);
};

const makeLogStream = (): Duplex => {
  const logStream = new Duplex();

  logStream.pipe(process.stdout);
  logStream._write = (chunk: Uint8Array, encoding, next) => {
    parentPort?.postMessage(chunk);
    if (logsFileStream) {
      logsFileStream.write(new Date().toLocaleTimeString() + ' ' + chunk);
    }
    next();
  };
  logStream._read = (s: any) => { };

  return logStream;
}

parentPort?.on('message', (command) => {
  if (command.type === 'pause-strategy') {
    if (strategy && strategy.IsWorking) {
      strategy.toggleWorking();
    }
  } else if (command.type === 'resume-strategy') {
    if (strategy && !strategy.IsWorking) {
      strategy.toggleWorking();
    }
  }
});

if (workerData.type && workerData.type === 'start-strategy') {
  startStrategy();
}

