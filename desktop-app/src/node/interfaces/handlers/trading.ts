import { ipcMain, safeStorage } from 'electron';
import ioc from 'shared-kernel/src/ioc';

import { ipcEvents } from '@/constants';
import { TinkoffSdk } from '@/node/app/tinkoff';
import logger from '@/node/infra/Logger';
import storage from '@/node/infra/Storage';
import { pauseStrategy, startStrategy } from '../workers/trading';
import { StartTradingCmd } from '../commands';


const runningTradingWorkers: { [figi: string]: number } = {};

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

ipcMain.handle('test', async (event, data) => {
  try {
    
    return;
  } catch (e) {
    console.log('47 trading', e);
  }
});

ipcMain.on(ipcEvents.START_TRADING, async (event, data: StartTradingCmd) => {
  try {
    if (!data.figi) throw new TypeError('Figi is not defined');
    if (!data.parameters) throw new TypeError('Parameters is not defined');
    if (!TinkoffSdk.IsSdkBinded) {
      const isSandbox = storage.get('isSandbox');
      await createSdk(isSandbox);
    }
    logger.info('Start trading');

    const tradingPromise = startStrategy(
      data,
      (chunk) => event.sender.send(ipcEvents.strategylog, chunk),
      (id) => {
        runningTradingWorkers[data.figi] = id;
      },
    );
    await tradingPromise;
   
  } catch (e) {
    logger.error('START_TRADING', e);
  }
});

ipcMain.handle(ipcEvents.PAUSE_TRADING, async (event, data) => {
  try {
    if (!data.figi) throw new TypeError('Figi is not defined');
    if (!runningTradingWorkers[data.figi]) throw new ReferenceError(`No working strategy for ${data.figi} was found`);
    await pauseStrategy(runningTradingWorkers[data.figi]);
  } catch (e) {
    logger.error('PAUSE_TRADING', e);
  }
});


