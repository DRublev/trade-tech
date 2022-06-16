import { IOrdersService, OrdersStream, PlaceOrderCmd, SubscribeOrdersReq } from "@/app/types/order";
import AccountProvider from "@/infra/AccountProvider";
import ioc, { ids } from "../ioc";
import { TinkoffClient } from "../client";
import PlaceOrderDTO from "./dto/PlaceOrderDTO";
import { sleep } from "@/utils/helpers";
import stringify from "fast-safe-stringify";

export default class OrdersService implements IOrdersService {
  private subscribedOrdersIds: { [idempodentId: string]: string } = {};
  private client: TinkoffClient;
  private accountProvider: AccountProvider;
  private isWorking = true;

  constructor() {
    this.client = ioc.get<TinkoffClient>(ids.Client);
    this.accountProvider = ioc.get<AccountProvider>(ids.AccountProvider);
  }

  public async place(placeCmd: PlaceOrderCmd): Promise<string> {
    const postOrderRequest = PlaceOrderDTO.FromCommand(placeCmd);
    if (!postOrderRequest.accountId) {
      postOrderRequest.accountId = this.accountProvider.Id;
    }
    console.log(`placing order, ${stringify(postOrderRequest)}`);
    const posted = await this.client.orders.postOrder(postOrderRequest);
    return posted.orderId;
  }

  public async cancel(orderId: string, accountId: string): Promise<void> {
    await this.client.orders.cancelOrder({ accountId, orderId });
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

  public async *getOrdersStream(accountId: string): OrdersStream {
    try {
      while (this.isWorking) {
        await sleep(1000);
        const allOrders = await this.client.orders.getOrders({ accountId });
        const notFoundButSubscribed = Object.values(this.subscribedOrdersIds)
          .filter(id => !allOrders.orders.find(o => o.orderId === id));
        for (const order of allOrders.orders) {
          if (this.subscribedOrdersIds[order.orderId]) {
            yield order;
          }
        }
        for await (const orderId of notFoundButSubscribed) {
          try {
            const order = await this.client.orders.getOrderState({ accountId, orderId });
            yield order;
          } catch (e) {
            console.error('Error checking state of order', orderId, e);
          }
        }
      }
    } catch (e) {
      return this.getOrdersStream(accountId);
    }
  }
}