import { contextBridge, ipcRenderer } from 'electron';
import ipcEvents from './ipcEvents';
/*
  Experimental security feature:
        We set the global "require" variable to null after importing what we need.
        Given that there is an exploit within the preload context, they lost require atleast.
        Garbage collection should pick it up.
*/
// @ts-ignore
require = null;


const validChannels = Object.values(ipcEvents);

class SafeIpcRenderer {
  [x: string]: (channel: string, ...args: any[]) => any;
  constructor (events: string[]) {
    const protect = (fn: any) => {
      return (channel: string, ...args: any[]) => {
        if (!events.includes(channel)) {
          throw new Error(`Blocked access to unknown channel ${channel} from the renderer. 
                          Add channel to whitelist in preload.js in case it is legitimate.`);
        }
        return fn.apply(ipcRenderer, [channel].concat(args));
      };
    };
    this.on = protect(ipcRenderer.on);
    this.once = protect(ipcRenderer.once);
    this.removeListener = protect(ipcRenderer.removeListener);
    this.removeAllListeners = protect(ipcRenderer.removeAllListeners);
    this.send = protect(ipcRenderer.send);
    this.sendSync = protect(ipcRenderer.sendSync);
    this.sendToHost = protect(ipcRenderer.sendToHost);
  }
}

contextBridge.exposeInMainWorld(
  'ipc', new SafeIpcRenderer(validChannels),
);
// contextBridge.exposeInMainWorld(
//   'ipc', {
//     send: (channel: any, data: any) => {
//       console.log('9 preload', channel);
//       if (validChannels.includes(channel)) {
//         ipcRenderer.send(channel, data);
//       }
//     },
//     on: (channel: any, func: any) => {
//       console.log('14 preload', channel);
//       if (validChannels.includes(channel)) {
//         // Strip event as it includes `sender` and is a security risk
//         ipcRenderer.on(channel, (event, ...args) => func(...args));
//       }
//     },
//   },
// );
