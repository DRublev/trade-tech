import { divide } from 'mathjs';
import stringify from 'fast-safe-stringify';

import { Order } from "@/app/types/order";
import { Orderbook } from "@/app/types/orderbook";
import { toNum } from "@/infra/tinkoff/helpers";
import StrategyConfig from "../Config";
import { IStrategy, CancelOrderCommand, PostOrderCommand } from "../iStrategy";
import { OrderDirection } from 'invest-nodejs-grpc-sdk/dist/generated/orders';

export type SpreadStrategyConfig = StrategyConfig & {
  minSpread: number;
  moveOrdersOnStep: number;
  lotsDistribution: number;
};

type ToPlaceOrderInfo = {
  lots: number;
  price: number;
};

export default class SpreadStrategy implements IStrategy {
  private isWorking = true;

  private leftMoney = 0;
  private processingMoney = 0;
  private holdingLots = 0;
  private processingBuy = 0;
  private processingSell = 0;

  private bidsOrdersMap: { [price: number]: string[] } = {};
  private holdingBids: { [price: number]: number } = {};

  private asksOrdersMap: { [price: number]: string[] } = {};

  private watchingOrders: string[] = [];
  private processedOrderStagesMap: { [orderId: string]: string } = {};

  constructor(
    private config: SpreadStrategyConfig,
    private postOrder: PostOrderCommand,
    private cancelOrder: CancelOrderCommand,
    private stdOut: NodeJS.WritableStream,
  ) {
    this.leftMoney = Number(config.availableBalance);
  }

  public toggleWorking(): boolean {
    this.isWorking = !this.isWorking;
    return this.isWorking;
  }

  public async onOrderbook(orderbook: Orderbook): Promise<void> {
    if (!this.isWorking) return;
    this.log('calc', 'Cancelling rotten bids');
    await this.cancelRottenBidOrders(orderbook);
    this.log('calc', 'Calculating to buy');
    const toBuyInfo = this.calcToBuy(orderbook);
    this.log('calc', 'Calculating to sell');
    const toSellInfo = this.calcToSell(orderbook);

    if (toBuyInfo && toBuyInfo.length) {
      for await (const buyReq of toBuyInfo) {
        this.log('calc', `Placing buy order: ${stringify(buyReq)}`);
        const placedId = await this.postOrder(orderbook.figi, buyReq.lots, buyReq.price, true);
        this.watchingOrders.push(placedId);
        if (!this.bidsOrdersMap[buyReq.price]) {
          this.bidsOrdersMap[buyReq.price] = [];
        }
        this.log('calc', `Placed buy order: ${buyReq.price} ${buyReq.lots} ${placedId}`);
        this.bidsOrdersMap[buyReq.price].push(placedId);
        this.processingBuy += buyReq.lots;
        this.processingMoney += (buyReq.lots * buyReq.price);
      }
    }
    if (toSellInfo && toSellInfo.length) {
      for await (const sellReq of toSellInfo) {
        this.log('calc', `Placing sell order: ${stringify(sellReq)}`);
        const placedId = await this.postOrder(orderbook.figi, sellReq.lots, sellReq.price, false);
        this.watchingOrders.push(placedId);
        if (!this.asksOrdersMap[sellReq.price]) {
          this.asksOrdersMap[sellReq.price] = [];
        }
        this.log('calc', `Placed sell order: ${sellReq.price} ${sellReq.lots} ${placedId}`);
        this.asksOrdersMap[sellReq.price].push(placedId);
      }
    }

    return null;
  }

  private calcToBuy(orderbook: Orderbook): ToPlaceOrderInfo[] {
    try {
      if (this.holdingLots >= this.config.maxHolding
        || this.processingBuy >= this.config.maxHolding) {
        this.log('info', "Already holding max shares");
        return [];
      }
      const minBid = toNum(orderbook.bids[0].price);
      this.log('calc', `Min bid: ${stringify(minBid)}; Money left: ${this.leftMoney}`);
      if (this.leftMoney < minBid) {
        this.log('info', `No money left. Left: ${this.leftMoney}; Min bid: ${stringify(minBid)}`);
        return [];
      }

      const buyLadderStep = Math.round(Number(this.config.maxHolding || 0) / Number(this.config.lotsDistribution || 1));
      const ladderLeft = Math.round(Number(this.config.maxHolding || 0) % Number(this.config.lotsDistribution || 1));
      this.log('calc', `Buy ladder step: ${buyLadderStep}; Remainded: ${ladderLeft}`);
      let toBuyLots = ladderLeft > 0
        ? Array.from({ length: this.config.lotsDistribution - 1 }, () => buyLadderStep).concat([ladderLeft])
        : Array.from({ length: this.config.lotsDistribution }, () => buyLadderStep);
      this.log('calc', `To buy: ${toBuyLots}`);
      const canBuyLotsAmount = Math.floor((this.leftMoney - this.processingMoney) / minBid);
      this.log('calc', `To buy more: ${canBuyLotsAmount}; ${this.leftMoney} - ${this.processingMoney} / ${minBid} = ${this.leftMoney  - this.processingMoney / minBid}`);
      if (canBuyLotsAmount < buyLadderStep) {
        toBuyLots = [canBuyLotsAmount];
        this.log('calc', `canBuyLotsAmount < buyLadderStep. canBuyLotsAmount: ${canBuyLotsAmount}; buyLadderStep: ${stringify(buyLadderStep)}`);
      }
      const bids = orderbook.bids.slice(0, toBuyLots.length);
      this.log('calc', `Bids: ${stringify(bids)}`);

      const dealSum = bids.reduce((acc, bid, idx) => acc + toNum(bid.price) * toBuyLots[idx], 0);
      this.log('calc', `Expected deal sum: ${dealSum}; Left money: ${this.leftMoney}; Processing money: ${this.processingMoney}`);
      if (dealSum > (this.leftMoney - this.processingMoney)) {
        this.log('calc', `Not enough money to buy. Left: ${this.leftMoney}; Processing: ${this.processingMoney}; Deal sum: ${dealSum}`);
      }
      const toBuyOrders: ToPlaceOrderInfo[] = bids.map((bid, index, all) => ({
        lots: toBuyLots[index],
        price: toNum(bid.price),
      }));
      return toBuyOrders;
    } catch (e) {
      this.log('error', stringify(e));
      return [];
    }
  }

