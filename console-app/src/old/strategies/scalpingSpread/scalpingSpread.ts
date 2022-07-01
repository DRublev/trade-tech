import { toNum } from "@/helpers";
import logger from "@/logger";
import { Candle, OrderBook } from "invest-nodejs-grpc-sdk/dist/generated/marketdata";
import { PostOrderRequest, OrderState } from "invest-nodejs-grpc-sdk/dist/generated/orders";
import { IStrategy } from "..";


type ToPlaceOrderInfo = {
  lots: number;
  price: number;
};

class ScalpingSpread implements IStrategy {
  private config = {
    minSpread: 0.3,
    availableBalance: 42,
    maxHolding: 4,
    lotsDistribution: 2,
    moveOrdersOnSteps: 2,
  }
  private leftMoney = this.config.availableBalance;
  private holdingShares = 0;
  private processingBuy = 0;
  private processingSell = 0;
  private latestOrderBook: OrderBook = null;

  private bidsOrdersMap: { [price: number]: string[] } = {};
  private holdingBids: { [price: number]: number } = {};

  onCandle(candle: Candle): Generator<Partial<PostOrderRequest>, any, unknown> {
    throw new Error("Method not implemented.");
  }

  onOrderbookChange(orderbook: OrderBook = this.latestOrderBook): void {
    this.checkMoveBids(orderbook);
    const toBuyOrders = this.tryToBuy(orderbook);
    const toSellOrders = this.tryToSell(orderbook);


    if (toBuyOrders && toBuyOrders.length) {
      toBuyOrders.forEach((o) => this.callPlaceOrder('buy', o));
    }
    if (toSellOrders && toSellOrders.length) {
      toSellOrders.forEach((o) => this.callPlaceOrder('sell', o));
    }

    return null;
  }

  private tryToBuy(orderbook: OrderBook): ToPlaceOrderInfo[] {
    try {
      if (this.holdingShares >= this.config.maxHolding
        || this.processingBuy >= this.config.maxHolding) {
        logger.info("Already holding max shares");
        return;
      }
      const minBid = toNum(orderbook.bids[0].price);
      if (this.leftMoney < minBid) {
        logger.info(`No money left. Left: ${this.leftMoney}; Min bid: ${minBid}`);
        return;
      }
  
      const buyLadderStep = Math.round(this.config.maxHolding / this.config.lotsDistribution);
      const ladderLeft = Math.round(this.config.maxHolding % this.config.lotsDistribution);
      let toBuyLots = ladderLeft > 0
        ? Array.from({ length: this.config.lotsDistribution - 1 }, () => buyLadderStep).concat([ladderLeft])
        : Array.from({ length: this.config.lotsDistribution }, () => buyLadderStep);
      const canBuyLotsAmount = Math.floor(this.leftMoney / minBid);
      if (canBuyLotsAmount < buyLadderStep) {
        toBuyLots = [canBuyLotsAmount];
      }
  
      const bids = orderbook.bids.slice(0, toBuyLots.length - 1);
      const toBuyOrders: ToPlaceOrderInfo[] = bids.map((bid, index) => ({
        lots: toBuyLots[index],
        price: toNum(bid.price),
      }));
      return toBuyOrders;
    } catch (e) {
      logger.error(e);
      return [];
    }
  }

  private tryToSell(orderbook: OrderBook): ToPlaceOrderInfo[] {
    try {
      if (this.holdingShares <= 0) {
        logger.info("Holding 0 shares");
        return;
      }
      const toSell: ToPlaceOrderInfo[] = [];
      const asks = orderbook.asks.slice(0, this.config.moveOrdersOnSteps);
      const holdingPrices = Object.keys(this.holdingBids);

      for (const ask of asks) {
        const askPrice = toNum(ask.price);
        const profitableHolding = holdingPrices.find((p) => Number(p) - this.config.minSpread < askPrice);
        if (profitableHolding) {
          toSell.push({
            price: askPrice,
            lots: this.holdingBids[profitableHolding],
          });
        }
      }
      return toSell;
    } catch (e) {
      logger.error(e);
      return [];
    }
  }

  private checkMoveBids(orderbook: OrderBook): void {
    const placedBids = Object.keys(this.bidsOrdersMap);
    for (const bid of placedBids) {
      let idx = orderbook.bids.findIndex(b => toNum(b.price) === Number(bid));
      if (idx === -1) {
        logger.info(`Bid ${bid} not found in orderbook`);
        for (let i = 0; i < orderbook.bids.length; i++) {
          const bidPrice = toNum(orderbook.bids[i].price);
          if (bidPrice > Number(bid)) {
            idx = i + 1;
          }
          if ((idx + 1) > this.config.moveOrdersOnSteps) {
            break;
          }
        }
      }
      if ((idx + 1) > this.config.moveOrdersOnSteps) {
        logger.info(`Bid ${bid} is too far from the top, cancelling orders`);
        this.callCancelOrder(this.bidsOrdersMap[bid]);
      }
    }
  }

  private callCancelOrder(toCancel: string | string[]): Promise<void> {
    // OrdersEmitter.on('cancel_orderId', ({ lots, price })=> clear position, call onOrderbookChange()) 
    throw new Error("Method not implemented.");
  }

  private callPlaceOrder(direction: 'buy' | 'sell', info: ToPlaceOrderInfo) {
    throw new Error("Method not implemented.");
  }

  // @ts-ignore
  onChangeOrder(order: OrderState): Promise<void> {

    // throw new Error("Method not implemented.");
  }
  cancelPreviousOrder(candle: Candle): string {
    return null;
  }
  onPlaceOrder(placedOrderId: string, createdOrderId: string): void {
    // throw new Error("Method not implemented.");
  }
}