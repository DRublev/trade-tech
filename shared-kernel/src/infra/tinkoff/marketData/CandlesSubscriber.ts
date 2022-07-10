import { CandlesStream, ICandlesSubscriber, Timeframes } from "@/app/types/candle";
import { sleep } from "@/utils/helpers";
import { MarketDataRequest, SubscriptionAction, SubscriptionInterval } from "invest-nodejs-grpc-sdk/dist/generated/marketdata";
import { TinkoffClient } from "../client";
import ioc, { ids } from "../ioc";

const subscribed = [];

export default class CandlesSubscriber implements ICandlesSubscriber {
  private client: TinkoffClient;
  private isWorking = true;
  
  private subscribed: { figi: string; timeframe: Timeframes }[] = [];
  
  constructor() {
    this.client = ioc.get<TinkoffClient>(ids.Client);

    this.subscribe = this.subscribe.bind(this);
    this.stream = this.stream.bind(this);
    this.getStreamSubscribeRequest = this.getStreamSubscribeRequest.bind(this);
  }

  public subscribe(figi: string, timeframe: Timeframes) {
    if (!subscribed.find(s => s.figi === figi && s.timeframe === timeframe)) {
      subscribed.push({
        figi,
        timeframe,
      });
    }
  }

  public unsubscribe(figi: string): void {
    const includes = this.subscribed.find(s => s.figi === figi);
    if (!includes) return;
    this.subscribed = this.subscribed.filter(s => s.figi !== figi);
  }

  public async *stream(): CandlesStream {
    try {
      const streamRequest = await this.client.marketDataStream.marketDataStream(this.getStreamSubscribeRequest());
      for await (const pckg of streamRequest) {
        if (pckg.candle) {
          yield pckg.candle;
        }
      }
    } catch (e) {
      console.error(e);
      return this.stream();
    }
  }

  private async *getStreamSubscribeRequest() {
    while (this.isWorking) {
      await sleep(1000);
      yield MarketDataRequest.fromPartial({
        subscribeCandlesRequest: {
          subscriptionAction: SubscriptionAction.SUBSCRIPTION_ACTION_SUBSCRIBE,
          instruments: subscribed.map((s) => ({
            figi: s.figi,
            interval: this.toInterval(s.timeframe),
          })),
        }
      });
    }
  }

  private toInterval(tf: Timeframes): SubscriptionInterval {
    if (tf === Timeframes.OneMinute) return SubscriptionInterval.SUBSCRIPTION_INTERVAL_ONE_MINUTE;
    if (tf === Timeframes.FiveMinutes) return SubscriptionInterval.SUBSCRIPTION_INTERVAL_FIVE_MINUTES;
    return SubscriptionInterval.UNRECOGNIZED;
  }
}