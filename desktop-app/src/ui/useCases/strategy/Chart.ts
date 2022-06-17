import { ipcEvents } from "@/constants";
import { SeriesMarker, Time } from "lightweight-charts";

export default class ChartUseCase {
  private data: any[] = [
    // { time: '2018-10-19', open: 54.62, high: 55.50, low: 54.52, close: 54.90 },
    // { time: '2018-10-22', open: 55.08, high: 55.27, low: 54.61, close: 54.98 },
    // { time: '2018-10-23', open: 56.09, high: 57.47, low: 56.09, close: 57.21 },
    // { time: '2018-10-24', open: 57.00, high: 58.44, low: 56.41, close: 57.42 },
    // { time: '2018-10-25', open: 57.46, high: 57.63, low: 56.17, close: 56.43 },
    // { time: '2018-10-26', open: 56.26, high: 56.62, low: 55.19, close: 55.51 },
    // { time: '2018-10-29', open: 55.81, high: 57.15, low: 55.72, close: 56.48 },
    // { time: '2018-10-30', open: 56.92, high: 58.80, low: 56.92, close: 58.18 },
  ];

  private markers: SeriesMarker<Time>[] = [
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
    console.log('45 Chart', typeof candle.time);
    this.data.push({
      open: toNum(candle.open),
      high: toNum(candle.high),
      low: toNum(candle.low),
      close: toNum(candle.close),
      time: candle.time.toString().split('T')[0],
    })
  }

  public get Data() { return this.data; }
  public get Markers() { return this.markers; }
}

const nanoPrecision = 1_000_000_000;


const toNum = (qutation: { units: number, nano: number }) => Number(qutation.units + (qutation.nano / nanoPrecision));

const toQuotation = (number: number) => {
  const decimal = (number - Math.floor(Number(number))).toFixed(9);
  return ({
  units: Math.floor(number),
  nano: decimal.slice(2) as any as number,
})};