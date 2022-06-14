import EventEmitter from "@foxify/events";
import { Orderbook } from "../types/orderbook";



export type OrderbookEvents = {
  [figi: string]: (orderbook: Orderbook) => void;
}

export class OrderbookEmitter extends EventEmitter<OrderbookEvents> {}

const emitter = new EventEmitter<OrderbookEvents>();

export default emitter;
