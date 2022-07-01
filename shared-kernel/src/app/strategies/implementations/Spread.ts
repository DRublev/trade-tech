import * as fs from 'fs';
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
  stopLoss: number;
  sharesInLot: number;
  enteringPrice?: number;
};

type ToPlaceOrderInfo = {
  lots: number;
  price: number;
  idx: number;
  isStop?: boolean;
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
  isStop?: boolean;
  executedLots: number;
  idx: number;
}

/**
 * -- Цена захода в позицию
 * -- Поиск выгодного ask не по первому айтему, а по X (из конфига)
 * -- поддержка частичного исполнения заявок
 * -- знать на каком ask выйти прежде чем зайти в позицию
 * -- заход не на весь баланс, а по частям (покупка n+1 должна быть на N бидов ниже)
 */
export default class SpreadStrategy implements IStrategy {
  private isWorking = true;
  private isProcessing = false;
  private hasEnteredPosition = false;

  private leftMoney = 0;
  private holdingLots = 0;

  private bids: { [bid: number]: PositionState } = {};
  private asks: { [ask: number]: PositionState } = {};
  private archive: PositionState[] = [];


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
    try {
      if (!this.isWorking) return;
      if (this.isProcessing) return;
      this.isProcessing = true;
      this.latestOrderbook = orderbook;

      this.log('calc', `Orderbook ${stringify(orderbook)}`)
      this.log('calc', 'Cancelling rotten bids');
      const shouldSkip = await this.cancelRottenBidOrders(orderbook);
      this.log('calc', 'Calculating to buy');
      const toBuyInfo = this.calcToBuy(orderbook);
      this.log('calc', 'Calculating to sell');
      const toSellInfo = await this.calcToSell(orderbook);

      if (toBuyInfo && toBuyInfo.length) {
        for await (const buyReq of toBuyInfo) {
          this.log('calc', `Placing buy order: ${stringify(buyReq)}`);
          const placedId = await this.postOrder(orderbook.figi, buyReq.lots, buyReq.price, true);
          this.watchingOrders.push(placedId);
          this.bids[buyReq.price] = {
            price: buyReq.price,
            lots: buyReq.lots,
            dealSum: (buyReq.lots * (this.config.sharesInLot || 1)) * buyReq.price,
            isExecuted: false,
            orderId: placedId,
            idx: buyReq.idx,
            executedLots: 0,
            stopLoss: this.config.stopLoss ? buyReq.price - this.config.stopLoss : undefined,
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
            dealSum: (sellReq.lots * (this.config.sharesInLot || 1)) * sellReq.price,
            isExecuted: false,
            orderId: placedId,
            executedLots: 0,
            stopLoss: this.config.stopLoss ? sellReq.price - this.config.stopLoss : undefined,
            isStop: !!sellReq.isStop,
          };
          this.log('calc', `New asks map ${stringify(this.asks)}`);
        }
      }

      return null;
    } catch (e) {
      console.log('133 Spread', e);
      this.log('error', e.toString());
    } finally {
      this.isProcessing = false;
    }
  }

  private calcToBuy(orderbook: Orderbook): ToPlaceOrderInfo[] {
    try {
      const notExecutedBuy = Object.values(this.bids)
        .reduce((acc, bid) => bid.isPartiallyExecuted
          ? (bid.lots - bid.executedLots) + acc
          : acc + (!bid.isExecuted ? bid.lots : 0), 0);
      const isHoldingMax = notExecutedBuy + this.holdingLots >= this.config.maxHolding;
      if (isHoldingMax) {
        this.log('info', `Already holding max shares; holding: ${this.holdingLots}, processing: ${notExecutedBuy}; bids: ${stringify(this.bids)}`);
        return [];
      }
      this.log('calc', `holding not enough lots; holding: ${this.holdingLots}, processing: ${notExecutedBuy}; bids: ${stringify(this.bids)}`)
      const minBid = toNum(orderbook.bids[0].price);
      this.log('calc', `Min bid: ${stringify(minBid)}; Money left: ${this.leftMoney}`);
      if (!this.hasEnteredPosition && this.config.enteringPrice) {
        if (minBid > this.config.enteringPrice) {
          this.log('calc', `Waiting to enter profit position; enter price: ${this.config.enteringPrice}; min bid: ${minBid}`);
          return [];
        } else {
          this.hasEnteredPosition = true;
        }
      }
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
      console.log('184 Spread', e);
      this.log('error', e.toString());
      return [];
    }
  }

  private async calcToSell(orderbook: Orderbook): Promise<ToPlaceOrderInfo[]> {
    try {
      const toSell: ToPlaceOrderInfo[] = [];

      const notExecutedBids = Object.values(this.bids).filter(b => b.isExecuted && !b.isReserved && b.stopLoss);
      for (const bid of notExecutedBids) {
        this.log('calc', `Stop loss calc for ${stringify(bid)}; ask: ${stringify(orderbook.asks[0])}`);
        if (toNum(orderbook.asks[0].price) <= bid.stopLoss) {
          this.log('calc', `Stop loss detected for ${(stringify(bid))}; bid.stopLoss: ${bid.stopLoss} ; ask: ${stringify(orderbook.asks[0])};`);
          toSell.push({
            price: bid.stopLoss,
            lots: bid.isPartiallyExecuted ? bid.executedLots : bid.lots,
            idx: 0,
            isStop: true,
          });
          this.bids[bid.price].isReserved = true;
        }
      }
      this.log('calc', `Pending asks: ${stringify(Object.values(this.asks).filter(a => !a.isExecuted))}`)
      const pendingAsks = Object.values(this.asks).filter(a => !a.isExecuted && !a.isReserved && !a.isStop);
      for (const ask of pendingAsks) {
        const midPrice = (toNum(orderbook.asks[0].price) + toNum(orderbook.bids[0].price)) / 2;
        this.log('calc', `Stop loss calc for ${stringify(ask)}; midPrice: ${midPrice}; bid: ${stringify(orderbook.bids[0])}; ask: ${stringify(orderbook.asks[0])}`);
        if (midPrice <= ask.stopLoss) {
          this.log('calc', `Stop loss detected for ${stringify(ask)}; ask.stopLoss: ${ask.stopLoss} ; ask: ${stringify(orderbook.asks[0])};`);
          await this.cancelOrder(ask.orderId);
          toSell.push({
            price: ask.stopLoss,
            lots: ask.isPartiallyExecuted ? ask.executedLots : ask.lots,
            idx: 0,
            isStop: true,
          });
          this.asks[ask.price].isReserved = true;
        }
      }
      const notExecutedSell = Object.values(this.asks)
        .filter((ask) => !ask.isReserved)
        .reduce((acc, p) => !p.isExecuted ? p.lots + acc : acc, 0);
      if (this.holdingLots - notExecutedSell <= 0) {
        this.log('calc', `Nothing to sell; holding: ${this.holdingLots}; notExecutedSell: ${notExecutedSell}`);
        return toSell;
      }


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
      console.log('253 Spread', e);
      this.log('error', e.toString());
      return [];
    }
  }

  private async cancelRottenBidOrders(orderbook: Orderbook): Promise<boolean> {
    try {
      const placedBids = Object.keys(this.bids);
      for (const bid of placedBids) {
        let idx = orderbook.bids.findIndex(b => toNum(b.price) == Number(bid));
        this.log('calc', `Rotten bids idx ${idx}; bid: ${stringify(bid)}; bids: ${stringify(this.bids)}`);
        if (idx === -1 && !this.bids[bid].isExecuted) {
          this.log('calc', `Bid ${stringify(bid)} not found in orderbook`);
          for (let i = 0; i < orderbook.bids.length; i++) {
            if (orderbook.bids[i].price) {
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
        }
        if ((idx + 1) > this.config.moveOrdersOnStep && !this.bids[bid].isExecuted) {
          this.log('calc', `Bid ${bid} is too far from the top, cancelling order, ${stringify(this.bids[bid].orderId)}`);
          await this.cancelOrder(this.bids[bid].orderId);
          delete this.bids[bid];
          return true;
        }
        if (idx !== -1 && this.bids[bid] && orderbook.bids[idx].quantity === this.bids[bid].lots && !this.bids[bid].isExecuted) {
          this.log('calc', `Bid ${bid} is only ours, cancelling order, ${stringify(this.bids[bid].orderId)}`);
          await this.cancelOrder(this.bids[bid].orderId);
          delete this.bids[bid];
          return true;
        }
      }
      return false;
    } catch (e) {
      console.log('283 Spread', e);
      this.log('error', e.toString());
    }
  }

  public async onOrderChanged(order: Order): Promise<void> {
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
          this.archive.push({ ...this.asks[askIdx], isBuy: false });
          const bids = Object.values(this.bids);
          for (const bid of bids) {
            if (bid.isReserved && bid.isExecuted) {
              delete this.bids[bid.price];
            }
          }
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
          this.archive.push({ ...this.bids[bidIdx], isBuy: true });
        } else {
          this.log('info', `Order ${order.orderId} is executed and not specified ${order}`);
        }
        this.processedOrders.push(order.orderId);
        await this.onOrderbook(this.latestOrderbook);
        return;
      } else {
        this.log('calc', `Partially executed order ${order}`);
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
      console.log('429 Spread', e);
      this.log('error', e.toString());
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
  public get Version() { return '1.0.2'; }
  public get IsWorking() { return this.isWorking; }
}