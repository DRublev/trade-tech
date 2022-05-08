import { OrderState, PostOrderRequest } from "invest-nodejs-grpc-sdk/dist/generated/orders";
import { StringMappingType } from "typescript";
import { InvestSdk } from "./types";

class OrdersService {
  private readonly client: InvestSdk;
  private readonly isSandbox: boolean;

  private lastWatchedStages: Record<string, string> = {}

  constructor(client: InvestSdk, isSandbox: boolean) {
    if (!client) throw new Error('client is required');
    this.client = client;
    this.isSandbox = isSandbox;
  }

  /**
   * @param order - Объект заявки
   * @returns Id заявки
   */
  public async postOrder(order: PostOrderRequest): Promise<string> {
    let posted;
    if (this.isSandbox) {
      posted = await this.client.sandbox.postSandboxOrder(order);
    } else {
      posted = await this.client.orders.postOrder(order);
    }
    return posted.orderId;
  }

  public async *watchForOrder(accountId: string, orderId: string, abortSignal: AbortSignal): AsyncIterable<OrderState> {
    if (!orderId) return;

    let canWork = true;
    let timer = setInterval(() => {
      canWork = true;
    }, 1000);
    abortSignal.onabort = () => {
      canWork = false;
      clearInterval(timer);
    };

    while (!abortSignal.aborted) {
      if (!canWork) continue;
      let order: OrderState;
      if (this.isSandbox) {
        order = await this.client.sandbox.getSandboxOrderState({ accountId, orderId });
      } else {
        order = await this.client.orders.getOrderState({ accountId, orderId });
      }
      if (!order) {
        console.warn(`Заявка ${orderId} не найдена`);
        return;
      }
       canWork = false;
      const latestStage = order.stages[order.stages.length - 1];
      if (latestStage) {
        if (latestStage.tradeId !== this.lastWatchedStages[orderId]) {
          this.lastWatchedStages[orderId] = latestStage.tradeId;
          yield order;
        } 
      }
    }

    return;
  }

  public async checkOrderState (accountId: string, orderId: string): Promise<OrderState> {
    let order: OrderState;
      if (this.isSandbox) {
        order = await this.client.sandbox.getSandboxOrderState({ accountId, orderId });
      } else {
        order = await this.client.orders.getOrderState({ accountId, orderId });
      }
      if (!order) {
        console.warn(`Заявка ${orderId} не найдена`);
        return;
      }
      const latestStage = order.stages[order.stages.length - 1];
      if (latestStage) {
        if (latestStage.tradeId !== this.lastWatchedStages[orderId]) {
          this.lastWatchedStages[orderId] = latestStage.tradeId;
          return order;
        } 
      }
  }
}

export default OrdersService;
