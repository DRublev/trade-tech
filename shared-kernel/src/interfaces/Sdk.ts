import { IAccountService } from "@/app/types/account";
import { ICandlesSubscriber } from "@/app/types/candle";
import { IOrdersService } from "@/app/types/order";
import { IOrderbookSubscriber } from "@/app/types/orderbook";

export default class Sdk {
  constructor(
    private orderbookStreamSubscriber: IOrderbookSubscriber,
    private candlesStreamSubscriber: ICandlesSubscriber,
    private ordersService: IOrdersService,
    private accountsService: IAccountService) {
  }

  public get OrderbookStreamProvider() {
    return this.orderbookStreamSubscriber;
  }
  public get CanddlesStreamSubscriber() {
    return this.candlesStreamSubscriber;
  }
  public get OrdersService() {
    return this.ordersService;
  }
  public get AccountsService() { 
    return this.accountsService;
  }
}