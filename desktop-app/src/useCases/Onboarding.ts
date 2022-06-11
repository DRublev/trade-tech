import Store from '@/modules/Store';

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
    console.log('16 Onboarding', 'Token entered');
    console.log('18 Onboarding', token);
    this.isTokenEntered = true;
  }

}