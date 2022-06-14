import { IAccountService } from "@/app/types/account";
import { IOrdersService } from "@/app/types/order";
import { IOrderbookSubscriber } from "@/app/types/orderbook";

export default class Sdk {
  constructor(
    private orderbookStreamSubscriber: IOrderbookSubscriber,
    private ordersService: IOrdersService,
    private accountsService: IAccountService) {
  }

  public get OrderbookStreamProvider() {
    return this.orderbookStreamSubscriber;
  }

  public get OrdersService() {
    return this.ordersService;
  }
  public get AccountsService() { 
    return this.accountsService;
  }
}