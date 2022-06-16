import { Candle as TCandle } from "invest-nodejs-grpc-sdk/dist/generated/marketdata";

export type Candle = TCandle;

export enum Timeframes {
  OneMinute = 1,
  FiveMinutes = 2
}

export type CandlesStream = AsyncGenerator<Candle>;

export interface ICandlesSubscriber {
  subscribe(figi: string, timeframe: Timeframes): void;
  unsubscribe(figi: string): void;
  stream(): CandlesStream;
}