import { ipcEvents } from "@/constants";

class Store {
  private isSandbox?: boolean = undefined;
  private _token = '';
  private _accountId = '';

  constructor() {
    if ((window as any).ipc) {
      const storedIsSandbox = (window as any).ipc.sendSync(ipcEvents.GET_FROM_STORE, { key: 'isSandbox' });
      console.log('11 Store', storedIsSandbox);
      if (storedIsSandbox !== undefined) {
        this.isSandbox = storedIsSandbox instanceof Error ? true : Boolean(storedIsSandbox);
      }

      const storedToken = (window as any).ipc
        .sendSync(ipcEvents.GET_FROM_STORE, { key: this.isSandbox ? 'sandboxToken' : 'fullAccessToken' });
      this._token = storedToken instanceof Error ? '' : storedToken;

      const storedAccountId = (window as any).ipc.sendSync(ipcEvents.GET_FROM_STORE, { key: 'accountId' });
      this._accountId = storedAccountId instanceof Error ? '' : storedAccountId;
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

  public get Mode(): string | undefined {
    if (this.isSandbox === undefined) return undefined;

    return this.isSandbox ? 'sandbox' : 'production';
  }

  public get HasAccountChosen(): boolean {
    return !!this._accountId;
  }

  public get Account() {
    return this._accountId;
  }


  public async SetSandboxToken(value: string): Promise<void> {
    try {
      await (window as any).ipc.invoke(ipcEvents.SAVE_TO_STORE, { key: 'sandboxToken', value });
    } catch (e) {
      console.error(e);
    }
  }

  public async SetRealTokens(readOnlyToken: string, fullAccessToken: string): Promise<void> {
    try {
      await (window as any).ipc.invoke(ipcEvents.SAVE_TO_STORE, { key: 'readOnlyToken', value: readOnlyToken });
      await (window as any).ipc.invoke(ipcEvents.SAVE_TO_STORE, { key: 'fullAccessToken', value: fullAccessToken });
    } catch (e) {
      console.error('SetRealTokens', e);
    }
  } 

  public set Account(value: any) {
    this._accountId = value;
    (async function () {
      await (window as any).ipc.invoke(ipcEvents.SAVE_TO_STORE, { key: 'accountId', value });
    })();
  }

  public get IsSandbox() {
    return this.isSandbox || true;
  }
  public set IsSandbox(value: boolean) {
    (async function () {
      await (window as any).ipc.invoke(ipcEvents.SAVE_TO_STORE, { key: 'isSandbox', value });
    })();
  }
}

const instance = new Store();

export default instance;