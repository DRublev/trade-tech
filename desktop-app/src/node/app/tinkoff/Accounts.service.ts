import { Account } from 'shared-kernel/src/app/types/account';
import logger from '@/node/infra/Logger';
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

  public static async getPositions() {
    try {
      const positions = await TinkoffSdk.Sdk.AccountsService.getList();
    } catch (e) {
      logger.error('Ошибка при получении позиций', e);
    }
  }
}