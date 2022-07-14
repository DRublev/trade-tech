import { ipcEvents } from "@/constants";
import MoneyDTO, { BalanceEntity } from "./MoneyDTO";


type BalanceChangeListener = (balances: { [code: string]: BalanceEntity }) => void;

class ActivesUseCase {
  private static instance: ActivesUseCase;
  private balance: { [code: string]: BalanceEntity } = {};
  private listeners: BalanceChangeListener[] = [];
  private constructor() {}

  public async fetchBalances() {
    try {
      const balances = await window.ipc.invoke(ipcEvents.TINKOFF_GET_POSITIONS, {});
      this.balance = MoneyDTO.toBalanceEntity(balances.money);

      for (const listener of this.listeners) {
        listener(this.balance);
      }
    } catch (e) {
      console.error('ActivesUseCase.fetchBalances', e);
    }
  }

  public subscribe(listener: BalanceChangeListener) {
    this.listeners.push(listener);
  }

  public get Balance() { return this.balance; }

  public static get Instance() {
    return this.instance || (this.instance = new this());
  }
}

export default ActivesUseCase.Instance;
