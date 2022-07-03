import { ipcEvents } from "@/constants";
import CandleToOhlcvDTO from "./CandleToOhlcvDTO";

export default class ChartUseCase {
  public candles: number[][] = [];

  private markers = [];

  constructor(private figi: string, private triggerCandlesUpdate: () => void) {
    this.processCandle = this.processCandle.bind(this);

    (window as any).ipc.on(ipcEvents.TINKOFF_ON_CANDLES_STREAM, this.processCandle);
  }

  public async subscribeOnCandles() {
    try {
      if (!this.figi) return;
      await (window as any).ipc.invoke(ipcEvents.TINKOFF_SUBSCRIBE_ON_CANDLES, { figi: this.figi });

      (window as any).ipc.send(ipcEvents.TINKOFF_GET_CANDLES_STREAM, { figi: this.figi, debug: false });
    } catch (e) {
      console.error('Error subscribing on candels', e);
    }
  }

  private async processCandle(e: any, candle: any) {
    const ohlcv = CandleToOhlcvDTO.toOhlcv(candle);
    this.candles.push(ohlcv);
    this.triggerCandlesUpdate();
  }

  public get Data() { return this.candles; }
  public get Markers() { return this.markers; }
}
