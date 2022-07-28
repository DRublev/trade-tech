import { Orderbook } from "@/app/types/orderbook";
import StrategyState from "../../StrategyState";
import { PositionState } from "./types";


export default class SpreadStrategyState extends StrategyState {
  constructor(
    isWorking: boolean,
    availableBalance: number,
    leftBalance: number,
    holdingLots: number,
    private latestOrderbook: Orderbook,
    private hasEnteredPosition: boolean,
    private processedOrderStagesMap: { [orderId: string]: string } = {},
    private watchingOrders: string[] = [],
    private processedOrders: string[] = [],
    private bids: { [bid: number]: PositionState } = {},
    private asks: { [ask: number]: PositionState } = {},

  ) {
    super(isWorking, availableBalance, leftBalance, holdingLots);
  }

  public SetBid(bid: number, positionState: PositionState): void {
    this.bids[bid] = positionState;
  }
  public SetAsk(ask: number, positionState: PositionState): void {
    this.asks[ask] = positionState;
  }

  public RemoveBid(bid: number): void {
    delete this.bids[bid];
  }
  public RemoveAsk(ask: number): void {
    delete this.asks[ask];
  }

  public WatchOrder(orderId: string): void {
    this.watchingOrders.push(orderId);
  }
  public MarkOrderProcessed(orderId: string) {
    this.processedOrders.push(orderId);
  }

  public get LatestOrderbook(): Orderbook { return this.latestOrderbook; }
  public get HasEnteredPosition(): boolean { return this.hasEnteredPosition; }
  public get ProcessedOrderStagesMap(): { [orderId: string]: string } { return this.processedOrderStagesMap; }
  public get WatchingOrders(): string[] { return this.watchingOrders; }
  public get ProcessedOrders(): string[] { return this.processedOrders; }
  public get Bids(): { [bid: number]: PositionState } { return this.bids; }
  public get Asks(): { [ask: number]: PositionState } { return this.asks; }

  public set LeftMoney(left: number) { this.leftBalance = left; }
  public set HoldingLots(lots: number) { this.holdingLots = lots; }
  public set LatestOrderbook(orderbook: Orderbook) { this.latestOrderbook = orderbook; }
  public set HasEnteredPosition(hasEnteredPosition: boolean) { this.hasEnteredPosition = hasEnteredPosition; }
}

