import * as fs from 'fs';
import Instrument from "@/node/domain/Instruments";
import { TinkoffSdk } from '@/node/app/tinkoff';


const allSharesListPath = './allShares.json';

export default class InstrumentsPersistor {
  private chached: { [ticker: string]: Instrument } = {};

  public async getAll(): Promise<Array<Instrument>> {
    if (Object.keys(this.chached).length) return Object.values(this.chached);
    let instruments: Array<Instrument> = [];
    if (!fs.existsSync(allSharesListPath)) {
      instruments = await this.fetch();
      this.saveToFile(instruments);
    } else {
      const fileContent = await fs.readFileSync(allSharesListPath, 'utf8');
      const persisted = JSON.parse(fileContent);
      instruments = persisted.instruments;
      if (!instruments.length) {
        instruments = await this.fetch();
        this.saveToFile(instruments);
      }
    }
    this.chached = instruments.reduce((acc, instrument) => {
      acc[instrument.ticker] = instrument;
      return acc;
    }, {});
    return Object.values(this.chached);
  }

  public async getByTicker(ticker: string): Promise<Instrument> {
    if (this.chached[ticker]) return this.chached[ticker];
    const instruments = await this.getAll();
    return instruments.find(instrument => instrument.ticker === ticker);
  }

  private async fetch(): Promise<Array<Instrument>> {
    const allShares = await TinkoffSdk.Sdk.InstrumentsFetcher.fetchShares();
    const allEtfs = await TinkoffSdk.Sdk.InstrumentsFetcher.fetchEtf();
    return allShares.concat(allEtfs as any);
  }

  private saveToFile(instruments: Array<Instrument>) {
    fs.writeFileSync(allSharesListPath, JSON.stringify({ instruments }));
  }
}