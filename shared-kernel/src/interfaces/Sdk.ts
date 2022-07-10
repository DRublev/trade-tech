import { IAccountService } from "@/app/types/account";
import { ICandlesSubscriber, ICandlesFetcher } from "@/app/types/candle";
import { IInstrumentsFetcher } from "@/app/types/instruments";
import { IOrdersService } from "@/app/types/order";
import { IOrderbookSubscriber } from "@/app/types/orderbook";

export default class Sdk {
  constructor(
    private orderbookStreamSubscriber: IOrderbookSubscriber,
    private candlesStreamSubscriber: ICandlesSubscriber,
    private candlesFetcher: ICandlesFetcher,
    private ordersService: IOrdersService,
    private accountsService: IAccountService,
    private instrumentsFetcher: IInstrumentsFetcher,
  ) {}


  public get OrderbookStreamProvider() { return this.orderbookStreamSubscriber; }
  public get CandlesStreamSubscriber() { return this.candlesStreamSubscriber; }
  public get CandlesFetcher() { return this.candlesFetcher; }
  public get OrdersService() { return this.ordersService; }
  public get AccountsService() {  return this.accountsService; }
  public get InstrumentsFetcher() {  return this.instrumentsFetcher; }
}