  private calcToSell(orderbook: Orderbook): ToPlaceOrderInfo[] {
    try {
      if (this.holdingLots <= 0) {
        this.log('calc', "Holding 0 lots");
        return;
      }
      const toSell: ToPlaceOrderInfo[] = [];
      const asks = orderbook.asks.slice(0, this.config.moveOrdersOnStep);
      this.log('calc', `Asks: ${stringify(asks)}`);
      const holdingPrices = Object.keys(this.holdingBids);
      this.log('calc', `Holding prices: ${stringify(holdingPrices)}`);
      for (const ask of asks) {
        const askPrice = toNum(ask.price);
        const profitableHolding = holdingPrices.find((p) => Number(p) - this.config.minSpread < askPrice);
        this.log('calc', `Ask price: ${askPrice}; Profitable holding: ${stringify(profitableHolding)}`);
        if (profitableHolding && this.holdingBids[profitableHolding]) {
          toSell.push({
            price: askPrice,
            lots: this.holdingBids[profitableHolding],
          });
          this.holdingBids[profitableHolding] -= this.holdingBids[profitableHolding];
        }
      }
      return toSell;
    } catch (e) {
      this.log('error', stringify(e));
      return [];
    }
  }

  private async cancelRottenBidOrders(orderbook: Orderbook) {
    try {
      const placedBids = Object.keys(this.bidsOrdersMap);
      for (const bid of placedBids) {
        let idx = orderbook.bids.findIndex(b => toNum(b.price) === Number(bid));
        if (idx === -1) {
          this.log('calc', `Bid ${stringify(bid)} not found in orderbook`);
          for (let i = 0; i < orderbook.bids.length; i++) {
            const bidPrice = toNum(orderbook.bids[i].price);
            if (bidPrice > Number(bid)) {
              this.log('calc', `Checking next bid, price: ${bidPrice}; i: ${i}; idx: ${idx}`);
              idx = i + 1;
            }
            if ((idx + 1) > this.config.moveOrdersOnStep) {
              this.log('calc', `(idx + 1) > moveOrdersOnStep; idx: ${idx}; i: ${i}`);
              break;
            }
          }
        }
        if ((idx + 1) > this.config.moveOrdersOnStep) {
          this.log('calc', `Bid ${bid} is too far from the top, cancelling orders, ${stringify(this.bidsOrdersMap[bid])}`);
          for await (const orderId of this.bidsOrdersMap[bid]) {
            await this.cancelOrder(orderId);
          }
          this.bidsOrdersMap[bid] = [];
        }
      }
    } catch (e) {
      this.log('error', stringify(e));
    }
  }

