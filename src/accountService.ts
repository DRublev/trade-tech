import { Account } from "invest-nodejs-grpc-sdk/dist/generated/users";
import logger from "./logger";
import { InvestSdk } from "./types";

export default class AccountService {
  private readonly client: InvestSdk;
  private readonly isSandbox: boolean;

  constructor(client: InvestSdk, isSandbox: boolean) {
    if (!client) throw new Error('client is required');
    this.client = client;
    this.isSandbox = isSandbox;
  }

  public async getList(): Promise<Account[]> {
    try {
      let response;
      if (this.isSandbox) {
        response = await this.client.sandbox.getSandboxAccounts({});
      } else {
        response = await this.client.users.getAccounts({});
      }
      return response.accounts;
    } catch (e) {
      logger.warning(`Ошибка при получении списка аккаунтов: ${e.message}`);
      return [];
    }
  }
}