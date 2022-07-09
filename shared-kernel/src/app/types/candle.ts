import { Candle as TCandle, CandleInterval as TCandleInterval, HistoricCandle as THistoricCandle } from "invest-nodejs-grpc-sdk/dist/generated/marketdata";

export type Candle = TCandle;
export type HistoricCandle = THistoricCandle;

export type CandleInterval = TCandleInterval;

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

export interface ICandlesFetcher {
  fetch(figi: string, interval: CandleInterval, from?: Date, to?: Date): Promise<HistoricCandle[]>;
}
