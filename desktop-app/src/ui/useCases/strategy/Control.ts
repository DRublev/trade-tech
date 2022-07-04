import { ipcEvents } from "@/constants";

const configs = {
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
      availableBalance: 8,
      maxHolding: 1,
      minSpread: 0.0002,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.0004,
      sharesInLot: 100,
      watchAsk: 3,
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
      minSpread: 0.08,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.4,
      watchAsk: 3,
    }
  },
  'ROSN': {
    figi: 'BBG004731354',
    parameters: {
      availableBalance: 450,
      maxHolding: 1,
      minSpread: 0.5,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.4,
      watchAsk: 3,
    }
  },
  'ETLN': {
    figi: 'BBG001M2SC01',
    parameters: {
      availableBalance: 500,
      maxHolding: 7,
      minSpread: 0.3,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.2,
      watchAsk: 3,
    }
  },
  'ALLK': {
    figi: 'BBG003QBJKN0',
    parameters: {
      availableBalance: 5,
      maxHolding: 1,
      minSpread: 0.2,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.1,
      watchAsk: 3,
    }
  },
  'DMTK': {
    figi: 'BBG00H19F184',
    parameters: {
      availableBalance: 7,
      maxHolding: 1,
      minSpread: 0.04,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.08,
      watchAsk: 2,
    }
  },
  'TCS': {
    figi: 'BBG005DXJS36',
    parameters: {
      availableBalance: 40,
      maxHolding: 1,
      minSpread: 0.06,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.4,
      watchAsk: 3,
      waitTillNextBuyMs: 2000,
    }
  },
};

export default class ControlUseCase {
  private currentStatus: { working: boolean, loading: boolean, error?: Error } = {
    working: false,
    loading: false,
    error: undefined,
  };

  private config = {
    strategy: 'Spread',
    ticker: 'TCS',
    ...configs.TCS,
  };

  constructor() {
    // (window as any).ipc.send(ipcEvents.START_TRADING, {
    //   figi: this.config.figi,
    //   parameters: this.config.parameters,
    // });
  }

  public get Config() {
    return this.config;
  }
  public get Status() {
    return this.currentStatus;
  }
  public set Working(isWorking: boolean) {
    try {
      this.Loading = true;
      this.currentStatus = {
        ...this.currentStatus,
        working: isWorking,
      };
      if (isWorking) {
        (window as any).ipc.send(ipcEvents.START_TRADING, {
          figi: this.config.figi,
          parameters: this.config.parameters,
        });
      } else {
        (window as any).ipc.invoke(ipcEvents.PAUSE_TRADING, {
          figi: this.config.figi,
        });
      }
    } catch (e) {
      console.error('Error toggling strategy', e);
    } finally {
      this.Loading = false;
    }
  }
  public set Loading(isLoading: boolean) {
    this.currentStatus.loading = isLoading;
  }
  public set Error(error: Error) {
    this.currentStatus.error = error;
  }
}