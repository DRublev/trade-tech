const DEBUG_CONFIGS = {
  'VEON': {
    figi: 'BBG000QCW561',
    parameters: {
      availableBalance: 3.9,
      maxHolding: 1,
      minSpread: 0.02,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
    }
  },
  'TGLD': {
    figi: 'BBG222222222',
    parameters: {
      availableBalance: '20',
      maxHolding: 1,
      minSpread: 0,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.0001,
      sharesInLot: 100,
    }
  },
  'TRUR': {
    figi: 'BBG000000001',
    parameters: {
      availableBalance: 300,
      maxHolding: 2,
      minSpread: 0,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
    }
  },
  'INSG': {
    figi: 'BBG00DWX7QH0',
    parameters: {
      availableBalance: 3.9,
      maxHolding: 1,
      minSpread: 0.02,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
    }
  },
  'AMTI': {
    figi: 'BBG00R240WL5',
    parameters: {
      availableBalance: 3.9,
      maxHolding: 1,
      minSpread: 0.02,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
    }
  },
  'CVM': {
    figi: 'BBG000H5G6L5',
    parameters: {
      availableBalance: 4.9,
      maxHolding: 1,
      minSpread: 0.02,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
    }
  },
  'GTLB': {
    figi: 'BBG00DHTYPH8',
    parameters: {
      availableBalance: 70,
      maxHolding: 1,
      minSpread: 0.06,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.1,
    }
  },
  'PIKK': {
    figi: 'BBG004S68BH6',
    parameters: {
      availableBalance: 1100,
      maxHolding: 1,
      minSpread: 0.6,
      moveOrdersOnStep: 2,
      lotsDistribution: 1,
      stopLoss: 15,
    }
  },
  'MDMG': {
    figi: 'BBG00Y3XYV94',
    parameters: {
      availableBalance: 500,
      maxHolding: 1,
      minSpread: 0.34,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.6,
    }
  },
  'GEMC': {
    figi: 'BBG011MCM288',
    parameters: {
      availableBalance: 500,
      maxHolding: 1,
      minSpread: 0.34,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.3,
    }
  },
  'OKEY': {
    figi: 'BBG00172J7S9',
    parameters: {
      availableBalance: 250,
      maxHolding: 1,
      minSpread: 0.09,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.06,
      sharesInLot: 10,
    }
  },
  'PLOY': {
    figi: 'BBG004PYF2N3',
    parameters: {
      availableBalance: 460,
      maxHolding: 1,
      minSpread: 0.24,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 1.5,
    }
  },
  'LIFE': {
    figi: 'BBG0019K04R5',
    parameters: {
      availableBalance: 450,
      maxHolding: 1,
      minSpread: 0.005,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.01,
      sharesInLot: 100,
    }
  },
  'FIXP': {
    figi: 'BBG00ZHCX1X2',
    parameters: {
      availableBalance: 310,
      maxHolding: 1,
      minSpread: 0.5,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 3,
    }
  },
  'TCX': {
    figi: 'BBG000L69KL5',
    parameters: {
      availableBalance: 50,
      maxHolding: 1,
      minSpread: 0.04,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.4,
    }
  },
}
export default class DebugStrategyUseCase {
  private logs: string[] = [];


  public get Logs() {
    return this.logs;
  }


  public async startStrategy() {
    try {
      (window as any).ipc.on('strategylog', (event: any, chunk: any) => {
        const log = new TextDecoder().decode((chunk));
        console.log('8 DebugStrategy', log);
        this.logs.push(log);
      });

      // (window as any).ipc.invoke('test', DEBUG_CONFIGS.GTLB);
      console.log('94 DebugStrategy');
      (window as any).ipc.send('START_TRADING', DEBUG_CONFIGS.TCX);
    } catch (e) {
      console.error(e);
    }
  }
}