import { ipcEvents } from "@/constants";
import CandleToOhlcvDTO from "./CandleToOhlcvDTO";

export default class ChartUseCase {
  private data: any[] = [
    [1551128400000, 33, 37.1, 14, 14, 196],
    [1551132000000, 13.7, 30, 6.6, 30, 206],
    [1551135600000, 29.9, 33, 21.3, 21.8, 74],
    [1551139200000, 21.7, 25.9, 18, 24, 140],
    [1551142800000, 24.1, 24.1, 24, 24.1, 29],
  ];

  private markers = [
    // { time: '2018-10-23', position: 'belowBar', text: 'Buy', color: '#39998E', shape: 'arrowUp', },
    // { time: '2018-10-26', position: 'aboveBar', text: 'Sell', color: '#DA674A', shape: 'arrowDown', }
  ];

  constructor(private figi: string) {
    this.processCandle = this.processCandle.bind(this);

    (window as any).ipc.on(ipcEvents.TINKOFF_ON_CANDLES_STREAM, this.processCandle);
    this.subscribeOnCandles();
  }

  private async subscribeOnCandles() {
    try {
      if (!this.figi) {
        console.log('28 Chart', 'no figi');
        return;}
      const res = await (window as any).ipc.invoke(ipcEvents.TINKOFF_SUBSCRIBE_ON_CANDLES, { figi: 'BBG00DHTYPH8' });
      
      console.log('32 Chart', res);
      await (window as any).ipc.send(ipcEvents.TINKOFF_GET_CANDLES_STREAM, { figi: 'BBG00DHTYPH8' });
      console.log('35 Chart', );
    } catch (e) {
      console.error('Error subscribing on candels', e);
    }
  }

  private async processCandle(e:any, candle: any) {
    console.log('44 Chart', candle);
    this.data.push(CandleToOhlcvDTO.toOhlcv(candle));
  }

  public get Data() { return this.data; }
  public get Markers() { return this.markers; }
}
