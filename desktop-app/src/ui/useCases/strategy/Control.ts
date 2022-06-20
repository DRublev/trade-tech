import { ipcEvents } from "@/constants";

export default class ControlUseCase {
  private currentStatus: { working: boolean, loading: boolean, error?: Error } = {
    working: false,
    loading: false,
    error: undefined,
  };

  private config = {
    strategy: 'Spread',
    ticker: 'TRUR',
    figi: 'BBG000000001', // TRUR
    parameters: {
      availableBalance: 12,
      maxHolding: 2,
      minSpread: 0,
      moveOrdersOnStep: 2,
      lotsDistribution: 2,
    }
  };

  public get Config() {
    return this.config;
  }
  public get Status() {
    return this.currentStatus;
  }
  public set Working(isWorking: boolean) {
    try {
      this.Loading = true;
      this.currentStatus.working = isWorking;
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