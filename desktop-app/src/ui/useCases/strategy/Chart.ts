import { ipcEvents } from "@/constants";
import CandleToOhlcvDTO from "./CandleToOhlcvDTO";

export default class ChartUseCase {
  public candles: { [time:number]: number[] } = {};

  private markers = [];

  constructor(private triggerCandlesUpdate: () => void) {
    this.processCandle = this.processCandle.bind(this);

    (window as any).ipc.on(ipcEvents.TINKOFF_ON_CANDLES_STREAM, this.processCandle);
  }

  public async subscribeOnCandles(figi: string) {
    try {
      if (!figi) return;
      await (window as any).ipc.invoke(ipcEvents.TINKOFF_SUBSCRIBE_ON_CANDLES, { figi });

      (window as any).ipc.send(ipcEvents.TINKOFF_GET_CANDLES_STREAM, { figi, debug: false });
    } catch (e) {
      console.error('Error subscribing on candels', e);
    }
  }

  private async processCandle(e: any, candle: any) {
    const ohlcv = CandleToOhlcvDTO.toOhlcv(candle);
    this.candles[ohlcv[0]] = ohlcv;
    this.triggerCandlesUpdate();
  }

  public get Data() { return Object.values(this.candles); }
  public get Markers() { return this.markers; }
}
