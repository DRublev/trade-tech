import { Order } from "../types/order";
import { Orderbook } from "../types/orderbook";
import StrategyConfig from "./Config";


interface IStrategy {
  onOrderbook(orderbook: Orderbook): Promise<void>;
  onOrderChanged(order: Order): Promise<void>;
}

interface IStrategyConstructor {
  new(config: StrategyConfig): IStrategy;
}

declare var IStrategy: IStrategyConstructor;


export default IStrategy;