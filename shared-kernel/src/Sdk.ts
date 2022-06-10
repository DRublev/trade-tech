import { Candle, OrderBook } from "invest-nodejs-grpc-sdk/dist/generated/marketdata";

export type Orderbook = OrderBook;

export type OrderbookStream = AsyncGenerator<Orderbook>;

export type SubscribeOrderbookReq = { figi: string, depth: number }[];

export interface IOrderbookSubscriber {
  subscribe(req: SubscribeOrderbookReq): OrderbookStream;
}

export default class Sdk {
  constructor(
    private orderbookStreamSubscriber: IOrderbookSubscriber) {
  }

  public get OrderbookStreamProvider() {
    return this.orderbookStreamSubscriber;
  }
}