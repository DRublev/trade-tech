import TradeShare from "@/tradeShare";
import { Share } from "invest-nodejs-grpc-sdk/dist/generated/instruments";
import { Candle } from "invest-nodejs-grpc-sdk/dist/generated/marketdata";
import { OrderState, PostOrderRequest } from "invest-nodejs-grpc-sdk/dist/generated/orders";
import { IStrategy } from ".";

class ExampleStrategy implements IStrategy {
  private readonly config: TradeShare;

  constructor(share: Share, config: TradeShare) {
    this.config = config;
  }

  onCandle(candle: Candle): AsyncIterable<PostOrderRequest> {
    console.log('15 example', candle);
    return;
  }

  async onChangeOrder(order: OrderState): Promise<void> {
  }
}

export default ExampleStrategy;
