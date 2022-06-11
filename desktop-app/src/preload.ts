import { contextBridge, ipcRenderer } from 'electron';

const validChannels = ['READ_FILE', 'WRITE_FILE'];

contextBridge.exposeInMainWorld(
  'ipc', {
    send: (channel: any, data: any) => {
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    on: (channel: any, func: any) => {
      if (validChannels.includes(channel)) {
        // Strip event as it includes `sender` and is a security risk
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
  },
);