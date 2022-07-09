type Candle = any;

const nanoPrecision = 1_000_000_000;



const toQuotation = (number: number) => {
  const decimal = (number - Math.floor(Number(number))).toFixed(9);
  return ({
  units: Math.floor(number),
  nano: decimal.slice(2) as any as number,
})};
const toNum = (qutation: { units: number, nano: number }) => Number(qutation.units + (qutation.nano / nanoPrecision));


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