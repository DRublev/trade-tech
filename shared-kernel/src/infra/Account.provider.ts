import { AccountId, IAccountProvider } from "../app/types/account";

class AccountProvider implements IAccountProvider {
  private accountId: AccountId = null;

  setId(id: string): void {
    this.accountId = id;
  }
  getId(): string {
    return this.accountId;
  }

}
const instance = new AccountProvider();

export default instance;
