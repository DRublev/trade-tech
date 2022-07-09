import { ipcEvents } from "@/constants";
import StrategyConfig from "shared-kernel/src/app/strategies/Config";

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
      availableBalance: 10,
      maxHolding: 1,
      minSpread: 0.0001,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.0004,
      sharesInLot: 100,
      watchAsk: 1,
      waitTillNextBuyMs: 2000,
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
      minSpread: 0.05,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.4,
      sharesInLot: 10,
      watchAsk: 2,
      waitTillNextBuyMs: 1000,
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
      stopLoss: 2,
      waitTillNextBuyMs: 2000,

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
      waitTillNextBuyMs: 2000,
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
      minSpread: 0.03,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.2,
      watchAsk: 1,
      // waitTillNextBuyMs: 1000,
    }
  },
  'RUAL': {
    figi: 'BBG008F2T3T2',
    parameters: {
      availableBalance: 690,
      maxHolding: 1,
      minSpread: 0.09,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.3,
      watchAsk: 3,
      waitTillNextBuyMs: 2000,
      sharesInLot: 10,
    }
  },
  'GTLB': {
    figi: 'BBG00DHTYPH8',
    parameters: {
      availableBalance: 57.57,
      maxHolding: 1,
      minSpread: 0.08,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.8,
      watchAsk: 3,
      // waitTillNextBuyMs: 1000,
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
      stopLoss: 0.8,
      watchAsk: 3,
      waitTillNextBuyMs: 1000,
    }
  },
  'POGR': {
    figi: 'BBG00VPKLPX4',
    parameters: {
      availableBalance: 360,
      maxHolding: 1,
      minSpread: 0.01,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.02,
      watchAsk: 2,
      waitTillNextBuyMs: 1000,
    }
  },
  'SFTL': {
    figi: 'BBG0136BTL03',
    parameters: {
      availableBalance: 150,
      maxHolding: 1,
      minSpread: 0.4,
      moveOrdersOnStep: 2,
      lotsDistribution: 1,
      stopLoss: 0.32,
      askStopLoss: 1.5,
      watchAsk: 4,
      // enteringPrice: 140,
      waitAfterStopLossMs: 60_000,
    }
  },
  'SPBE': {
    figi: 'BBG002GHV6L9',
    parameters: {
      availableBalance: 16,
      maxHolding: 5,
      minSpread: 0.03,
      moveOrdersOnStep: 1,
      lotsDistribution: 1,
      stopLoss: 0.06,
      watchAsk: 3,
      waitTillNextBuyMs: 1000,
    }
  },
};

export default class ControlUseCase {
  private currentStatus: { working: boolean, loading: boolean, error?: Error } = {
    working: false,
    loading: false,
    error: undefined,
  };

  config = {
    strategy: 'Spread',
    ticker: 'SFTL',
    ...configs.SFTL,
  };

  constructor() {
    this.changeConfig = this.changeConfig.bind(this);
  }

  async changeConfig(newConfig: typeof this.config) {
    const newConfigParams = Object.assign({}, this.config.parameters, newConfig);
    await window.ipc.invoke(ipcEvents.CHANGE_CONFIG, { figi: this.config.figi, config: newConfigParams });
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
        const payload = {
          figi: this.config.figi,
          parameters: { ...this.config.parameters },
        };
        window.ipc.send('START_TRADING', payload);
      } else {
        window.ipc.invoke(ipcEvents.PAUSE_TRADING, {
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