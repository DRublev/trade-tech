import { ipcEvents } from "@/constants";
import { TradingConfig } from "@/node/domain/TradingConfig";

export default class ControlUseCase {
  private currentStatus: { working: boolean, loading: boolean, error?: Error } = {
    working: false,
    loading: false,
    error: undefined,
  };
  currentTicker = 'AI';
  currentStrategy = 'Spread';
  config: Partial<TradingConfig> = {
    strategy: this.currentStrategy,
    ticker: this.currentTicker,
  };

  constructor() {
    this.changeConfig = this.changeConfig.bind(this);
    this.loadConfig();
  }

  async loadConfig() {
    try {
      this.Loading = true;
      const config = await window.ipc.invoke(ipcEvents.LOAD_STRATEGY_CONFIG, { ticker: this.currentTicker });
      this.config = {
        strategy: this.currentStrategy,
        ticker: this.currentTicker,
        ...config,
      };
    } catch (e) {
      console.error('loadConfig', e);
      this.Error = <Error>e;
    } finally {
      this.Loading = false;
    }
  }

  async changeConfig(newConfig: typeof this.config) {
    const newConfigParams = Object.assign({}, this.config.parameters, newConfig);
    await window.ipc.invoke(ipcEvents.CHANGE_STRATEGY_CONFIG, {
      figi: this.config.figi,
      ticker: this.currentTicker,
      strategy: this.currentStrategy,
      parameters: newConfigParams,
    });
  }

  public get Config() { return this.config; }
  public get Status() { return this.currentStatus; }

  public set Ticker(ticker: string) {
    this.currentTicker = ticker;
    this.loadConfig();
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
        window.ipc.send(ipcEvents.START_TRADING, payload);
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
  public set Loading(isLoading: boolean) { this.currentStatus.loading = isLoading; }
  public set Error(error: Error) { this.currentStatus.error = error; }
}