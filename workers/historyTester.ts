import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { Duplex } from 'stream';
import { AssembleTinkoffSdk, getStrategyConstructor, Strategies } from 'shared-kernel';
import { IStrategy } from 'shared-kernel';

const storagePath = path.resolve(__dirname, '../data-storage');
const nanoPrecision = 1_000_000_000;
const TinkoffSdk = AssembleTinkoffSdk(process.env.TINKOFF_TOKEN, false);
const toNum = (qutation: { units: number, nano: number }) => Number(qutation.units) + (qutation.nano / nanoPrecision);

const toQuotation = (number: number) => {
  const decimal = (number - Math.floor(Number(number))).toFixed(9);
  return ({
  units: Math.floor(number),
  nano: decimal.slice(2) as any as number,
  currency: 'usd',
})};

const pendingOrders: {
  [orderId: string]: any; // Order
} = {}

let strategy: IStrategy;
let dealsCount = 0;
const postOrder = async (figi: string, lots: number, pricePerLot: number, isBuy: boolean) => {
  const orderId = randomUUID();
  pendingOrders[orderId] = {
    figi,
    lots,
    pricePerLot,
    isBuy,
    sum: lots * pricePerLot,
  };
  setTimeout(() => {
    strategy.onOrderChanged({
      orderId,
      executionReportStatus: 1,
      lotsRequested: lots,
      lotsExecuted: lots,
      initialOrderPrice: toQuotation(lots * pricePerLot),
      executedOrderPrice: toQuotation(lots * pricePerLot),
      totalOrderAmount: toQuotation((lots * pricePerLot) + 0.02),
      averagePositionPrice: toQuotation(pricePerLot),
      initialCommission: toQuotation(0.02),
      executedCommission: toQuotation(0.02),
      figi: 'BBG00DHTYPH8',
      direction: isBuy ? 1 : 2,
      initialSecurityPrice: toQuotation(0),
      stages: [],
      serviceCommission: toQuotation(0),
      currency: 'usd',
      orderType: 1,
      orderDate: new Date(),
    });
    dealsCount++;
  }, 2);
  return orderId;
};

const cancelOrder = async (orderId: string) => {
  if (pendingOrders[orderId]) {
    delete pendingOrders[orderId];
  }
}

const collectMetrics = async () => {
  try {
    
    return new Promise(async (resolve) => {
      const history = await selectInstruments();
      const spreadConstructor = getStrategyConstructor(Strategies.SpreadScalping);
      const orderbookLogStream = fs.createWriteStream(`spread_history_gtlb_2022-6-14.log`, { flags: 'a' });
      const logstream = new Duplex();
      logstream.pipe(process.stdout);
      orderbookLogStream.write('\n----------\n');
  
      logstream._write = (chunk, encoding, next) => {
        orderbookLogStream.write(new Date().toLocaleTimeString() + ' ' + chunk);
        next();
      };
      logstream._read = (s: any) => { };
      strategy = new spreadConstructor({
        availableBalance: 200,
        maxHolding: 4,
        minSpread: 0,
        moveOrdersOnStep: 2,
        lotsDistribution: 2,
      } as any, postOrder, cancelOrder, logstream);
  
      let idx = 0;
      let intervalId;
      const timeout = 10;
      console.log('Estimated simulation waiting time: ', history.changes.length * timeout / 60000);
      console.log('Initial balance',  strategy.LeftMoney);
      intervalId = setInterval(() => {
        if (idx !== history.changes.length) {
          const orderbook = history.changes[idx];
          orderbook.bids = orderbook.bids.map(o => ({ ...o, price: toQuotation(o.price) }));
          orderbook.asks = orderbook.asks.map(o => ({ ...o, price: toQuotation(o.price) }));
          strategy.onOrderbook(orderbook);
          idx += 1;
        } else {
          clearInterval(intervalId);
          console.log('Balance after simulation', strategy.LeftMoney, strategy.HoldingLots, strategy.ProcessingSellOrders);
          console.log('Made deals: ', dealsCount)
          resolve(1);
        }
      }, timeout);
    });
  } catch (e) {
    console.error(e);
  }
};

const selectInstruments = async () => {
  try {
    const gtlbHistory = JSON.parse(fs.readFileSync(path.join(storagePath, './orderbooks 2/BBG00DHTYPH8/2022-6-14/BBG00DHTYPH8.json'), 'utf8'));
    return gtlbHistory;
  } catch (e) {
    console.error(e);
  }
};

collectMetrics();
