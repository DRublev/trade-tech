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
  private deals: { [orderId: string]: Deal } = {};

  constructor(private onDealsChange: (latestDeal?: Deal) => void) {
    (window as any).ipc.on(ipcEvents.strategylog, this.subscribe.bind(this));
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
    const isCancelBidLog = log.includes('cancelling orders');
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
      this.onDealsChange(this.deals[id]);
    } catch(e) {
      console.error('Processing place order log error', e, log);
    }
  }

  private processClosingOrderLog(log: string) {
    try {
      const orderIds = Object.keys(this.deals).filter(id => log.includes(id));
      if (!orderIds.length) {
        console.info('Processing cancelling orders log no ids interesting', log);
        return;
      }

      for (const orderId of orderIds) {
        if (this.deals[orderId]) {
          this.deals[orderId].isClosed = true;
        }
      }
      this.onDealsChange(undefined);
    } catch (e) {
      console.error('Processing cancelling orders log', e, log);
    }
  }

  public get Deals() { return Object.values(this.deals); }
  public get Logs() { return this.rawLogs; }
}