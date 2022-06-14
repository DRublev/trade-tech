import { MarketDataRequest, SubscriptionAction } from "invest-nodejs-grpc-sdk/dist/generated/marketdata";

import { sleep } from "@/utils/helpers";
import { IOrderbookSubscriber, SubscribeOrderbookReq, OrderbookStream } from "@/app/types/orderbook";
import ioc, { ids } from './ioc';
import type { TinkoffClient } from "./client";

class OrderbookSubscriber implements IOrderbookSubscriber {
  private isWorking = true;
  private client: TinkoffClient;
  constructor() {
    this.client = ioc.get<TinkoffClient>(ids.Client);
  }

  async *subscribe(req: SubscribeOrderbookReq): OrderbookStream {
    try {
      const stream = await this.client.marketDataStream.marketDataStream(this.getSubscribeOrdersRequest(req));
      for await (const pckg of stream) {
        if (pckg.orderbook) {
          yield pckg.orderbook;
        }
      }
    } catch (e) {
      console.error(e);
      return this.subscribe(req);
    }
  }

  private async *getSubscribeOrdersRequest(instruments: any) {
    // while (!this.killSwitch.signal.aborted) {
    while (this.isWorking) {
      await sleep(1000);
      yield MarketDataRequest.fromPartial({
        subscribeOrderBookRequest: {
          subscriptionAction: SubscriptionAction.SUBSCRIPTION_ACTION_SUBSCRIBE,
          instruments,
        }
      });
    }
  }
}

export default OrderbookSubscriber;
