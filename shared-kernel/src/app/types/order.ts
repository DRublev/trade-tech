import { OrderState, PostOrderRequest } from "invest-nodejs-grpc-sdk/dist/generated/orders";
import { TinkoffClient } from "@/infra/tinkoff/client";


export type Order = OrderState;

export type PlaceOrderCmd = Omit<PostOrderRequest, 'orderType' | 'direction' | 'price'> & {
  orderType: 'MARKET' | 'LIMIT';
  direction: 'BUY' | 'SELL';
  price: number;
}

export type OrdersStream = AsyncGenerator<Order>;
export type SubscribeOrdersReq = string[];


export interface IOrdersService {
  place(placeCmd: PlaceOrderCmd): Promise<string>;
  cancel(orderId: string): Promise<void>;
  subscribe(req: SubscribeOrdersReq): OrdersStream;
  unsubscribe(orderId: string): void;
}
interface IOrdersServiceConstructor {
  new(client: TinkoffClient): IOrdersService;
};
declare var IOrdersService: IOrdersServiceConstructor;
