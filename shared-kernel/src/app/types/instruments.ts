import { Share as TShare, Etf as TEtf, TradingSchedule as TTradingSchedule, Currency as TCurrency, InstrumentIdType as TInstrumentIdType, InstrumentStatus as TInstrumentStatus } from "invest-nodejs-grpc-sdk/dist/generated/instruments";


export type InstrumentIdType = TInstrumentIdType;
export type InstrumentStatus = TInstrumentStatus;

export type Currency = TCurrency;
export type Etf = TEtf;
export type Share = TShare;
export type TradingSchedule = TTradingSchedule;

export interface IInstrumentsFetcher {
  fetchCurrencies(): Promise<Currency[]>;
  fetchShares(): Promise<Share[]>;
  fetchShareBy(): Promise<Share>;
  fetchEtf(): Promise<Etf[]>;
  fetchEtfBy(): Promise<Etf>;
  fetchTradingSchedules(): Promise<TradingSchedule[]>;
}