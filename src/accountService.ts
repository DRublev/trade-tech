import { Account } from "invest-nodejs-grpc-sdk/dist/generated/users";
import { InvestSdk } from "./types";

export default class AccountService {
  private client: InvestSdk;

  constructor(client: InvestSdk) {
    if (!client) throw new Error('client is required');
    this.client = client;
  }

  public async getList(): Promise<Account[]> {
    try {
      const accounts = await this.client.users.getAccounts({});
      return accounts.accounts;
    } catch (e) {
      console.warn(`Ошибка при получении списка аккаунтов: ${e.message}`);
      return [];
    }
  }
}