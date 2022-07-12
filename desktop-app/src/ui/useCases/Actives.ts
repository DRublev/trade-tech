import { ipcEvents } from "@/constants";
import MoneyDTO, { BalanceEntity } from "./MoneyDTO";


class ActivesUseCase {
  private static instance: ActivesUseCase;
  private balance: { [code: string]: BalanceEntity } = {};

  private constructor() {}

  public async fetchBalances() {
    try {
      console.log('13 Actives', 'fetching balances');
      const balances = await window.ipc.invoke(ipcEvents.TINKOFF_GET_POSITIONS, {});
      console.log('15 Actives', 'balances fetched', balances);
      this.balance = MoneyDTO.toBalanceEntity(balances.money);
    } catch (e) {
      console.error('ActivesUseCase.fetchBalances', e);
    }
  }

  public get Balance() { return this.balance; }

  public static get Instance() {
    return this.instance || (this.instance = new this());
  }
}

export default ActivesUseCase.Instance;
