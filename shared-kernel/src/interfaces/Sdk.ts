import { IAccountProvider } from "../app/types/account";
import ModeController from "../app/types/mode";
import { IOrderbookSubscriber } from "../app/types/orderbook";

export default class Sdk {
  private modeController: ModeController;
  constructor(
    private orderbookStreamSubscriber: IOrderbookSubscriber,
    private accountProvider: IAccountProvider) {
      this.modeController = new ModeController();
  }

  public get OrderbookStreamProvider() {
    return this.orderbookStreamSubscriber;
  }
  public get AccountProvider() {
    return this.accountProvider;
  }
}