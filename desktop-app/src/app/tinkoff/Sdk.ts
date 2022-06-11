import { TinkoffClient } from "shared-kernel/src/infra/tinkoff/client";

class TinkoffSdk {
  private static instance: TinkoffSdk;
  private sdk: TinkoffClient = null as any;

  private constructor() { }

  public bindSdk(sdk: TinkoffClient) {
    this.sdk = sdk;
  }

  public static get Instance() {
    return this.instance || (this.instance = new this());
  }
}

export default TinkoffSdk.Instance;
