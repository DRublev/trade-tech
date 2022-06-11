import { ipcMain, safeStorage } from 'electron';
import events from './ipcEvents';

ipcMain.on(events.SAVE_SANDBOX_TOKEN, (event, token) => {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available');
    }
    event.returnValue = safeStorage.encryptString(token).toString();
  } catch (e) {
    event.returnValue = e;
  }
});