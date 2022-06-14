import { IOrdersService, OrdersStream, PlaceOrderCmd, SubscribeOrdersReq } from "@/app/types/order";
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

  public cancel(orderId: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public subscribe(req: SubscribeOrdersReq): OrdersStream {
    throw new Error("Method not implemented.");
  }

  public unsubscribe(orderId: string): void {
    if (!this.subscribedOrdersIds[orderId]) return;
    delete this.subscribedOrdersIds[orderId];
  }

  private async *getOrdersStateRequest() {

  }
}