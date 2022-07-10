import { IAccountService, Account, Positions, Portfolio } from "@/app/types/account";
import ioc, { ids } from "../ioc";
import { TinkoffClient } from "../client";


export default class AccountsService implements IAccountService {
  private client: TinkoffClient;

  constructor() {
    this.client = ioc.get<TinkoffClient>(ids.Client);
  }


  public async getList(): Promise<Account[]> {
    const response = await this.client.users.getAccounts({});
    return response.accounts;
  }

  public async getPositions(accountId: string): Promise<Positions> {
    const response = await this.client.operations.getPositions({ accountId });
    return response;
  }

  public async getPortfolio(accountId: string): Promise<Portfolio> {
    const response = await this.client.operations.getPortfolio({ accountId });
    return response;
  }
}