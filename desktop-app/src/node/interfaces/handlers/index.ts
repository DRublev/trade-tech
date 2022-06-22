import { ipcMain, safeStorage } from 'electron';
import ioc from 'shared-kernel/src/ioc';

import { TinkoffAccountsService, TinkoffSdk } from '@/node/app/tinkoff';
import logger from '@/node/infra/Logger';
import storage from '@/node/infra/Storage';
import events from '../events';
import { Timeframes } from 'shared-kernel/src/app/types/candle';

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


ipcMain.handle(events.ENCRYPT_STRING, (event, data) => {
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

ipcMain.on(events.DECRYPT_STRING, (event, data: Buffer) => {
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
 
ipcMain.handle(events.SAVE_TO_STORE, async (event, command: { key: keyof StoreStructure, value: any }) => {
  try {
    await storage.save(command.key, command.value);
    return storage.get(command.key);
  } catch (e) {
    logger.error(e);
    throw e;
  }
});

ipcMain.on(events.GET_FROM_STORE, (event, command: { key: keyof StoreStructure }) => {
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

ipcMain.handle(events.TINKOFF_CREATE_SDK, (event, options: { isSandbox: boolean }) => {
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

ipcMain.handle(events.TINKOFF_GET_ACCOUNTS, async (event, options: any) => {
  return getAccounts();
});

ipcMain.handle(events.TINKOFF_SUBSCRIBE_ON_CANDLES, async (event, data: { figi: string }) => {
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

ipcMain.on(events.TINKOFF_GET_CANDLES_STREAM, async (event, data) => {
  try {
    if (!TinkoffSdk.IsSdkBinded) {
      const isSandbox = storage.get('isSandbox');
      await createSdk(isSandbox);
    }
    const stream = await TinkoffSdk.Sdk.CanddlesStreamSubscriber.stream();
    for await (const candle of stream) {
      console.log('133 index', candle);
      event.sender.send(events.TINKOFF_ON_CANDLES_STREAM, candle);
    }
  } catch (e) {
    logger.error('TINKOFF_GET_CANDLES_STREAM', e);
    event.returnValue = e;
  }
});
