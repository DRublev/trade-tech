import { Candle } from 'invest-nodejs-grpc-sdk/dist/generated/marketdata';
import { OrderState, PostOrderRequest } from 'invest-nodejs-grpc-sdk/dist/generated/orders';


export enum Strategies {
  Example,
};

export interface IStrategy {
  onCandle(candle: Candle): AsyncIterable<PostOrderRequest>;
  onChangeOrder(order: OrderState): Promise<void>;
}

export { default as Example } from './example';
