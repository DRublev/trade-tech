
import { InstrumentStatus, Share } from "invest-nodejs-grpc-sdk/dist/generated/instruments";
import { InvestSdk } from "./types";


export default class InstrumentsService {
  private client: InvestSdk;

  constructor(client: InvestSdk) {
    if (!client) throw new Error('client is required');
    this.client = client;
  }

  public async filterByAvailable(candidates: string[]): Promise<[Share[], Share[]]> {
    try {
      const allShares = await this.client.instruments.shares({
        instrumentStatus: InstrumentStatus.INSTRUMENT_STATUS_BASE,
      });
      const available = allShares.instruments
        .filter((share) => candidates.includes(share.ticker));
      const notAvailable = candidates
        .filter((ticker) => !available.some((c) => c.ticker === ticker))
        .map((ticker) => ({ ticker })) as Share[];

      return [available, notAvailable];
    } catch (e) {
      console.log(typeof e, Object.entries(e))
      console.error(`Ошибка при фильтрации инструментов: ${e.message}`);
      return [[], candidates.map((ticker) => ({ ticker })) as Share[]];
    }
  }
}