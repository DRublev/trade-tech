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
  idx: number;
};

/*
  -- Купить на часть (minBid * lotsDistribution / availableBalance, те. поделить баланс на части, указанные в lotsDistribution) денег, на исполнение ордера покупки - выставление ордера на продажу
     + % прибыли или ближайший сайз
  -- на выполнение ордера вызывать onOrderbook с последним orderbook (хранить его)
*/

type PositionState = {
  price: number;
  lots: number;
  orderId: string;
  dealSum: number;
  stopLoss?: number;
  isReserved?: boolean;
  isExecuted?: boolean;
  isPartiallyExecuted?: boolean;
  executedLots: number;
  idx: number;
}

export default class SpreadStrategy implements IStrategy {
  private isWorking = true;

  private leftMoney = 0;
  private holdingLots = 0;

  private bids: { [bid: number]: PositionState } = {};
  private asks: { [ask: number]: PositionState } = {};


  private watchingOrders: string[] = [];
  private processedOrderStagesMap: { [orderId: string]: string } = {};
  private processedOrders: string[] = [];
  private latestOrderbook: Orderbook;

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
    this.latestOrderbook = orderbook;
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
        this.bids[buyReq.price] = {
          price: buyReq.price,
          lots: buyReq.lots,
          dealSum: buyReq.lots * buyReq.price,
          isExecuted: false,
          orderId: placedId,
          idx: buyReq.idx,
          executedLots: 0,
        }

