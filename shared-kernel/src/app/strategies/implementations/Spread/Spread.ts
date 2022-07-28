import stringify from 'fast-safe-stringify';
import { OrderDirection } from 'invest-nodejs-grpc-sdk/dist/generated/orders';

import { Order } from "@/app/types/order";
import { Orderbook } from "@/app/types/orderbook";
import { toNum } from "@/infra/tinkoff/helpers";
import { InvalidOperationException } from '@/utils/exceptions';
import StrategyConfig from "../../Config";
import { IStrategy, CancelOrderCommand, PostOrderCommand } from "../../iStrategy";
import { PositionState, ToPlaceOrderInfo } from './types';
import SpreadStrategyState from './SpreadStrategyState';


export type SpreadStrategyConfig = StrategyConfig & {
  minSpread: number;
  moveOrdersOnStep: number;
  lotsDistribution: number;
  stopLoss: number;
  askStopLoss: number;
  sharesInLot: number;
  enteringPrice?: number;
  watchAsk?: number;
  waitTillNextBuyMs?: number;
  waitAfterStopLossMs?: number;
};

/**
 * -- поддержка частичного исполнения заявок
 * -- заход не на весь баланс, а по частям (покупка n+1 должна быть на N бидов ниже)
 */
export default class SpreadStrategy implements IStrategy {
  private isProcessing = false;
  private waitingBuyTimer = null;

  private archive: PositionState[] = [];

  private latestOrderbook: Orderbook;

  constructor(
    private config: SpreadStrategyConfig,
    private state: SpreadStrategyState,
    private postOrder: PostOrderCommand,
    private cancelOrder: CancelOrderCommand,
    private stdOut: NodeJS.WritableStream,
  ) {
    this.state.LeftMoney = Number(config.availableBalance);
  }
  changeConfig(newConfig: SpreadStrategyConfig): void {
    const toSet = Object.assign(this.config, newConfig);
    this.config = toSet;
  }

  public toggleWorking(): boolean {
    this.state.IsWorking = !this.state.IsWorking;
    return this.state.IsWorking;
  }

