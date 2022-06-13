import { ipcMain, safeStorage } from 'electron';
import tinkoffIOC from 'shared-kernel/src/infra/tinkoff/ioc';
import { TinkoffClient } from 'shared-kernel/src/infra/tinkoff/client';

import CacheAccessor from '../CacheAccessor';
import events from './ipcEvents';
import { TinkoffAccountsService, TinkoffSdk } from '@/app/tinkoff';

type StoreStructure = {
  sandboxToken: string | null;
  readonlyToken: string | null;
  fullAccessToken: string | null;
  isSandbox: boolean;
}
const storage = new CacheAccessor('dev', 'store');
// if (process.env.CLEAR_STORE) {
  storage.clear();
// }


ipcMain.on(events.ENCRYPT_STRING, (event, data) => {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available');
    }
    event.returnValue = safeStorage.encryptString(data);
  } catch (e) {
    console.error(e);
    event.returnValue = e;
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
    console.error(e);
    event.returnValue = e;
  }
});

ipcMain.on(events.SAVE_TO_STORE, (event, command: { key: keyof StoreStructure, value: any }) => {
  try {
    storage.save(command.key, command.value);
    event.returnValue = true;
  } catch (e) {
    console.error(e);
    event.returnValue = e;
  }
});

ipcMain.on(events.GET_FROM_STORE, (event, command: { key: keyof StoreStructure }) => {
  try {
    const storedValue = storage.get(command.key);
    event.returnValue = storedValue;
  } catch (e) {
    console.error(e);
    event.returnValue = e;
  }
});

ipcMain.handle(events.TINKOFF_CREATE_SDK, (event, options: { isSandbox: boolean }) => {
  try {
    const storedToken = storage.get(options.isSandbox ? 'sandboxToken' : 'fullAccessToken');
    if (!storedToken) throw new Error('No stored token');
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available');
    }
    const token = safeStorage.decryptString(Buffer.from(Object.values(storedToken) as any));
    console.log('77 ipcHandlers', token, storedToken);
    const createTinkoffSdk: (token: string) => TinkoffClient = tinkoffIOC.get('BuildTinkoffClient');
    TinkoffSdk.bindSdk(createTinkoffSdk(token), options.isSandbox);

    event.returnValue = true;
  } catch (e) {
    console.error(e);
    event.returnValue = e;
  }
});

ipcMain.handle(events.TINKOFF_GET_ACCOUNTS, async (event, options: any) => {
  try {
    const accounts = await TinkoffAccountsService.getList();
    return accounts;
  } catch (e) {
    console.error(e);
    throw e;
  }
});
