import { toNum } from "../helpers";

type Candle = any;


export default class CandleToOhlcvDTO {
  public static toOhlcv(candle: Candle) {
    const time = new Date(candle.time).valueOf();
    const open = toNum(candle.open);
    const high = toNum(candle.high);
    const low = toNum(candle.low);
    const close = toNum(candle.close);
    const volume = candle.volume;
    return [
      time,
      open,
      high,
      low,
      close,
      volume,
    ];
  }

}