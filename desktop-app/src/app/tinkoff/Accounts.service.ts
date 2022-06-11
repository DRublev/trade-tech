// TODO: Replace with internal type from shared-kernel
import { Account } from "invest-nodejs-grpc-sdk/dist/generated/users";
import { TinkoffSdk } from ".";

export default class AccountService {
  public static async getList(): Promise<Account[]> {
    try {
      let response;
      if (TinkoffSdk.IsSandbox) {
        response = await TinkoffSdk.Sdk.sandbox.getSandboxAccounts({});
      } else {
        response = await TinkoffSdk.Sdk.users.getAccounts({});
      }
      return response.accounts;
    } catch (e: any) {
      console.error(`Ошибка при получении списка аккаунтов: ${e.message}`);
      return [];
    }
  }
}