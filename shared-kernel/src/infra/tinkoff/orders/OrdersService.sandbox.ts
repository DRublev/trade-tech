import { IOrdersService, OrderTradesStream, PlaceOrderCmd, SubscribeOrdersReq } from "@/app/types/order";
import AccountProvider from "../../AccountProvider";
import ioc, { ids } from "../ioc";
import { TinkoffClient } from "../client";


export default class OrdersServiceSandbox implements IOrdersService {
  private subscribedOrdersIds: { [idempodentId: string]: string } = {};
  private client: TinkoffClient;
  private accountProvider: AccountProvider;

  constructor() {
    this.client = ioc.get<TinkoffClient>(ids.Client);
    this.accountProvider = ioc.get<AccountProvider>(ids.AccountProvider);
  }
  getOrdersStream(): OrderTradesStream {
    throw new Error("Method not implemented.");
  }

  public async place(placeCmd: PlaceOrderCmd): Promise<string> {
    return '';
  }

  public async cancel(orderId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public subscribe(req: SubscribeOrdersReq): OrderTradesStream {
    throw new Error("Method not implemented.");
  }

  public unsubscribe(orderId: string): void {
    if (!this.subscribedOrdersIds[orderId]) return;
    delete this.subscribedOrdersIds[orderId];
  }

  private async *getOrdersStateRequest() {

  }
}