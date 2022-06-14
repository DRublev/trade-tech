import { IAccountService, Account } from "@/app/types/account";
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
}