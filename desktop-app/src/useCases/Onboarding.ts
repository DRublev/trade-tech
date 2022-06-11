import Store from '@/modules/Store';
import ipcEvents from '@/ipcEvents';

export default class OnboardingUseCase {
  private mode: any;
  private isTokenEntered = false;

  public setMode(isSandbox: boolean) {
    // TODO: Add analytics
    this.mode = isSandbox ? 'sandbox' : 'production';
  }

  public get Mode() {
    return this.mode;
  }
  public get HasToken() {
    return this.isTokenEntered;
  }

  public setSandboxToken(token: string) {
    try {
      const res = (window as any).ipc.sendSync(ipcEvents.SAVE_SANDBOX_TOKEN, token);
      if (res instanceof Error) throw res;

      this.isTokenEntered = !!res;
    } catch(e) {
      console.error(e);
    }
  }
}