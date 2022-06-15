import { IOrdersService, OrderTradesStream, PlaceOrderCmd, SubscribeOrdersReq } from "@/app/types/order";
import AccountProvider from "@/infra/AccountProvider";
import ioc, { ids } from "../ioc";
import { TinkoffClient } from "../client";
import PlaceOrderDTO from "./dto/PlaceOrderDTO";

export default class OrdersService implements IOrdersService {
  private subscribedOrdersIds: { [idempodentId: string]: string } = {};
  private client: TinkoffClient;
  private accountProvider: AccountProvider;

  constructor() {
    this.client = ioc.get<TinkoffClient>(ids.Client);
    this.accountProvider = ioc.get<AccountProvider>(ids.AccountProvider);
  }

  public async place(placeCmd: PlaceOrderCmd): Promise<string> {
    const postOrderRequest = PlaceOrderDTO.FromCommand(placeCmd);
    postOrderRequest.accountId = this.accountProvider.Id;

    const posted = await this.client.orders.postOrder(postOrderRequest);
    return posted.orderId;
  }

  public async cancel(orderId: string): Promise<void> {
    await this.client.orders.cancelOrder({ accountId: this.accountProvider.Id, orderId });
  }

  public subscribe(req: SubscribeOrdersReq): void {
    for (const id of req) {
      this.subscribedOrdersIds[id] = id;
    }
  }

  public unsubscribe(orderId: string): void {
    if (!this.subscribedOrdersIds[orderId]) return;
    delete this.subscribedOrdersIds[orderId];
  }

  public async *getOrdersStream(): OrderTradesStream {
    try {
      const stream = await this.client.ordersStream.tradesStream({});
      for await (const pckg of stream) {
        if (pckg.orderTrades) {
          if (this.subscribedOrdersIds[pckg.orderTrades.orderId]) {
            yield pckg.orderTrades;
          }
        }
      }
    } catch (e) {
      return this.getOrdersStream();
    }
  }

  private async *getOrdersStateRequest() {

  }
}