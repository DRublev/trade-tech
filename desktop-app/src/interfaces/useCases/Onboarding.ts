import Store from '@/domain/Store';
// TODO: Restrict import from 'interfaces' level from here
import ipcEvents from '@/infra/ipc/ipcEvents';

export default class OnboardingUseCase {
  private mode: any;
  private isTokenEntered = false;
  private account = null;
  private accounts = [];


  public get Mode() {
    return this.mode;
  }
  public get HasToken() {
    return this.isTokenEntered;
  }
  public get Account() {
    return this.account;
  }

  public set Account(value: any) {
    console.log('27 Onboarding', value);
  }

  public get AccountsList() {
    return this.accounts;
  }

  public async buildSdk() {
    await (window as any).ipc.invoke(ipcEvents.TINKOFF_CREATE_SDK, { isSandbox: true });
  }

  public async fetchAccounts() {
    try {
      const accounts = await (window as any).ipc.invoke(ipcEvents.TINKOFF_GET_ACCOUNTS, {});
      console.log('32 Onboarding', accounts);
      this.accounts = accounts;
    } catch (e) {
      console.error(e);
      throw e;
   }
  }

  public setMode(isSandbox: boolean) {
    // TODO: Add analytics
    this.mode = isSandbox ? 'sandbox' : 'production';
    Store.IsSandbox = isSandbox;
  }

  public setSandboxToken(token: string) {
    try {
      const res = (window as any).ipc.sendSync(ipcEvents.ENCRYPT_STRING, token);
      if (res instanceof Error) throw res;
      Store.Token = res;
      this.isTokenEntered = !!res;
    } catch(e) {
      console.error(e);
    }
  }

}