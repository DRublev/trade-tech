import { IIpcRenderer } from "./preload";

declare global {
  interface Window { ipc: IIpcRenderer; }
}