  public onOrderChanged(order: Order): Promise<void> {
    try {
      if (!this.watchingOrders.includes(order.orderId)) {
        this.log('info', `Not tracked order ${order.orderId}`);
        return;
      }
      const allAsks = Object.values(this.asksOrdersMap).join();
      const allBids = Object.values(this.bidsOrdersMap).join();
      const latestStage = order.stages[order.stages.length - 1];
      const isSell = order.direction == OrderDirection.ORDER_DIRECTION_SELL
      || allAsks.includes(order.orderId);
      const isBuy = order.direction == OrderDirection.ORDER_DIRECTION_BUY
      || allBids.includes(order.orderId) || order.direction == 0;
      const isExecuted = order.lotsRequested == order.lotsExecuted;
      
      if (!latestStage && !isExecuted) {
        this.log('info', `Order ${order.orderId} is not executed yet`);
        return;
      }
      this.log('info', `Order changed ${stringify(order)}`);

      if (isExecuted) {
        if (isSell) {
          this.log('info', `SELL Order ${order.orderId} is executed. Holding lots: ${this.holdingLots}`);
          this.log('calc', `before Holding lots: ${this.holdingLots}; Processing sell: ${this.processingSell}; Lots executed: ${order.lotsExecuted};`);
          this.holdingLots -= order.lotsExecuted;
          this.processingSell -= order.lotsExecuted;
          this.leftMoney += toNum(order.totalOrderAmount);
          this.log('calc', `after Holding lots: ${this.holdingLots}; Processing sell: ${this.processingSell}; Lots executed: ${order.lotsExecuted};`);
          this.log('calc', `Removing ${order.orderId} from asks map ${stringify(this.asksOrdersMap)}`);
          this.asksOrdersMap = Object.entries(this.asksOrdersMap).reduce((acc, [key, value]) => {
            if (value.includes(order.orderId)) {
              acc[key] = value.filter(id => id !== order.orderId);
            } else {
              acc[key] = value;
            }
            if (acc[key].length === 0) {
              delete acc[key];
            }
            return acc;
          }, {});
          this.log('calc', `New asks map: ${stringify(this.asksOrdersMap)}`);
        } else if (isBuy) {
          this.log('info', `BUY Order ${order.orderId} is executed. Holding lots: ${this.holdingLots}`);
          this.log('calc', `before Holding lots: ${this.holdingLots}; Processing buy: ${this.processingBuy}; Lots executed: ${order.lotsExecuted};`);
          this.holdingLots += order.lotsExecuted;
          this.processingBuy -= order.lotsExecuted;
          this.processingMoney -= toNum(order.totalOrderAmount);
          this.log('calc', `after Holding lots: ${this.holdingLots}; Processing buy: ${this.processingBuy}; Lots executed: ${order.lotsExecuted};`);
          this.leftMoney -= toNum(order.totalOrderAmount);
          this.log('calc', `Removing ${order.orderId} from bids map ${stringify(this.bidsOrdersMap)}`);
          this.bidsOrdersMap = Object.entries(this.bidsOrdersMap).reduce((acc, [key, value]) => {
            if (value.includes(order.orderId)) {
              acc[key] = value.filter(id => id !== order.orderId);
            } else {
              acc[key] = value;
            }
            if (acc[key].length === 0) {
              delete acc[key];
            }
            return acc;
          }, {});
          if (!this.holdingBids[toNum(order.averagePositionPrice)]) {
            this.holdingBids[toNum(order.averagePositionPrice)] = 0;
          }
          this.holdingBids[toNum(order.averagePositionPrice)] += order.lotsExecuted;
          this.log('calc', `New bids map: ${stringify(this.bidsOrdersMap)}`);
        } else {
          this.log('info', `Order ${order.orderId} is executed and not specified ${order}`);
        }
        return;
      }

      const lastProcessedStageId = this.processedOrderStagesMap[order.orderId];
      this.log('info', `Last processed stage: ${lastProcessedStageId}`);
      if (latestStage && latestStage.tradeId === lastProcessedStageId) {
        this.log('info', `Stage ${lastProcessedStageId} (order ${order.orderId}) is already processed`);
        return;
      }

      const { price, quantity } = isExecuted && !latestStage
        ? { price: order.executedOrderPrice, quantity: order.lotsExecuted }
        : latestStage;

      this.processedOrderStagesMap[order.orderId] = latestStage.tradeId;
      if (isSell) {
        this.log('calc', `Sold ${quantity} lots at ${price} ${latestStage.tradeId}; Before:
          holdingLots ${this.holdingLots};
          processingSell ${this.processingSell};
          leftMoney: ${this.leftMoney}
        `);
        this.holdingLots += quantity;
        this.processingSell -= quantity;
        this.leftMoney += toNum(price);
        this.log('calc', `${latestStage.tradeId} After:
          holdingLots ${this.holdingLots};
          processingSell ${this.processingSell};
          leftMoney: ${this.leftMoney}
        `);
      } else if (isBuy) {
        this.log('calc', `Bought ${quantity} lots at ${price} ${latestStage.tradeId}; Before:
          holdingLots ${this.holdingLots};
          processingSell ${this.processingSell};
          leftMoney: ${this.leftMoney}
        `);
        this.holdingLots += quantity;
        this.processingBuy -= quantity;
        this.leftMoney -= toNum(price);
        this.processingMoney -= toNum(price);
        this.log('calc', `${latestStage.tradeId} After:
          holdingLots ${this.holdingLots};
          processingSell ${this.processingSell};
          leftMoney: ${this.leftMoney}
        `);
      } else {
        this.log('error', `Order ${order.orderId} is not specified ${stringify(order)}`);
      }
    } catch (e) {
      this.log('error', stringify(e));
    }
  }

  private log(level: 'calc' | 'info' | 'error', message: string | any) {
    this.stdOut.write(`${level}: ${typeof message === 'string' ? message : stringify(message)}\n`);
  }

  public get LeftMoney() { return this.leftMoney; }
  public get ProcessingMoney() { return this.processingMoney; }
  public get HoldingLots() { return this.holdingLots; }
  public get ProcessingBuyOrders() { return this.processingBuy; }
  public get ProcessingSellOrders() { return this.processingSell; }
}