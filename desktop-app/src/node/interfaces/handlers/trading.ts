import { ipcMain, safeStorage } from 'electron';

import { ipcEvents } from '@/constants';
import logger from '@/node/infra/Logger';
import storage from '@/node/infra/Storage';
import { pauseStrategy, startStrategy, changeConfig } from '../workers/trading';
import { StartTradingCmd } from '../commands';


const runningTradingWorkers: { [figi: string]: number } = {};

const getToken = (isSandbox: boolean) => {
  const storedToken = storage.getAll()[isSandbox ? 'sandboxToken' : 'fullAccessToken'];
  if (!storedToken) throw new Error('No stored token');
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available');
  }
  const token = safeStorage.decryptString(Buffer.from(Object.values(storedToken) as any));
  return token;
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

    const isSandbox = storage.get('isSandbox');
    const token = getToken(isSandbox);
    logger.info('Start trading');

    const tradingPromise = startStrategy(
      token,
      data,
      (chunk) => event.sender.send(ipcEvents.strategylog, chunk),
      (id) => {
        runningTradingWorkers[data.figi] = id;
      },
    );
    await tradingPromise;
   
  } catch (e: any) {
    console.log('55 trading', e);
    logger.error('START_TRADING', e.toString());
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

ipcMain.handle(ipcEvents.CHANGE_CONFIG, async (event, data) => {
  try {
    if (!runningTradingWorkers[data.figi]) throw new ReferenceError(`No working strategy for ${data.figi} was found`);
    await changeConfig(runningTradingWorkers[data.figi], data.config);
  } catch(e) {
    logger.error('CHANGE_CONFIG', e);
  }
});
