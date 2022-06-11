import ipcEvents from "@/ipcEvents";

class Store {
  private isSandbox = true;
  private _token = '';

  constructor() {
    if ((window as any).ipc) {
      const storedIsSandbox = (window as any).ipc.sendSync(ipcEvents.GET_FROM_STORE, { key: 'isSandbox' });
      console.log('10 Store', storedIsSandbox);
      this.isSandbox = !storedIsSandbox || storedIsSandbox instanceof Error ? true : Boolean(storedIsSandbox);

      const storedToken = (window as any).ipc
        .sendSync(ipcEvents.GET_FROM_STORE, { key: this.isSandbox ? 'sandboxToken' : 'fullAccessToken' });
      this._token = storedToken instanceof Error ? '' : storedToken;
    } else {
      console.error('No ipc detected');
    }
  }

  private get token() {
    return this._token;
  }
  
  public get HasToken(): boolean {
    return !!this.token;
  }
  public set Token(value: string) {
    try {
      if (this.isSandbox) {
        (window as any).ipc.sendSync(ipcEvents.SAVE_TO_STORE, { key: 'sandboxToken', value });
        (window as any).ipc.sendSync(ipcEvents.GET_FROM_STORE, { key: 'sandboxToken' });
      } else {
        (window as any).ipc.sendSync(ipcEvents.SAVE_TO_STORE, { key: 'fullAccessToken', value });
      }
    } catch (e) {
      console.error(e);
    }
  }

  public get IsSandbox() {
    return this.isSandbox;
  }
  public set IsSandbox(value: boolean) {
    (window as any).ipc.sendSync(ipcEvents.SAVE_TO_STORE, { key: 'isSandbox', value });
  }
}

const instance = new Store();

export default instance;