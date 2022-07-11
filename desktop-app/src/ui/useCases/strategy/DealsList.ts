import { ipcEvents } from "@/constants";

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
  private pendingDeals: { [orderId: string]: Deal } = {};
  private rottenDeals: { [orderId: string]: Deal } = {};
  private deals: { [orderId: string]: Deal } = {};

  constructor(private onDealsChange: (latestDeal?: Deal, isPending?: boolean) => void) {
    window.ipc.on(ipcEvents.STRATEGY_LOG, this.subscribe.bind(this));
  }

  private subscribe(event: any, chunk: any) {
    if (!chunk) return;
    const log = new TextDecoder('utf-8').decode((chunk));
    this.rawLogs.push(log);
    this.tryToGetDealFromLog(log);
  }

  private tryToGetDealFromLog(_log: string) {
    // eslint-disable-next-line no-control-regex
    const log = _log.replace(/ /gi, '');
    const isPlacingOrderLog = log.includes('Placed') && log.includes('order');
    if (isPlacingOrderLog) {
      this.processPlaceOrderLog(log);
      return;
    }
    const isCancelBidLog = log.includes('cancelling order');
    if (isCancelBidLog) {
      this.processClosingOrderLog(log);
    }

    const isOrderExecuted = log.includes('BUY') || log.includes('SELL');
    if (isOrderExecuted) {
      const orderId = log.split(' ')[3].match(/\d+/)?.[0]
      if (orderId && this.pendingDeals[orderId]) {
        this.deals[orderId] = { ...this.pendingDeals[orderId], time: Date.now() };
        delete this.pendingDeals[orderId];
        this.onDealsChange(this.deals[orderId], false);
      }
    }
  }

  private processPlaceOrderLog(log: string) {
    try {
      const isBuy = log.includes('buy');
      const logData = log.split(' ').slice(isBuy ? -3 : -4);
      const [price, amount, id] = isBuy ? logData : logData.slice(0, 3);
      if (Number.isNaN(price) || Number.isNaN(amount) || !id) throw new TypeError('Placing order log incorrect format');

      const orderId = id.match(/\d+/)?.[0];
      if (orderId) {
        this.pendingDeals = Object.fromEntries(Object.entries(this.pendingDeals)
          .filter(([id, d]) => d.action !== (!isBuy ? 'buy' : 'sell')));
        this.pendingDeals[orderId] = {
          time: Date.now(),
          action: isBuy ? 'buy' : 'sell',
          lots: Number(amount),
          pricePerLot: Number(price),
          sum: Number(amount) * Number(price),
          isClosed: false,
        };
        this.onDealsChange(this.pendingDeals[orderId], true);
      }
    } catch (e) {
      console.error('Processing place order log error', e, log);
    }
  }

  private processClosingOrderLog(log: string) {
    try {
      const orderIds = Object.keys(this.pendingDeals).filter(id => log.includes(id));
      if (!orderIds.length) {
        console.info('Processing cancelling orders log no ids interesting', log);
        return;
      }

      for (const orderId of orderIds) {
        const id = orderId.match(/\d+/)?.[0];
        if (id && this.pendingDeals[id]) {
          this.pendingDeals[id].isClosed = true;
          this.rottenDeals[id] = { ...this.pendingDeals[id] };
          delete this.pendingDeals[id];
          this.onDealsChange(this.rottenDeals[id], true);
        }
      }
    } catch (e) {
      console.error('Processing cancelling orders log', e, log);
    }
  }

  public get Deals() { return Object.values(this.deals); }
  public get PendingDeals() { return Object.values(this.pendingDeals); }
  public get Logs() { return this.rawLogs; }
}