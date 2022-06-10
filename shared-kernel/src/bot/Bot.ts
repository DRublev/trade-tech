import { Container } from "inversify";

import Sdk from "../Sdk";
import identifiers from "../constants/identifiers";
import { OrderbookEmitter } from "../emitters/Orderbook.emitter";

export default class Bot {
  private isPaused = false;
  private OrderbookEmitter: OrderbookEmitter;

// processingOrders - id | idempodentId | state
// 

  constructor(private sdk: Sdk, private ioc: Container, ) {
    this.OrderbookEmitter = this.ioc.get<OrderbookEmitter>(identifiers.OrderbookEmitter);

    this.start = this.start.bind(this);
    this.pause = this.pause.bind(this);
    this.resume = this.resume.bind(this);
  }

  public async start() {

  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
  }
}