import Store from "@/node/domain/Store";
import { ipcEvents } from "@/constants";
import Analytics from "./analytics";
import { eventTypes } from "./analytics/constants";

export default class OnboardingUseCase {
  private mode: any = Store.Mode;
  private isTokenEntered = false;
  private account = Store.Account;
  private accounts = [];

  public get Mode() {
    return this.mode;
  }
  public get HasToken() {
    return Store.HasToken || this.isTokenEntered;
  }
  public get Account() {
    return this.account;
  }

  public set Account(value: any) {
    Store.Account = value;
    Analytics.sendEvent(eventTypes.setAccount, {});
  }

  public get AccountsList() {
    return this.accounts;
  }

  public async buildSdk() {
    if (!this.isTokenEntered) throw new Error("No token");
    await window.ipc.invoke(ipcEvents.TINKOFF_CREATE_SDK, {
      isSandbox: this.mode === "sandbox",
    });
  }

  public async fetchAccounts() {
    try {
      const accounts = await window.ipc.invoke(
        ipcEvents.TINKOFF_GET_ACCOUNTS,
        {}
      );
      this.accounts = accounts;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  public setMode(isSandbox: boolean) {
    // TODO: Add analytics
    this.mode = isSandbox ? "sandbox" : "production";
    Analytics.sendEvent(eventTypes.mode, { type: this.mode });
    Store.IsSandbox = isSandbox;
  }

  public async setSandboxToken(token: string) {
    try {
      const res = await (window as any).ipc.invoke(
        ipcEvents.ENCRYPT_STRING,
        token
      );
      if (res instanceof Error) throw res;
      await Store.SetSandboxToken(res);
      this.isTokenEntered = true;
      Analytics.sendEvent(eventTypes.setToken, { type: "sandbox" });
    } catch (e) {
      console.error(e);
    }
  }

  public async setRealTokens(readOnlyToken: string, fullAccessToken: string) {
    try {
      const readOnlyEncrypted = await (window as any).ipc.invoke(
        ipcEvents.ENCRYPT_STRING,
        readOnlyToken
      );
      const fullAccessEncrypted = await (window as any).ipc.invoke(
        ipcEvents.ENCRYPT_STRING,
        fullAccessToken
      );

      await Store.SetRealTokens(readOnlyEncrypted, fullAccessEncrypted);
      console.log(Store.HasToken);
      this.isTokenEntered = true;
      Analytics.sendEvent(eventTypes.setToken, { type: "real" });
    } catch (e) {
      console.error(e);
    }
  }
}
