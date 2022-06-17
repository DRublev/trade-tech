import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { Duplex } from 'stream';
import { ipcMain, safeStorage } from 'electron';
import { Strategies, getStrategyConstructor, IStrategy } from 'shared-kernel';
import ioc from 'shared-kernel/src/ioc';

import { TinkoffSdk } from '@/node/app/tinkoff';
import logger from '@/node/infra/Logger';
import storage from '@/node/infra/Storage';
import events from '../events';

export type StartTradingCmd = {
  figi: string;
  parameters: {
    availableBalance: number;
    maxHolding: number;
    minSpread: number;
    moveOrdersOnStep: number;
    lotsDistribution: number;
  }
};

const WorkingStrategies: { [ticker: string]: IStrategy } = {};

const createSdk = (isSandbox: boolean) => {
  const storedToken = storage.getAll()[isSandbox ? 'sandboxToken' : 'fullAccessToken'];
  if (!storedToken) throw new Error('No stored token');
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available');
  }
  const token = safeStorage.decryptString(Buffer.from(Object.values(storedToken) as any));
  const mainBuild: Function = ioc.get(Symbol.for("TinkoffBuildClientFunc"));
  TinkoffSdk.bindSdk(mainBuild(token, isSandbox), isSandbox);
}
const today = new Date();
const todayFormatted = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;


ipcMain.on(events.START_TRADING, async (event, data: StartTradingCmd) => {
  try {
    if (!data.figi) throw new TypeError('Figi is not defined');
    if (WorkingStrategies[data.figi]) {
      const strategy: IStrategy = WorkingStrategies[data.figi];
      strategy.toggleWorking();
      event.returnValue = true;
      return;
    }
    if (!data.parameters) throw new TypeError('Parameters is not defined');
    if (!TinkoffSdk.IsSdkBinded) {
      const isSandbox = storage.get('isSandbox');
      await createSdk(isSandbox);
    }
    const accountId = storage.get('accountId');
    logger.info('Start trading');

    const strategyConstructor = getStrategyConstructor(Strategies.SpreadScalping);

    const orderbookLogStream = fs.createWriteStream(`${todayFormatted}_${data.figi}_spread.log`, { flags: 'a' });
    const logstream = new Duplex();
    logstream.pipe(process.stdout);
    orderbookLogStream.write('\n----------\n');

    logstream._write = (chunk, encoding, next) => {
      event.sender.send('strategylog', chunk);
      orderbookLogStream.write(new Date().toLocaleTimeString() + ' ' + chunk);
      next();
    };
    logstream._read = (s: any) => { };
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


    const strategy = new strategyConstructor(data.parameters, postOrder, cancelOrder, logstream);
    WorkingStrategies[data.figi] = strategy;

    const watchOrders = async (): Promise<any> => {
      try {
        const orderTradesStream = await TinkoffSdk.Sdk.OrdersService.getOrdersStream(accountId);
        console.log('88 trading', 'order stream');
        for await (const trade of orderTradesStream) {
          console.log('90 trading got order state changed');
          logger.info(`Order ${trade.orderId} changed`, trade);
          strategy.onOrderChanged(trade);
        }
      } catch (e) {
        console.log('96 trading', e);
        return watchOrders();
      }
    };

    const orderBookSubscribe = async () => {
      const stream = TinkoffSdk.Sdk.OrderbookStreamProvider.subscribe([{ figi: data.figi, depth: 20 }]);
      for await (const orderbook of stream) {
        try {
          console.log('96 trading got orderbook');
          await strategy.onOrderbook(orderbook);
        } catch (e) {
          logger.error(e);
        }
      }
    };
    console.log('103 trading');
    await Promise.allSettled([orderBookSubscribe(), watchOrders()]);
  } catch (e) {
    logger.error('START_TRADING', e);
  }
});

ipcMain.handle(events.PAUSE_TRADING, async (event, data) => {
  try {
    if (!data.figi) throw new TypeError('Figi is not defined');
    if (!WorkingStrategies[data.figi]) throw new ReferenceError(`No working strategy for ${data.figi} was found`);
    if (WorkingStrategies[data.figi]) {
      const strategy: IStrategy = WorkingStrategies[data.figi];
      strategy.toggleWorking();
    }
  } catch (e) {
    logger.error('PAUSE_TRADING', e);
  }
});


