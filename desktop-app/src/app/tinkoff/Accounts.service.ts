import { Account } from 'shared-kernel/src/app/types/account';
import { TinkoffSdk } from ".";

export default class AccountService {
  public static async getList(): Promise<Account[]> {
    try {
      const accounts = await TinkoffSdk.Sdk.AccountsService.getList();
      return accounts;
    } catch (e: any) {
      console.error(`Ошибка при получении списка аккаунтов: ${e.message}`);
      return [];
    }
  }
}