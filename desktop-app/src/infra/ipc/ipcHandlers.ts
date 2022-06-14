import { ipcMain, safeStorage } from 'electron';
import ioc from 'shared-kernel/src/ioc';


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
if (process.env.CLEAR_STORE) {
  storage.clear();
}


ipcMain.handle(events.ENCRYPT_STRING, (event, data) => {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available');
    }
    const encrypted = safeStorage.encryptString(data);
    console.log('27 ipcHandlers', 'encrypt', data, encrypted);
    return encrypted;
  } catch (e) {
    console.error(e);
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
    console.error(e);
    event.returnValue = e;
  }
});

ipcMain.handle(events.SAVE_TO_STORE, async (event, command: { key: keyof StoreStructure, value: any }) => {
  try {
    console.log('50 ipcHandlers', command);
    await storage.save(command.key, command.value);
    console.log('50 ipcHandlers', 'saved', command);
    return storage.get(command.key);
  } catch (e) {
    console.error(e);
    throw e;
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

const createSdk = (isSandbox: boolean) => {
  const storedToken = storage.getAll()[isSandbox ? 'sandboxToken' : 'fullAccessToken'];
  console.log('70 ipcHandlers', isSandbox, Object.keys(storage.getAll()));
  if (!storedToken) throw new Error('No stored token');
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available');
  }
  const token = safeStorage.decryptString(Buffer.from(Object.values(storedToken) as any));
  const mainBuild: Function = ioc.get(Symbol.for("TinkoffBuildClientFunc"));
  TinkoffSdk.bindSdk(mainBuild(token), isSandbox);

}

ipcMain.handle(events.TINKOFF_CREATE_SDK, (event, options: { isSandbox: boolean }) => {
  try {
    createSdk(options.isSandbox);
    return true;
  } catch (e) {
    console.error(e);
    throw e;
  }
});

async function getAccounts(): Promise<any[]> {
  try {
    if (!TinkoffSdk.IsSdkBinded) {
      const isSandbox = storage.get('isSandbox');
      console.log('99 ipcHandlers', isSandbox);
      await createSdk(isSandbox);
    }
    const accounts = await TinkoffAccountsService.getList();
    return accounts.filter(account => account.accessLevel === 1 && account.type !== 3);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

ipcMain.handle(events.TINKOFF_GET_ACCOUNTS, async (event, options: any) => {
  return getAccounts();
});

