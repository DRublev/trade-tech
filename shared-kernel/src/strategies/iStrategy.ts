
import { Order } from "../app/types/order";
import { Orderbook } from "../app/types/orderbook";
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