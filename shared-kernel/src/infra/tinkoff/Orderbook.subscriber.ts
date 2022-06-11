import { MarketDataRequest, SubscriptionAction } from "invest-nodejs-grpc-sdk/dist/generated/marketdata";

import identifiers from "../../constants/identifiers";
import { sleep } from "../../utils/helpers";
import Container from './ioc';
import client from "./client";
import { IOrderbookSubscriber, SubscribeOrderbookReq, OrderbookStream } from "../../app/types/orderbook";

class OrderbookSubscriber implements IOrderbookSubscriber {
  private isWorking = true;
  // private killSwitch = Container.get<AbortController>(identifiers.KillSwitch);
  async *subscribe(req: SubscribeOrderbookReq): OrderbookStream {
    try {
      const stream = await client.marketDataStream.marketDataStream(this.getSubscribeOrdersRequest(req));
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

  private async *getSubscribeOrdersRequest(instruments) {
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
