import { toQuotation } from '@/infra/tinkoff/helpers';
import { getStrategyConstructor, IStrategy, Strategies } from '../../..';

const spreadConstructor = getStrategyConstructor(Strategies.SpreadScalping);
const postOrderMock = async () => 'testorderid';
const cancelOrderMock = async () => { };
const orderbooksToTest = [
  {
    "figi": "BBG00DHTYPH8", "depth": 20, "isConsistent": true,
    "bids": [{ "price": 40.5, "quantity": 40 }, { "price": 40.42, "quantity": 100 }, { "price": 40, "quantity": 102 }, { "price": 39.3, "quantity": 80 }, { "price": 38.6, "quantity": 80 }],
    "asks": [{ "price": 43, "quantity": 49 }, { "price": 43.73, "quantity": 20 }, { "price": 44.4, "quantity": 7 }, { "price": 45.36, "quantity": 25 }, { "price": 45.71, "quantity": 100 }],
    "time": "2022-06-14T12:00:57.164Z", "limitUp": { "units": 46, "nano": 970000000 }, "limitDown": { "units": 38, "nano": 450000000 }
  },
  {
    "figi": "BBG00DHTYPH8", "depth": 20, "isConsistent": true,
    "bids": [{ "price": 40.5, "quantity": 40 }, { "price": 40.42, "quantity": 100 }, { "price": 40, "quantity": 102 }, { "price": 39.3, "quantity": 80 }, { "price": 38.6, "quantity": 80 }],
    "asks": [{ "price": 43, "quantity": 49 }, { "price": 43.73, "quantity": 20 }, { "price": 44.4, "quantity": 7 }, { "price": 45.36, "quantity": 25 }, { "price": 45.71, "quantity": 100 }],
    "time": "2022-06-14T12:00:57.743Z", "limitUp": { "units": 46, "nano": 970000000 }, "limitDown": { "units": 38, "nano": 450000000 }
  },
  {
    "figi": "BBG00DHTYPH8", "depth": 20, "isConsistent": true,
    "bids": [{ "price": 40.5, "quantity": 40 }, { "price": 40.42, "quantity": 100 }, { "price": 40, "quantity": 102 }, { "price": 39.3, "quantity": 80 }, { "price": 38.6, "quantity": 80 }],
    "asks": [{ "price": 40.5, "quantity": 49 }, { "price": 43.73, "quantity": 20 }, { "price": 44.4, "quantity": 7 }, { "price": 45.36, "quantity": 25 }, { "price": 45.71, "quantity": 100 }],
    "time": "2022-06-14T12:00:58.000Z", "limitUp": { "units": 46, "nano": 970000000 }, "limitDown": { "units": 38, "nano": 450000000 }
  },
].map(o => ({
  ...o,
  bids: o.bids.map(b => ({
    quantity: b.quantity,
    price: toQuotation(b.price),
    currency: 'usd'
  })),
  asks: o.asks.map(b => ({
    quantity: b.quantity,
    price: toQuotation(b.price),
    currency: 'usd'
  })),
}));

const getOrder = (id, lots, pricePerLot, isBuy, commission = 0.02) => ({
  orderId: id,
  executionReportStatus: 1,
  lotsRequested: lots,
  lotsExecuted: lots,
  initialOrderPrice: toQuotation(lots * pricePerLot) as any,
  executedOrderPrice: toQuotation(lots * pricePerLot) as any,
  totalOrderAmount: toQuotation((lots * pricePerLot) + commission) as any,
  averagePositionPrice: toQuotation(pricePerLot) as any,
  initialCommission: toQuotation(commission) as any,
  executedCommission: toQuotation(commission) as any,
  figi: 'BBG00DHTYPH8',
  direction: isBuy ? 1 : 2,
  initialSecurityPrice: toQuotation(0) as any,
  stages: [],
  serviceCommission: toQuotation(0) as any,
  currency: 'usd',
  orderType: 1,
  orderDate: new Date(),
});

describe('Spread Strategy base cases', () => {
  // let strategy: IStrategy;

  const testConfig = {
    figi: 'TRUR',
    parameters: {
      availableBalance: 120,
      maxHolding: 2,
      minSpread: 0,
      moveOrdersOnStep: 2,
      lotsDistribution: 2,
    }
  };

  it('Init', () => {
    const strategy = new spreadConstructor(testConfig as any, postOrderMock, cancelOrderMock, process.stdout);
    expect(strategy).toBeDefined();
  });

  it('Must make buy order', async () => {
    expect.assertions(1);

    return new Promise((resolve) => {
      const strategy = new spreadConstructor(testConfig.parameters, async (figi, lots, pricePerLot, isBuy) => {
        expect(isBuy).toBeTruthy();
        resolve(true);
        return 'test-id';
      }, cancelOrderMock, process.stdout);

      strategy.onOrderbook(orderbooksToTest[0] as any);
    });
  });
  it('Should sell bought', async () => {
    expect.assertions(1);

    let boughtLots = 0;
    let boughtPrice = 0;
    return new Promise(async (resolve) => {
      const strategy = new spreadConstructor(testConfig.parameters, async (figi, lots, pricePerLot, isBuy) => {
        if (isBuy) {
          boughtLots = lots;
          boughtPrice = pricePerLot;
        } else {
          expect(lots).toBeLessThanOrEqual(boughtLots);
          resolve(true);
        }
        return 'test-id';
      }, cancelOrderMock, process.stdout);

      await strategy.onOrderbook(orderbooksToTest[0] as any);
      await strategy.onOrderChanged(getOrder('test-id', boughtLots, boughtPrice, true));
      await strategy.onOrderbook(orderbooksToTest[1] as any);
    });
  })

  it('Should make profitable deal', () => {
    expect.assertions(2);

    let boughtLots = 0;
    let boughtPrice = 0;
    let sellPrice = 0;
    return new Promise(async (resolve) => {
      const strategy = new spreadConstructor(testConfig.parameters, async (figi, lots, pricePerLot, isBuy) => {
        if (isBuy) {
          boughtLots = lots;
          boughtPrice = pricePerLot;
        } else {
          expect(lots).toBeLessThanOrEqual(boughtLots);
          sellPrice = pricePerLot;
        }
        return 'test-id';
      }, cancelOrderMock, process.stdout);
      
      await strategy.onOrderbook(orderbooksToTest[0] as any);
      await strategy.onOrderChanged(getOrder('test-id', boughtLots, boughtPrice, true));
      await strategy.onOrderbook(orderbooksToTest[1] as any);
      await strategy.onOrderChanged(getOrder('test-id', boughtLots, sellPrice, false));
      expect(strategy.LeftMoney).toBeGreaterThan(testConfig.parameters.availableBalance);
      resolve(true);
    });
  })
});