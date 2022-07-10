import { CandleInterval, HistoricCandle, ICandlesFetcher } from "@/app/types/candle";
import { TinkoffClient } from "../client";
import ioc, { ids } from "../ioc";


export default class CandlesFetcher implements ICandlesFetcher {
  private client: TinkoffClient;
  
  constructor() {
    this.client = ioc.get<TinkoffClient>(ids.Client);    
    this.fetch = this.fetch.bind(this);
  }

  async fetch(figi: string, interval: CandleInterval, from?: Date, to?: Date): Promise<HistoricCandle[]> {
    const response = await this.client.marketData.getCandles({ figi, from, to, interval: interval });
    return response.candles;
  }
}