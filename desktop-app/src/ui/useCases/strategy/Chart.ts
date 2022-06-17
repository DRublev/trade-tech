import { SeriesMarker, Time } from "lightweight-charts";

export default class ChartUseCase {
  private data = [
    { time: '2018-10-19', open: 54.62, high: 55.50, low: 54.52, close: 54.90 },
    { time: '2018-10-22', open: 55.08, high: 55.27, low: 54.61, close: 54.98 },
    { time: '2018-10-23', open: 56.09, high: 57.47, low: 56.09, close: 57.21 },
    { time: '2018-10-24', open: 57.00, high: 58.44, low: 56.41, close: 57.42 },
    { time: '2018-10-25', open: 57.46, high: 57.63, low: 56.17, close: 56.43 },
    { time: '2018-10-26', open: 56.26, high: 56.62, low: 55.19, close: 55.51 },
    { time: '2018-10-29', open: 55.81, high: 57.15, low: 55.72, close: 56.48 },
    { time: '2018-10-30', open: 56.92, high: 58.80, low: 56.92, close: 58.18 },
  ];

  private markers: SeriesMarker<Time>[] = [
    { time: '2018-10-23', position: 'belowBar', text: 'Buy', color: '#39998E', shape: 'arrowUp', },
    { time: '2018-10-26', position: 'aboveBar', text: 'Sell', color: '#DA674A', shape: 'arrowDown', }
  ];

  public get Data() { return this.data; }
  public get Markers() { return this.markers; }
}