  public async onOrderbook(orderbook: Orderbook): Promise<void> {
    try {
      if (!this.state.IsWorking) return;
      if (this.isProcessing) return;
      this.isProcessing = true;
      this.latestOrderbook = orderbook;

      this.log('calc', `Orderbook ${stringify(orderbook)}`)
      this.log('calc', 'Cancelling rotten bids');
      const shouldSkip = await this.cancelRottenBidOrders(orderbook);
      if (shouldSkip) {
        return;
      }
      this.log('calc', 'Calculating to buy');
      const toBuyInfo = this.calcToBuy(orderbook);
      this.log('calc', 'Calculating to sell');
      const toSellInfo = await this.calcToSell(orderbook);

      if (toBuyInfo && toBuyInfo.length) {
        for await (const buyReq of toBuyInfo) {
          this.log('calc', `Placing buy order: ${stringify(buyReq)}`);
          const placedId = await this.postOrder(orderbook.figi, buyReq.lots, buyReq.price, true);
          this.state.WatchOrder(placedId);
          this.state.SetBid(buyReq.price, {
            price: buyReq.price,
            lots: buyReq.lots,
            dealSum: (buyReq.lots * (this.config.sharesInLot || 1)) * buyReq.price,
            isExecuted: false,
            orderId: placedId,
            idx: buyReq.idx,
            executedLots: 0,
            stopLoss: this.config.stopLoss ? buyReq.price - this.config.stopLoss : undefined,
          });

          this.log('calc', `Placed buy order: ${buyReq.price} ${buyReq.lots} ${placedId}`);
          this.log('calc', `New bids map ${stringify(this.state.Bids)}`);
        }
      }
      if (toSellInfo && toSellInfo.length) {
        for await (const sellReq of toSellInfo) {
          this.log('calc', `Placing sell order: ${stringify(sellReq)}`);
          const placedId = await this.postOrder(orderbook.figi, sellReq.lots, sellReq.price, false);
          this.state.WatchOrder(placedId);

          this.log('calc', `Placed sell order: ${sellReq.price} ${sellReq.lots} ${placedId} ${sellReq.forBid}`);
          this.state.SetAsk(sellReq.price, {
            price: sellReq.price,
            lots: sellReq.lots,
            idx: sellReq.idx,
            dealSum: (sellReq.lots * (this.config.sharesInLot || 1)) * sellReq.price,
            isExecuted: false,
            orderId: placedId,
            executedLots: 0,
            stopLoss: this.config.askStopLoss ? sellReq.price - this.config.askStopLoss : undefined,
            isStop: !!sellReq.isStop,
            becauseOfOrderId: sellReq.forBid,
          });
          this.log('calc', `New asks map ${stringify(this.state.Asks)}`);
        }
        if (!this.waitingBuyTimer && this.config.waitTillNextBuyMs) {
          this.waitingBuyTimer = setTimeout(() => {
            this.waitingBuyTimer = null;
          }, this.config.waitTillNextBuyMs);
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
      if (this.waitingBuyTimer) {
        this.log('calc', 'Waiting for next buy');
        return;
      }
      const notExecutedBuy = Object.values(this.state.Bids)
        .reduce((acc, bid) => bid.isPartiallyExecuted
          ? (bid.lots - bid.executedLots) + acc
          : acc + (!bid.isExecuted ? bid.lots : 0), 0);
      const isHoldingMax = notExecutedBuy + this.state.HoldingLots >= this.config.maxHolding;
      if (isHoldingMax) {
        this.log('info', `Already holding max shares; holding: ${this.state.HoldingLots}, processing: ${notExecutedBuy}; bids: ${stringify(this.state.Bids)}`);
        return [];
      }
      this.log('calc', `holding not enough lots; holding: ${this.state.HoldingLots}, processing: ${notExecutedBuy}; bids: ${stringify(this.state.Bids)}`)
      const minBid = toNum(orderbook.bids[0].price);
      this.log('calc', `Min bid: ${stringify(minBid)}; Money left: ${this.state.LeftMoney}`);
      if (!this.state.HasEnteredPosition && this.config.enteringPrice) {
        if (minBid > this.config.enteringPrice) {
          this.log('calc', `Waiting to enter profit position; enter price: ${this.config.enteringPrice}; min bid: ${minBid}`);
          return [];
        } else {
          this.state.HasEnteredPosition = true;
        }
      }
      if (this.state.LeftMoney < minBid) {
        this.log('info', `No money left. Left: ${this.state.LeftMoney}; Min bid: ${stringify(minBid)}`);
        return [];
      }

      const asks = orderbook.asks.slice(0, this.config.watchAsk || 1).map(ask => toNum(ask.price));
      const hasProfitableAsk = asks.some(a => a - minBid >= this.config.minSpread);
      if (!hasProfitableAsk) {
        this.log('calc', `No profitable exit point. Asks: ${stringify(asks)}; Min bid: ${minBid}; Min spread: ${this.config.minSpread}`);
        return [];
      }

      let lotsToBuy = this.config.maxHolding - notExecutedBuy - this.state.HoldingLots;
      while (lotsToBuy * minBid > this.state.LeftMoney) {
        this.log('calc', `Not enough money to buy ${lotsToBuy} lots. Left: ${this.state.LeftMoney}; Min bid: ${stringify(minBid)}`);
        lotsToBuy--;
      }
      const toBuyLots = [lotsToBuy];
      this.log('calc', `To buy: ${toBuyLots}`);
      const blockedMoney = Object.values(this.state.Bids).reduce((acc, bid) => !bid.isExecuted ? bid.dealSum + acc : acc, 0);
      const freeMoney = this.state.LeftMoney - blockedMoney;
      const canBuyLotsAmount = Math.floor(freeMoney / minBid);
      this.log('calc', `To buy more: ${canBuyLotsAmount}; ${this.state.LeftMoney} - ${blockedMoney} / ${minBid} = ${freeMoney / minBid}`);
      const bids = orderbook.bids.slice(0, toBuyLots.length);
      this.log('calc', `Bids: ${stringify(bids)}`);

      const dealSum = bids.reduce((acc, bid, idx) => acc + toNum(bid.price) * toBuyLots[idx], 0);
      this.log('calc', `Expected deal sum: ${dealSum}; Left money: ${this.state.LeftMoney}; Processing money: ${blockedMoney}`);
      if (dealSum > freeMoney) {
        this.log('calc', `Not enough money to buy. Left: ${this.state.LeftMoney}; Processing: ${blockedMoney}; Deal sum: ${dealSum}`);
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

      const notExecutedBids = Object.values(this.state.Bids).filter(b => b.isExecuted && !b.isReserved && b.stopLoss);
      for (const bid of notExecutedBids) {
        this.log('calc', `Stop loss calc for ${stringify(bid)}; ask: ${stringify(orderbook.asks[0])}`);
        if (toNum(orderbook.asks[0].price) <= bid.stopLoss) {
          this.log('calc', `Stop loss detected for ${(stringify(bid))}; bid.stopLoss: ${bid.stopLoss} ; ask: ${stringify(orderbook.asks[0])};`);
          toSell.push({
            price: bid.stopLoss,
            lots: bid.isPartiallyExecuted ? bid.executedLots : bid.lots,
            idx: 0,
            isStop: true,
            forBid: bid.orderId,
          });
          const tmpBid = this.state.Bids[bid.price];
          tmpBid.isReserved = true;
          this.state.SetBid(bid.price, tmpBid);
        }
      }
      this.log('calc', `Pending asks: ${stringify(Object.values(this.state.Asks).filter(a => !a.isExecuted))}`)
      const pendingAsks = Object.values(this.state.Asks).filter(a => !a.isExecuted && !a.isReserved && !a.isStop);
      for (const ask of pendingAsks) {
        const midPrice = toNum(orderbook.bids[0].price);
        this.log('calc', `Stop loss calc for ${stringify(ask)}; midPrice: ${midPrice}; bid: ${stringify(orderbook.bids[0])}; ask: ${stringify(orderbook.asks[0])}`);
        if (midPrice <= ask.stopLoss) {
          this.log('calc', `Stop loss detected for ${stringify(ask)}; ask.stopLoss: ${ask.stopLoss} ; ask: ${stringify(orderbook.asks[0])};`);
          await this.cancelOrder(ask.orderId);
          toSell.push({
            price: midPrice,
            lots: ask.isPartiallyExecuted ? ask.executedLots : ask.lots,
            idx: 0,
            isStop: true,
            forBid: ask.orderId,
          });
          const tmpAsk = this.state.Asks[ask.price];
          tmpAsk.isReserved = true;
          this.state.SetAsk(ask.price, tmpAsk);
        }
      }
      const notExecutedSell = Object.values(this.state.Asks)
        .filter((ask) => !ask.isReserved)
        .reduce((acc, p) => !p.isExecuted ? p.lots + acc : acc, 0);
      if (this.state.HoldingLots - notExecutedSell <= 0) {
        this.log('calc', `Nothing to sell; holding: ${this.state.HoldingLots}; notExecutedSell: ${notExecutedSell}`);
        return toSell;
      }


      const asks = orderbook.asks.slice(0, this.config.watchAsk || this.config.moveOrdersOnStep);
      this.log('calc', `Asks: ${stringify(asks)}`);
      const holdingPrices = Object.keys(this.state.Bids);
      this.log('calc', `Holding prices: ${stringify(holdingPrices)}`);
      let idx = 0;
      for (const ask of asks) {
        const askPrice = toNum(ask.price);
        const profitableHolding = holdingPrices.find((p) => this.state.Bids[p].isExecuted
          && !this.state.Bids[p].isReserved
          && Number(p) + this.config.minSpread <= askPrice);
        this.log('calc', `Ask price: ${askPrice}; Profitable holding: ${stringify(profitableHolding)}`);
        if (profitableHolding
          && (this.state.HoldingLots - notExecutedSell) >= this.state.Bids[profitableHolding].lots) {
          toSell.push({
            price: askPrice,
            lots: this.state.Bids[profitableHolding].lots,
            forBid: this.state.Bids[profitableHolding].orderId,
            idx,
          });
          const tmpBid = this.state.Bids[profitableHolding];
          tmpBid.isReserved = true;
          this.state.SetBid(+profitableHolding, tmpBid);
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
      const placedBids = Object.keys(this.state.Bids).filter(b => !this.state.Bids[b].isReserved && !this.state.Bids[b].isExecuted);
      for (const bid of placedBids) {
        let idx = orderbook.bids.findIndex(b => toNum(b.price) == Number(bid));
        this.log('calc', `Rotten bids idx ${idx}; bid: ${stringify(bid)}; bids: ${stringify(this.state.Bids)}`);
        if (idx === -1 && !this.state.Bids[bid].isExecuted) {
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
        if ((idx + 1) > this.config.moveOrdersOnStep && !this.state.Bids[bid].isExecuted) {
          this.log('calc', `Bid ${bid} is too far from the top, cancelling order, ${stringify(this.state.Bids[bid].orderId)}`);
          await this.cancelOrder(this.state.Bids[bid].orderId);
          this.state.RemoveBid(+bid);
          return true;
        }
        if (idx !== -1 && this.state.Bids[bid] && orderbook.bids[idx].quantity === this.state.Bids[bid].lots && !this.state.Bids[bid].isExecuted) {
          this.log('calc', `Bid ${bid} is only ours, cancelling order, ${stringify(this.state.Bids[bid].orderId)}`);
          await this.cancelOrder(this.state.Bids[bid].orderId);
          this.state.RemoveBid(+bid);
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
      if (!this.state.WatchingOrders.includes(order.orderId)) {
        this.log('info', `Not tracked order ${order.orderId}`);
        return;
      }
      const allAsks = Object.values(this.state.Asks).map(p => p.orderId).join();
      const allBids = Object.values(this.state.Bids).map(p => p.orderId).join();
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

      if (isExecuted && !this.state.ProcessedOrders.includes(order.orderId)) {
        if (isSell) {
          this.log('info', `SELL Order ${order.orderId} is executed. Holding lots: ${this.state.HoldingLots}`);
          const [askIdx] = Object.entries(this.state.Asks).find(([price, ask]) => ask.orderId === order.orderId) || [];
          if (!askIdx) {
            this.log('error', `Not found ask position for order ${order.orderId}; asks: ${stringify(this.state.Asks)}`);
            return;
          }
          this.log('calc', `before Holding lots: ${this.state.HoldingLots}; Lots executed: ${order.lotsExecuted}; asks: ${stringify(this.state.Asks)}`);
          this.state.HoldingLots = this.state.HoldingLots - order.lotsExecuted;
          const tmpAsk = this.state.Asks[askIdx];
          tmpAsk.isExecuted = true;
          tmpAsk.executedLots = order.lotsExecuted;
          this.state.SetAsk(+askIdx, tmpAsk);
          this.state.LeftMoney = this.state.LeftMoney + toNum(order.totalOrderAmount);

          this.log('calc', `after Holding lots: ${this.state.HoldingLots}; Lots executed: ${order.lotsExecuted}; asks: ${stringify(this.state.Asks)}`);
          this.log('calc', `Left money: ${this.LeftMoney}`);
          if (this.state.Asks[askIdx].isStop && this.config.waitAfterStopLossMs) {
            this.log('info', `Waiting ${this.config.waitAfterStopLossMs} ms after stop loss`);
            this.waitingBuyTimer = setTimeout(() => {
              this.waitingBuyTimer = null;
            }, this.config.waitAfterStopLossMs);
          }
          this.archive.push({ ...this.state.Asks[askIdx], isBuy: false });
          const bids = Object.values(this.state.Bids);
          for (const bid of bids) {
            if (bid.isReserved && bid.isExecuted) {
              this.state.RemoveBid(bid.price);
            }
          }
        } else if (isBuy) {
          this.log('info', `BUY Order ${order.orderId} is executed. Holding lots: ${this.state.HoldingLots}`);
          const [bidIdx] = Object.entries(this.state.Bids).find(([price, bid]) => bid.orderId === order.orderId) || [];
          if (!bidIdx) {
            this.log('error', `Not found bid position for order ${order.orderId}; bids: ${stringify(this.state.Bids)}`);
            return;
          }
          this.log('calc', `before Holding lots: ${this.state.HoldingLots}; Lots executed: ${order.lotsExecuted}; bids: ${stringify(this.state.Bids)}`);
          this.state.HoldingLots = this.state.HoldingLots + order.lotsExecuted;
          const tmpBid = this.state.Bids[bidIdx];
          tmpBid.isExecuted = true;
          tmpBid.executedLots = order.lotsExecuted;
          this.state.SetBid(+bidIdx, tmpBid);

          this.log('calc', `after Holding lots: ${this.state.HoldingLots}; Lots executed: ${order.lotsExecuted};  bids: ${stringify(this.state.Bids)}`);
          this.state.LeftMoney = this.state.LeftMoney - toNum(order.totalOrderAmount);
          this.archive.push({ ...this.state.Bids[bidIdx], isBuy: true });
        } else {
          this.log('info', `Order ${order.orderId} is executed and not specified ${order}`);
        }
        this.state.MarkOrderProcessed(order.orderId);
        await this.onOrderbook(this.latestOrderbook);
        return;
      } else {
        this.log('calc', `Partially executed order ${order}`);
        return;
      }
    } catch (e) {
      console.log('429 Spread', e);
      this.log('error', e.toString());
    }
  }

  private log(level: 'calc' | 'info' | 'error', message: string | any) {
    this.stdOut.write(`${level}: ${typeof message === 'string' ? message : stringify(message)}\n`);
  }

  public setState(state: SpreadStrategyState): void {
    if (this.state.IsWorking) throw new InvalidOperationException('Cannot change state while working');
    this.state = state;
  }

  public get LeftMoney() { return this.state.LeftMoney; }
  public get ProcessingMoney() { return Object.values(this.state.Bids).reduce((acc, p) => p.isExecuted ? p.dealSum + acc : acc + (p.executedLots * p.price), 0); }
  public get HoldingLots() { return this.state.HoldingLots; }
  public get ProcessingBuyOrders() { return Object.values(this.state.Bids).reduce((acc, p) => p.isExecuted ? p.lots + acc : acc + p.executedLots, 0); }
  public get ProcessingSellOrders() { return Object.values(this.state.Asks).reduce((acc, p) => p.isExecuted ? p.lots + acc : acc + p.executedLots, 0); }
  public get Version() { return '1.0.12'; }
  public get IsWorking() { return this.state.IsWorking; }
}