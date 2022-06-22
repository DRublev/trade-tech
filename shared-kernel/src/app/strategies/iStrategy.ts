
import { Order } from "../types/order";
import { Orderbook } from "../types/orderbook";
import StrategyConfig from "./Config";


export interface IStrategy {
  onOrderbook(orderbook: Orderbook): Promise<void>;
  onOrderChanged(order: Order): Promise<void>;
  toggleWorking: ToggleWorkingModeCommand;
  
  Version?: string;
  LeftMoney: number;
  ProcessingMoney: number;
  HoldingLots: number;
  ProcessingBuyOrders: number;
  ProcessingSellOrders: number;
}

export type PostOrderCommand = (figi: string, lots: number, pricePerLot: number, isBuy: boolean) => Promise<string>;
export type CancelOrderCommand = (orderId: string) => Promise<void>;
export type ToggleWorkingModeCommand = () => boolean;


export interface IStrategyConstructor {
  new(
    config: StrategyConfig,
    postOrder: PostOrderCommand,
    cancelOrder: CancelOrderCommand,
    stdOut: NodeJS.WritableStream,
  ): IStrategy;
}
