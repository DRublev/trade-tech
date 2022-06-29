// @ts-ignore
import { DataCube } from 'trading-vue3-js';

import { ipcEvents } from "@/constants";
import CandleToOhlcvDTO from "./CandleToOhlcvDTO";

export default class ChartUseCase {
  private dataCube = new DataCube({
    // ohlcv: [[
    //   1656442380000,
    //   51.7,
    //   51.7,
    //   51.69,
    //   51.7,
    //   0
    // ]],
    chart: {
      type: 'Candles',
      data: [
        [1656442380000, 51.7, 51.7, 51.69, 51.7, 0],
        [1656442440000, 51.7, 51.7, 51.6, 51.7, 0],
      ],
    }, onchart: [], offchart: []
  });

  private markers = [
    // { time: '2018-10-23', position: 'belowBar', text: 'Buy', color: '#39998E', shape: 'arrowUp', },
    // { time: '2018-10-26', position: 'aboveBar', text: 'Sell', color: '#DA674A', shape: 'arrowDown', }
  ];

  constructor(private figi: string) {
    this.processCandle = this.processCandle.bind(this);

    // (window as any).ipc.on(ipcEvents.TINKOFF_ON_CANDLES_STREAM, this.processCandle);
    (window as any).dc = this.dataCube
    console.log('36 Chart', this.dataCube);
  }

  public async subscribeOnCandles() {
    try {
      if (!this.figi) {
        console.log('28 Chart', 'no figi');
        return;
      }
      const res = await (window as any).ipc.invoke(ipcEvents.TINKOFF_SUBSCRIBE_ON_CANDLES, { figi: 'BBG222222222' });

      console.log('32 Chart', res);
      (window as any).ipc.send(ipcEvents.TINKOFF_GET_CANDLES_STREAM, { figi: 'BBG222222222', debug: true });
    } catch (e) {
      console.error('Error subscribing on candels', e);
    }
  }

  private async processCandle(e: any, candle: any) {
    const ohlcv = CandleToOhlcvDTO.toOhlcv(candle);
    this.dataCube.merge('chart.data', [ohlcv]);
    const allData = this.dataCube.get('chart.data');
    // this.dataCube.tv.setRange(allData[0][0][0], allData[0][allData[0].length - 1][0]);

  }

  public get Data() { return this.dataCube; }
  public get Markers() { return this.markers; }
}
