import { TinkoffClient } from "@/infra/tinkoff/client";
import { OrderBook } from "invest-nodejs-grpc-sdk/dist/generated/marketdata";

export type Orderbook = OrderBook;

export type OrderbookStream = AsyncGenerator<Orderbook>;

export type SubscribeOrderbookReq = { figi: string, depth: number }[];

export interface IOrderbookSubscriber {
  subscribe(req: SubscribeOrderbookReq): OrderbookStream;
}

interface IOrderbookSubscriberConstructor {
  new(client: TinkoffClient): IOrderbookSubscriber;
};
declare var IOrderbookSubscriber: IOrderbookSubscriberConstructor;