import * as fs from 'fs';
import { ipcMain, safeStorage } from 'electron';
import { Strategies, getStrategyConstructor, IStrategy } from 'shared-kernel';

import logger from '@/infra/Logger';
import { TinkoffSdk } from '@/app/tinkoff';
import events from '../events';
import { Duplex } from 'stream';
import ioc from 'shared-kernel/src/ioc';
import storage from '@/infra/Storage';

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

ipcMain.on(events.START_TRADING, async (event, data: StartTradingCmd) => {
  try {
    if (!data.parameters) throw new TypeError('Parameters is not defined');
    if (!TinkoffSdk.IsSdkBinded) {
      const isSandbox = storage.get('isSandbox');
      await createSdk(isSandbox);
    }
    logger.info('Start trading');
    const strategyConstructor = getStrategyConstructor(Strategies.SpreadScalping);
    const orderbookLogStream = fs.createWriteStream(`${data.figi}_orderbook.log`);
    const logstream = new Duplex();
    logstream.pipe(process.stdout);
    logstream._write = (chunk, encoding, next) => {
      event.sender.send('strategylog', chunk);
      orderbookLogStream.write(chunk);
      next();
    };
    logstream._read = (s: any) => { };
    const postOrder = async (order: any) => {
      console.log('34 trading posting order', order);
      return ''
    };
    const cancelOrder = async (orderId: string) => {
      console.log('37 trading cancelling order', orderId);
    };
    const strategy = new strategyConstructor(data.parameters, postOrder, cancelOrder, logstream);
    WorkingStrategies[data.figi] = strategy;
    const stream = TinkoffSdk.Sdk.OrderbookStreamProvider.subscribe([{ figi: data.figi, depth: 20 }]);
    for await (const orderbook of stream) {
      try {
        await strategy.onOrderbook(orderbook);
      } catch (e) {
        logger.error(e);
      }
    }
  } catch (e) {
    logger.error('START_TRADING', e);
  }
});
