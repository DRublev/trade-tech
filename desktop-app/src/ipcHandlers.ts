import { ipcMain, safeStorage } from 'electron';
import events from './ipcEvents';
import CacheAccessor from './modules/node/CacheAccessor';

type StoreStructure = {
  sandboxToken: string | null;
  readonlyToken: string | null;
  fullAccessToken: string | null;
  isSandbox: boolean;
}
const storage = new CacheAccessor('dev', 'store');


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
