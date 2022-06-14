import { TinkoffClient } from "shared-kernel/src/infra/tinkoff/client";

class TinkoffSdk {
  private static instance: TinkoffSdk;
  private sdk: TinkoffClient = null as any;
  private isSandbox = true;

  private constructor() { }

  public bindSdk(sdk: TinkoffClient, isSandbox: boolean) {
    this.sdk = sdk;
    console.log('12 Sdk', 'building sdk');
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

export default TinkoffSdk.Instance;
