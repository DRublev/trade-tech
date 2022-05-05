
import { InstrumentIdType, Share } from "invest-nodejs-grpc-sdk/dist/generated/instruments";
import { InvestSdk } from "./types";


export default class InstrumentsService {
  private client: InvestSdk;

  constructor(client: InvestSdk) {
    if (!client) throw new Error('client is required');
    this.client = client;
  }

  public async filterByAvailable(candidates: string[]): Promise<[string[], string[]]> {
    try {

    } catch (e) {
      console.error(`Ошибка при фильтрации инструментов: ${e.message}`);
      return [[], candidates];
    }
  }

  public async getSharesByTickers(candidates: string[]): Promise<Share[]> {
    try {
      const acc = [];
      for await (const candidate of candidates) {
        try {
          const share = await this.client.instruments.shareBy({
            idType: InstrumentIdType.INSTRUMENT_ID_TYPE_TICKER,
            id: candidate,
          });
          acc.push(share);
        } catch (e) {
          console.warn(`Не смог получить информацию о ${candidate}`, e.message);
        }
      }

      return acc;
    } catch (e) {
      console.error(`Ошибка при получении figi для инструментов: ${e.message}`);
      return [];
    }
  }
}