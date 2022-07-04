import { contextBridge, ipcRenderer } from 'electron';
import { ipcEvents } from '@/constants';
/*
  Experimental security feature:
        We set the global "require" variable to null after importing what we need.
        Given that there is an exploit within the preload context, they lost require atleast.
        Garbage collection should pick it up.
*/
// @ts-ignore
// require = null;


const validChannels = Object.values(ipcEvents);

export interface IIpcRenderer {
  on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
  once: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
  removeListener: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
  send: (channel: string, ...args: any[]) => void;
  sendSync: (channel: string, ...args: any[]) => void;
  sendToHost: (channel: string, ...args: any[]) => void;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

export class SafeIpcRenderer {
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
    this.invoke = protect(ipcRenderer.invoke);
  }
}

contextBridge.exposeInMainWorld(
  'ipc', new SafeIpcRenderer(validChannels),
);