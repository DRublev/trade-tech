import { Candle } from "../types/candle";
import { Order } from "../types/order";
import { Orderbook } from "../types/orderbook";
import StrategyConfig from "./Config";
import StrategyState from "./StrategyState";


export interface IStrategy {
  onOrderbook(orderbook: Orderbook): Promise<void>;
  onOrderChanged(order: Order): Promise<void>;
  onCandle?(candle: Candle): Promise<void>;
  toggleWorking: ToggleWorkingModeCommand;
  changeConfig(newConfig: StrategyConfig): void;
  setState(state: StrategyState): void;

  Version?: string;
  Interval?: number;
  LeftMoney: number;
  ProcessingMoney: number;
  HoldingLots: number;
  ProcessingBuyOrders: number;
  ProcessingSellOrders: number;
  IsWorking: boolean;
}

export type PostOrderCommand = (figi: string, lots: number, pricePerLot: number, isBuy: boolean) => Promise<string>;
export type CancelOrderCommand = (orderId: string) => Promise<void>;
export type ToggleWorkingModeCommand = () => boolean;


export interface IStrategyConstructor {
  new(
    config: StrategyConfig,
    state: StrategyState,
    postOrder: PostOrderCommand,
    cancelOrder: CancelOrderCommand,
    stdOut: NodeJS.WritableStream,
  ): IStrategy;
}
