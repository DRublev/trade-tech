import { ipcEvents } from "@/constants";
import logger from "@node/infra/Logger";

export type Deal = {
  time: number;
  action: 'buy' | 'sell',
  lots: number;
  pricePerLot: number;
  sum: number;
  isClosed: boolean;
}

export default class DealsListUseCase {
  private rawLogs: string[] = [];
  private deals: { [orderId: string]: Deal } = {};

  constructor() {
    (window as any).ipc.on(ipcEvents.strategylog, this.subscribe);
  }

  private subscribe(event: any, chunk: any) {
    if (!chunk) return;
    const log = new TextDecoder().decode((chunk));
    this.rawLogs.push(log);
    this.tryToGetDealFromLog(log);
  }

  private tryToGetDealFromLog(log: string) {
    console.log('26 DealsList', log);
    const isPlacingOrderLog = log.match(/^Placing\s(buy|sell)\sorder/);
    if (isPlacingOrderLog) {
      this.processPlaceOrderLog(log);
      return;
    }
    const isCancelBidLog = log.match(/^Bid.*is too far from the top, cancelling orders/);
    if (isCancelBidLog) {
      this.processClosingOrderLog(log);
    }
  }

  private processPlaceOrderLog(log: string) {
    try {
      const logData = log.split(' ').slice(-3);
      const [price, amount, id] = logData;
      if (Number.isNaN(price) || Number.isNaN(amount) || !id) throw new TypeError('Placing order log incorrect format');
      const isBuy = log.includes('buy');

      this.deals[id] = {
        time: Date.now(),
        action: isBuy ? 'buy' : 'sell',
        lots: Number(amount),
        pricePerLot: Number(price),
        sum: Number(amount) * Number(price),
        isClosed: false,
      };
    } catch(e) {
      logger.error('Processing place order log error', e, log);
    }
  }

  private processClosingOrderLog(log: string) {
    try {
      const orderIds = Object.keys(this.deals).filter(id => log.includes(id));
      if (!orderIds.length) {
        logger.info('Processing cancelling orders log no ids interesting', log);
        return;
      }

      for (const orderId of orderIds) {
        if (this.deals[orderId]) {
          this.deals[orderId].isClosed = true;
        }
      }
    } catch (e) {
      logger.error('Processing cancelling orders log', e, log);
    }
  }

  public get Deals() { return Object.values(this.deals); }
  public get Logs() { return this.rawLogs; }
}