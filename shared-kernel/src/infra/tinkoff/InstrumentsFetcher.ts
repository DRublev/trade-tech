import { Currency, IInstrumentsFetcher, InstrumentIdType, Share, TradingSchedule } from "@/app/types/instruments";
import { TinkoffClient } from "./client";
import ioc, { ids } from "./ioc";


export default class InstrumentsFetcher implements IInstrumentsFetcher {
  private client: TinkoffClient;

  constructor() {
    this.client = ioc.get<TinkoffClient>(ids.Client);

    this.fetchCurrencies = this.fetchCurrencies.bind(this);
  }

  public async fetchCurrencies(): Promise<Currency[]> {
    const res = await this.client.instruments.currencies({ instrumentStatus: 1 });
    return res.instruments;
  }
  
  public async fetchShares(): Promise<Share[]> {
    const res = await this.client.instruments.shares({ instrumentStatus: 1 });
    return res.instruments;
  }
  public async fetchShareBy(id?: string, classCode?: string, idType?: InstrumentIdType): Promise<Share> {
    const res = await this.client.instruments.shareBy({ id, classCode, idType });
    return res.instrument;
  }

  public async fetchEtf() {
    const res = await this.client.instruments.etfs({ instrumentStatus: 1 });
    return res.instruments;
  }
  public async fetchEtfBy(id?: string, classCode?: string, idType?: InstrumentIdType) {
    const res = await this.client.instruments.etfBy({ id, classCode, idType });
    return res.instrument;
  }

  public async fetchTradingSchedules(exchange?: string, from?: Date, to?: Date): Promise<TradingSchedule[]> {
    const res = await this.client.instruments.tradingSchedules({ exchange, from, to });
    return res.exchanges;
  }
}