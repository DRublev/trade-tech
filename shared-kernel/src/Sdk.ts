import { Orderbook } from "./types/orderbook";

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