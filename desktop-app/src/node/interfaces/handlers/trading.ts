import { ipcMain, safeStorage } from 'electron';

import { ipcEvents } from '@/constants';
import logger from '@/node/infra/Logger';
import storage from '@/node/infra/Storage';
import TradingConfigPersistor from '@/node/infra/TradingConfigPersistor';
import { pauseStrategy, startStrategy, changeConfig } from '../workers/trading';
import { StartTradingCmd } from '../commands';


const runningTradingWorkers: { [figi: string]: number } = {};

const ConfigPersistor = new TradingConfigPersistor();

const getToken = (isSandbox: boolean) => {
  const storedToken = storage.getAll()[isSandbox ? 'sandboxToken' : 'fullAccessToken'];
  if (!storedToken) throw new Error('No stored token');
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available');
  }
  const token = safeStorage.decryptString(Buffer.from(Object.values(storedToken) as any));
  return token;
}

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
      (chunk) => event.sender.send(ipcEvents.STRATEGY_LOG, chunk),
      (id) => {
        runningTradingWorkers[data.figi] = id;
      },
    );
    await tradingPromise;
  } catch (e: any) {
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

ipcMain.handle(ipcEvents.CHANGE_STRATEGY_CONFIG, async (event, data) => {
  try {
    const changed = await ConfigPersistor.changeConfig(data.ticker, data);
    if (runningTradingWorkers[data.figi]) {
      await changeConfig(runningTradingWorkers[data.figi], changed.parameters);
    }
    return changed;
  } catch (e) {
    logger.error('CHANGE_STRATEGY_CONFIG', e);
  }
});

ipcMain.handle(ipcEvents.LOAD_STRATEGY_CONFIG, async (event, data) => {
  try {
    if (!data.ticker) throw new TypeError('Ticker is not defined');
    const config = ConfigPersistor.loadByTicker(data.ticker);
    return config;
  } catch (e) {
    logger.error('LOAD_CONFIG', e);
    throw e;
  }
});
