import { workerData, parentPort } from "worker_threads";
import * as fs from 'fs';
import { Duplex } from "stream";
import { randomUUID } from 'crypto';
import { Strategies, getStrategyConstructor, getStrategyStateConstructor, IStrategy } from 'shared-kernel';

import logger from '@/node/infra/Logger';
import { TinkoffSdk } from '@/node/app/tinkoff';
import storage from '@/node/infra/Storage';
import { createSdk } from '../helpers';


const accountId = storage.get('accountId');

let logsFileStream: fs.WriteStream;
let strategy: IStrategy;
let strategyState;

const startStrategy = async () => {
  try {
    if (!TinkoffSdk.IsSdkBinded) {
      console.log('39 trading', 'not binded sdk');
      await createSdk(storage.get('isSandbox'), workerData.token);
    }
    const StrategyConstructor = getStrategyConstructor(Strategies.SpreadScalping);
    const logStream = makeLogStream();
    console.log('28 worker', workerData.config);
    const StrategyStateConstructor = getStrategyStateConstructor(Strategies.SpreadScalping);
    strategyState = new StrategyStateConstructor(false, workerData.config.parameters.availableBalance, 0);
    strategy = new StrategyConstructor(workerData.config.parameters, strategyState, postOrder, cancelOrder, logStream);
    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    if (!fs.existsSync(`logs/${todayFormatted}`)) {
      fs.mkdirSync(`logs/${todayFormatted}`);
    }
    logsFileStream = fs.createWriteStream(
      `logs/${todayFormatted}/${workerData.config.figi}_spread_v${strategy.Version}.log`,
      { flags: 'a' },
    );
    logsFileStream.write(`\n---------- ${new Date().toTimeString()} \n`);


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
      const stream = TinkoffSdk.Sdk.OrderbookStreamProvider.subscribe([{ figi: workerData.config.figi, depth: 20 }]);
      for await (const orderbook of stream) {
        try {
          await strategy.onOrderbook(orderbook);
        } catch (e) {
          logger.error(e);
        }
      }
    };

    const candlesSubscribe = async () => {
      try {
        if (!strategy.onCandle || !strategy.Interval) return;
        TinkoffSdk.Sdk.CandlesStreamSubscriber.subscribe(workerData.config.figi, strategy.Interval);
        const stream = await TinkoffSdk.Sdk.CandlesStreamSubscriber.stream();
        for await (const candle of stream) {
          try {
            console.log('76 worker', 'got candle');
            await strategy.onCandle(candle);
          } catch (e) {
            logger.error(e);
          }
        }
      } catch (e) {
        logger.error('Error subscribing to candles', e);
      }
    };

    await Promise.allSettled([candlesSubscribe(), orderBookSubscribe(), watchOrders()]);

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
  } else if (command.type === 'change-config') {
    if (strategy) {
      strategy.changeConfig(command.config);
    }
  }
});

if (workerData.type && workerData.type === 'start-strategy') {
  startStrategy();
}