        this.log('calc', `Placed buy order: ${buyReq.price} ${buyReq.lots} ${placedId}`);
        this.log('calc', `New bids map ${stringify(this.bids)}`);
      }
    }
    if (toSellInfo && toSellInfo.length) {
      for await (const sellReq of toSellInfo) {
        this.log('calc', `Placing sell order: ${stringify(sellReq)}`);
        const placedId = await this.postOrder(orderbook.figi, sellReq.lots, sellReq.price, false);
        this.watchingOrders.push(placedId);

        this.log('calc', `Placed sell order: ${sellReq.price} ${sellReq.lots} ${placedId}`);
        this.asks[sellReq.price] = {
          price: sellReq.price,
          lots: sellReq.lots,
          idx: sellReq.idx,
          dealSum: sellReq.lots * sellReq.price,
          isExecuted: false,
          orderId: placedId,
          executedLots: 0,
        };
        this.log('calc', `New asks map ${stringify(this.asks)}`);
      }
    }

    return null;
  }

  private calcToBuy(orderbook: Orderbook): ToPlaceOrderInfo[] {
    try {
      const notExecutedBuy = Object.values(this.bids).reduce((acc, bid) => !bid.isExecuted ? bid.lots + acc : acc + bid.executedLots, 0);
      const isHoldingMax = notExecutedBuy + this.holdingLots >= this.config.maxHolding;
      if (isHoldingMax) {
        this.log('info', `Already holding max shares; holding: ${this.holdingLots}, processing: ${notExecutedBuy}`);
        return [];
      }
      const minBid = toNum(orderbook.bids[0].price);
      this.log('calc', `Min bid: ${stringify(minBid)}; Money left: ${this.leftMoney}`);
      if (this.leftMoney < minBid) {
        this.log('info', `No money left. Left: ${this.leftMoney}; Min bid: ${stringify(minBid)}`);
        return [];
      }
      let lotsToBuy = this.config.maxHolding - notExecutedBuy - this.holdingLots;
      while (lotsToBuy * minBid > this.leftMoney) {
        this.log('calc', `Not enough money to buy ${lotsToBuy} lots. Left: ${this.leftMoney}; Min bid: ${stringify(minBid)}`);
        lotsToBuy--;
      }
      const toBuyLots = [lotsToBuy];
      this.log('calc', `To buy: ${toBuyLots}`);
      const blockedMoney = Object.values(this.bids).reduce((acc, bid) => !bid.isExecuted ? bid.dealSum + acc : acc, 0);
      const freeMoney = this.leftMoney - blockedMoney;
      const canBuyLotsAmount = Math.floor(freeMoney / minBid);
      this.log('calc', `To buy more: ${canBuyLotsAmount}; ${this.leftMoney} - ${blockedMoney} / ${minBid} = ${freeMoney / minBid}`);
      const bids = orderbook.bids.slice(0, toBuyLots.length);
      this.log('calc', `Bids: ${stringify(bids)}`);

      const dealSum = bids.reduce((acc, bid, idx) => acc + toNum(bid.price) * toBuyLots[idx], 0);
      this.log('calc', `Expected deal sum: ${dealSum}; Left money: ${this.leftMoney}; Processing money: ${blockedMoney}`);
      if (dealSum > freeMoney) {
        this.log('calc', `Not enough money to buy. Left: ${this.leftMoney}; Processing: ${blockedMoney}; Deal sum: ${dealSum}`);
      }
      const toBuyOrders: ToPlaceOrderInfo[] = bids.map((bid, index, all) => ({
        lots: toBuyLots[index],
        price: toNum(bid.price),
        idx: index,
      })).filter(o => o.lots > 0
        && o.lots <= this.config.maxHolding
        && o.price * o.lots <= this.config.availableBalance);
      return toBuyOrders;
    } catch (e) {
      this.log('error', stringify(e));
      return [];
    }
  }

  private calcToSell(orderbook: Orderbook): ToPlaceOrderInfo[] {
    try {
      const notExecutedSell = Object.values(this.asks).reduce((acc, p) => !p.isExecuted ? p.lots + acc : acc + p.executedLots, 0);
      if (this.holdingLots - notExecutedSell <= 0) {
        this.log('calc', "Holding 0 lots");
        return;
      }
      const toSell: ToPlaceOrderInfo[] = [];
      const asks = orderbook.asks.slice(0, this.config.moveOrdersOnStep);
      this.log('calc', `Asks: ${stringify(asks)}`);
      const holdingPrices = Object.keys(this.bids);
      this.log('calc', `Holding prices: ${stringify(holdingPrices)}`);
      let idx = 0;
      for (const ask of asks) {
        const askPrice = toNum(ask.price);
        const profitableHolding = holdingPrices.find((p) => this.bids[p].isExecuted
          && !this.bids[p].isReserved
          && Number(p) + this.config.minSpread <= askPrice);
        this.log('calc', `Ask price: ${askPrice}; Profitable holding: ${stringify(profitableHolding)}`);
        if (profitableHolding
          && (this.holdingLots - notExecutedSell) >= this.bids[profitableHolding].lots) {
          toSell.push({
            price: askPrice,
            lots: this.bids[profitableHolding].lots,
            idx,
          });
          this.bids[profitableHolding].isReserved = true;
        }
        idx++;
      }
      return toSell;
    } catch (e) {
      this.log('error', stringify(e));
      return [];
    }
  }

  private async cancelRottenBidOrders(orderbook: Orderbook) {
    try {
      const placedBids = Object.keys(this.bids);
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
          this.log('calc', `Bid ${bid} is too far from the top, cancelling order, ${stringify(this.bids[bid].orderId)}; Bids: ${stringify(orderbook.bids)}`);
          await this.cancelOrder(this.bids[bid].orderId);
          delete this.bids[bid];
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
      const allAsks = Object.values(this.asks).map(p => p.orderId).join();
      const allBids = Object.values(this.bids).map(p => p.orderId).join();
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

      if (isExecuted && !this.processedOrders.includes(order.orderId)) {
        if (isSell) {
          this.log('info', `SELL Order ${order.orderId} is executed. Holding lots: ${this.holdingLots}`);
          const [askIdx] = Object.entries(this.asks).find(([price, ask]) => ask.orderId === order.orderId) || [];
          if (!askIdx) {
            this.log('error', `Not found ask position for order ${order.orderId}; asks: ${stringify(this.asks)}`);
            return;
          }
          this.log('calc', `before Holding lots: ${this.holdingLots}; Lots executed: ${order.lotsExecuted}; asks: ${stringify(this.asks)}`);
          this.holdingLots -= order.lotsExecuted;
          this.asks[askIdx].isExecuted = true;
          this.asks[askIdx].executedLots = order.lotsExecuted;
          this.leftMoney += toNum(order.totalOrderAmount);
          this.log('calc', `after Holding lots: ${this.holdingLots}; Lots executed: ${order.lotsExecuted}; asks: ${stringify(this.asks)}`);
          this.log('calc', `Left money: ${this.LeftMoney}`);
        } else if (isBuy) {
          this.log('info', `BUY Order ${order.orderId} is executed. Holding lots: ${this.holdingLots}`);
          const [bidIdx] = Object.entries(this.bids).find(([price, bid]) => bid.orderId === order.orderId) || [];
          if (!bidIdx) {
            this.log('error', `Not found bid position for order ${order.orderId}; bids: ${stringify(this.bids)}`);
            return;
          }
          this.log('calc', `before Holding lots: ${this.holdingLots}; Lots executed: ${order.lotsExecuted}; bids: ${stringify(this.bids)}`);
          this.holdingLots += order.lotsExecuted;
          this.bids[bidIdx].isExecuted = true;
          this.bids[bidIdx].executedLots = order.lotsExecuted;
          this.log('calc', `after Holding lots: ${this.holdingLots}; Lots executed: ${order.lotsExecuted};  bids: ${stringify(this.bids)}`);
          this.leftMoney -= toNum(order.totalOrderAmount);
        } else {
          this.log('info', `Order ${order.orderId} is executed and not specified ${order}`);
        }
        this.processedOrders.push(order.orderId);
        this.onOrderbook(this.latestOrderbook);
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
        const [askIdx] = Object.entries(this.asks).find(([price, ask]) => ask.orderId === order.orderId) || [];
        if (!askIdx) {
          this.log('error', `Not found ask position for order ${order.orderId}; asks: ${stringify(this.asks)}`);
          return;
        }
        this.log('calc', `Sold ${quantity} lots at ${price} ${latestStage.tradeId}; Before:
          holdingLots ${this.holdingLots};
          leftMoney: ${this.leftMoney};
          asks: ${stringify(this.asks)};
        `);
        this.holdingLots += quantity;
        this.asks[askIdx].isPartiallyExecuted = true;
        this.asks[askIdx].executedLots = quantity;
        this.asks[askIdx].isExecuted = quantity === this.asks[askIdx].lots;

        this.leftMoney += toNum(price);
        this.log('calc', `${latestStage.tradeId} After:
          holdingLots ${this.holdingLots};
          leftMoney: ${this.leftMoney}
          asks: ${stringify(this.asks)};
          `);
      } else if (isBuy) {
          const [bidIdx] = Object.entries(this.bids).find(([price, bid]) => bid.orderId === order.orderId) || [];
          if (!bidIdx) {
          this.log('error', `Not found bid position for order ${order.orderId}; bids: ${stringify(this.bids)}`);
          return;
        }
        this.log('calc', `Bought ${quantity} lots at ${price} ${latestStage.tradeId}; Before:
          holdingLots ${this.holdingLots};
          leftMoney: ${this.leftMoney};
          bids: ${stringify(this.bids)};
        `);
        this.holdingLots += quantity;
        this.bids[bidIdx].isPartiallyExecuted = true;
        this.bids[bidIdx].executedLots = quantity;
        this.bids[bidIdx].isExecuted = quantity === this.bids[bidIdx].lots;

        this.leftMoney -= toNum(price);

        this.log('calc', `${latestStage.tradeId} After:
          holdingLots ${this.holdingLots};
          leftMoney: ${this.leftMoney};
          bids: ${stringify(this.bids)};
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
  public get ProcessingMoney() { return Object.values(this.bids).reduce((acc, p) => p.isExecuted ? p.dealSum + acc : acc + (p.executedLots * p.price), 0); }
  public get HoldingLots() { return this.holdingLots; }
  public get ProcessingBuyOrders() { return Object.values(this.bids).reduce((acc, p) => p.isExecuted ? p.lots + acc : acc + p.executedLots, 0); }
  public get ProcessingSellOrders() { return Object.values(this.asks).reduce((acc, p) => p.isExecuted ? p.lots + acc : acc + p.executedLots, 0); }
}