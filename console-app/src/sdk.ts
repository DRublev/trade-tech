import { TinkoffSdk } from "shared-kernel";


class TSdk {
  private static instance: TSdk;
  private sdk: TinkoffSdk = null as any;
  private isSandbox = true;

  private constructor() { }

  public bindSdk(sdk: TinkoffSdk, isSandbox: boolean) {
    this.sdk = sdk;
    this.isSandbox = isSandbox;
  }

  public IsSdkBinded = !!this.sdk;
  public get Sdk() {
    if (!this.sdk) throw new ReferenceError('Tinkoff SDK is not initialized');
    return this.sdk;
  }

  public get IsSandbox() {
    return this.isSandbox;
  }

  public static get Instance() {
    return this.instance || (this.instance = new this());
  }
}

export default TSdk.Instance;
