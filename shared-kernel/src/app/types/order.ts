import { OrderState, OrderTrades, PostOrderRequest } from "invest-nodejs-grpc-sdk/dist/generated/orders";
import { TinkoffClient } from "@/infra/tinkoff/client";


export type Order = OrderState;
export type Trades = OrderTrades;


export type PlaceOrderCmd = Omit<PostOrderRequest, 'orderType' | 'direction' | 'price'> & {
  orderType: 'MARKET' | 'LIMIT';
  direction: 'BUY' | 'SELL';
  price: number;
}

export type OrderTradesStream = AsyncGenerator<Trades>;
export type SubscribeOrdersReq = string[];


export interface IOrdersService {
  place(placeCmd: PlaceOrderCmd): Promise<string>;
  cancel(orderId: string): Promise<void>;
  subscribe(req: SubscribeOrdersReq): void;
  unsubscribe(orderId: string): void;
  getOrdersStream(): OrderTradesStream;
}
interface IOrdersServiceConstructor {
  new(client: TinkoffClient): IOrdersService;
};
declare var IOrdersService: IOrdersServiceConstructor;
