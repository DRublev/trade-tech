import { ipcEvents } from "@/constants";
import MoneyDTO, { BalanceEntity } from "./MoneyDTO";


class ActivesUseCase {
  private balance: { [code: string]: BalanceEntity } = {};

  public async fetchBalances() {
    try {
      const balances = await window.ipc.invoke(ipcEvents.TINKOFF_GET_POSITIONS, {});
      this.balance = MoneyDTO.toBalanceEntity(balances.money);
    } catch (e) {
      console.error('ActivesUseCase.fetchBalances', e);
    }
  }

  public get Balance() { return this.balance; }
}

const instance = new ActivesUseCase();
export default instance;
