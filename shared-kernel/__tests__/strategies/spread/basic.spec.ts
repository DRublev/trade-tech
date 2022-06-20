import { getStrategyConstructor, IStrategy, Strategies } from '../../..';

const spreadConstructor = getStrategyConstructor(Strategies.SpreadScalping);
const postOrderMock = async () => 'testorderid';
const cancelOrderMock = async () => {};

describe('Spread Strategy base cases', () => {
  let strategy: IStrategy;

  it('Init', () => {
    const testConfig = {
      figi: 'TRUR',
      parameters: {
        availableBalance: 12,
        maxHolding: 2,
        minSpread: 0,
        moveOrdersOnStep: 2,
        lotsDistribution: 2,
      }
    };
    strategy = new spreadConstructor(testConfig as any, postOrderMock, cancelOrderMock, process.stdout);
    expect(strategy).toBeDefined();
  });

  /*
    TEST
    push orderbook
    check if placing buy order
    push new profitable orderbook
    check if placing sell order
  */
});