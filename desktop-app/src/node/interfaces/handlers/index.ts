import { ipcMain, safeStorage } from 'electron';
import ioc from 'shared-kernel/src/ioc';
import { Timeframes } from 'shared-kernel/src/app/types/candle';

import { ipcEvents } from '@/constants';
import { TinkoffAccountsService, TinkoffSdk } from '@/node/app/tinkoff';
import logger from '@/node/infra/Logger';
import storage from '@/node/infra/Storage';

export * from './trading';

type StoreStructure = {
  sandboxToken: string | null;
  readonlyToken: string | null;
  fullAccessToken: string | null;
  isSandbox: boolean;
}
if (process.env.CLEAR_STORE) {
  storage.clear();
}


ipcMain.handle(ipcEvents.ENCRYPT_STRING, (event, data) => {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available');
    }
    const encrypted = safeStorage.encryptString(data);
    return encrypted;
  } catch (e) {
    logger.error(e);
    throw e;
  }
});

ipcMain.on(ipcEvents.DECRYPT_STRING, (event, data: Buffer) => {
  try {
    if (!(data instanceof Buffer)) throw new TypeError('Data is not a buffer');

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available');
    }

    event.returnValue = safeStorage.decryptString(data);
  } catch (e) {
    logger.error(e);
    event.returnValue = e;
  }
});

ipcMain.handle(ipcEvents.SAVE_TO_STORE, async (event, command: { key: keyof StoreStructure, value: any }) => {
  try {
    await storage.save(command.key, command.value);
    return storage.get(command.key);
  } catch (e) {
    logger.error(e);
    throw e;
  }
});

ipcMain.on(ipcEvents.GET_FROM_STORE, (event, command: { key: keyof StoreStructure }) => {
  try {
    const storedValue = storage.get(command.key);
    event.returnValue = storedValue;
  } catch (e) {
    logger.error(e);
    event.returnValue = e;
  }
});

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

ipcMain.handle(ipcEvents.TINKOFF_CREATE_SDK, (event, options: { isSandbox: boolean }) => {
  try {
    createSdk(options.isSandbox);
    return true;
  } catch (e) {
    logger.error(e);
    throw e;
  }
});

async function getAccounts(): Promise<any[]> {
  try {
    if (!TinkoffSdk.IsSdkBinded) {
      const isSandbox = storage.get('isSandbox');
      await createSdk(isSandbox);
    }
    // TODO: Replace with implementation from shared-kernel
    const accounts = await TinkoffAccountsService.getList();
    return accounts.filter(account => account.accessLevel === 1 && account.type !== 3);
  } catch (e) {
    logger.error(e);
    throw e;
  }
}

ipcMain.handle(ipcEvents.TINKOFF_GET_ACCOUNTS, async (event, options: any) => {
  return getAccounts();
});

ipcMain.handle(ipcEvents.TINKOFF_SUBSCRIBE_ON_CANDLES, async (event, data: { figi: string }) => {
  try {
    if (!TinkoffSdk.IsSdkBinded) {
      const isSandbox = storage.get('isSandbox');
      await createSdk(isSandbox);
    }
    console.log('117 index', data.figi);
    await TinkoffSdk.Sdk.CanddlesStreamSubscriber.subscribe(data.figi, Timeframes.OneMinute);
    return true;
  } catch (e) {
    logger.error('TINKOFF_SUBSCRIBE_ON_CANDLES', e);
  }
});


const toQuotation = (number: number) => {
  const decimal = (number - Math.floor(Number(number))).toFixed(9);
  return ({
  units: Math.floor(number),
  nano: decimal.slice(2) as any as number,
})};
ipcMain.on(ipcEvents.TINKOFF_GET_CANDLES_STREAM, async (event, data) => {
  try {
    if (data.debug) {
      let mins = 1;
      let hours = 18;
      const debugCandles: any = [
        {
          figi: 'BBG00DHTYPH8',
          interval: 1,
          open: { units: 52, nano: 400000000 },
          high: { units: 52, nano: 400000000 },
          low: { units: 52, nano: 400000000 },
          close: { units: 52, nano: 400000000 },
          volume: 100,
          time: `2022-06-29T18:${mins}:00.000Z`,
          lastTradeTs: `2022-06-29T18:${mins}:40.325Z`,
        },
      ];
      let idx = 0;
      const interval = setInterval(() => {
        if (debugCandles[idx]) {
          debugCandles[idx].time = `2022-06-29T${hours}:${mins.toString().padStart(2, '0')}:00.000Z`;
          event.sender.send(ipcEvents.TINKOFF_ON_CANDLES_STREAM, {...debugCandles[idx], time: new Date(debugCandles[idx].time).toString()});
          // idx++;
          if (mins === 59) {
            mins = 0;
            hours += 1;
          } else {
            mins += 1;
          }
        } else {
          clearInterval(interval);
        }
      }, 1000);
      return;
    }
    if (!TinkoffSdk.IsSdkBinded) {
      const isSandbox = storage.get('isSandbox');
      await createSdk(isSandbox);
    }
    const stream = await TinkoffSdk.Sdk.CanddlesStreamSubscriber.stream();
    for await (const candle of stream) {
      console.log('174 index', candle);
      event.sender.send(ipcEvents.TINKOFF_ON_CANDLES_STREAM, candle);
    }
  } catch (e) {
    logger.error('TINKOFF_GET_CANDLES_STREAM', e);
    event.returnValue = e;
  }
});
