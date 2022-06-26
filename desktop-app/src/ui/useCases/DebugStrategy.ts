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
      availableBalance: 50,
      maxHolding: 5,
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
      maxHolding: 50,
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
      moveOrdersOnStep: 2,
      lotsDistribution: 1,
      stopLoss: 0.1,
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

      (window as any).ipc.invoke('test', DEBUG_CONFIGS.GTLB);
      console.log('94 DebugStrategy');
      // (window as any).ipc.send('START_TRADING', DEBUG_CONFIGS.GTLB);
    } catch (e) {
      console.error(e);
    }
  }
}