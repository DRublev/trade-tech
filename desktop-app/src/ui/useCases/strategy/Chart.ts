// @ts-ignore
import { DataCube } from 'trading-vue3-js';

import { ipcEvents } from "@/constants";
import CandleToOhlcvDTO from "./CandleToOhlcvDTO";

export default class ChartUseCase {
  private data: any[] = [];
  private dataCube = new DataCube({ chart: {}, onchart: [], offchart: [] });

  private markers = [
    // { time: '2018-10-23', position: 'belowBar', text: 'Buy', color: '#39998E', shape: 'arrowUp', },
    // { time: '2018-10-26', position: 'aboveBar', text: 'Sell', color: '#DA674A', shape: 'arrowDown', }
  ];

  constructor(private figi: string) {
    this.processCandle = this.processCandle.bind(this);

    (window as any).ipc.on(ipcEvents.TINKOFF_ON_CANDLES_STREAM, this.processCandle);
  }

  public async subscribeOnCandles() {
    try {
      if (!this.figi) {
        console.log('28 Chart', 'no figi');
        return;}
      const res = await (window as any).ipc.invoke(ipcEvents.TINKOFF_SUBSCRIBE_ON_CANDLES, { figi: 'BBG00DHTYPH8' });
      
      console.log('32 Chart', res);
      (window as any).ipc.send(ipcEvents.TINKOFF_GET_CANDLES_STREAM, { figi: 'BBG00DHTYPH8' });
    } catch (e) {
      console.error('Error subscribing on candels', e);
    }
  }

  private async processCandle(e:any, candle: any) {
    console.log('44 Chart', candle);
    this.dataCube.merge('chart.data', [CandleToOhlcvDTO.toOhlcv(candle)]);
    this.data.push(CandleToOhlcvDTO.toOhlcv(candle));
  }

  public get Data() { return this.dataCube; }
  public get Markers() { return this.markers; }
}
