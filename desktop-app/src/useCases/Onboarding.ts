import Store from '@/modules/Store';
import ipcEvents from '@/ipcEvents';

export default class OnboardingUseCase {
  private mode: any;
  private isTokenEntered = false;

  public setMode(isSandbox: boolean) {
    // TODO: Add analytics
    this.mode = isSandbox ? 'sandbox' : 'production';
    Store.IsSandbox = isSandbox;
  }

  public get Mode() {
    return this.mode;
  }
  public get HasToken() {
    return this.isTokenEntered;
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