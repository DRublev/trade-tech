import { AccountId, IAccountProvider } from "@/app/types/account";
import { injectable } from "inversify";

@injectable()
export default class AccountProvider implements IAccountProvider {
  private accountId: AccountId = null as any;

  setId(id: string): void {
    this.accountId = id;
  }
  getId(): string {
    return this.accountId;
  }

  public get Id(): AccountId {
    return this.accountId;
  }
}
