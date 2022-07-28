import { ipcEvents } from "@/constants";
import CandleToOhlcvDTO from "./CandleToOhlcvDTO";

export default class ChartUseCase {
  public candles: { [time:number]: number[] } = {};
  private indicators: { [key: string]: any } = {};

  private markers = [];

  constructor(private triggerUpdate: () => void) {
    this.processCandle = this.processCandle.bind(this);
    this.subscribeOnLogs = this.subscribeOnLogs.bind(this);
    window.ipc.on(ipcEvents.TINKOFF_ON_CANDLES_STREAM, this.processCandle);
    window.ipc.on(ipcEvents.STRATEGY_LOG, this.subscribeOnLogs);
  }

  public async subscribeOnCandles(figi: string) {
    try {
      if (!figi) return;
      await window.ipc.invoke(ipcEvents.TINKOFF_SUBSCRIBE_ON_CANDLES, { figi });

      window.ipc.send(ipcEvents.TINKOFF_GET_CANDLES_STREAM, { figi, debug: false });
    } catch (e) {
      console.error('Error subscribing on candels', e);
    }
  }

  private async processCandle(e: any, candle: any) {
    const ohlcv = CandleToOhlcvDTO.toOhlcv(candle);
    this.candles[ohlcv[0]] = ohlcv;
    this.triggerUpdate();
  }

  private subscribeOnLogs(e: any, chunk: any) {
    if (!chunk) return;
    const log = new TextDecoder('utf-8').decode((chunk));
    console.log('35 Chart', log);

    const includesBB = log.includes(', BB:');
    console.log('39 Chart', includesBB, log);
    // calc: BB%: NaN, BB: {"lower":0.0718,"middle":0.0718,"upper":0.0718}
    if (includesBB) {
      const [, bb] = log.split(', BB: ');
      const [lower, middle, upper] = JSON.parse(bb);
      if (!this.indicators['BB%']) {
        this.indicators['BB%'] = [];
      }
      this.indicators['BB%'].push({ lower: +lower, upper: +upper, middle: +middle });
      this.triggerUpdate();
    }
  }  

  public get Data() { return Object.values(this.candles); }
  public get Indicators() { return this.indicators; }
  public get Markers() { return this.markers; }
}
