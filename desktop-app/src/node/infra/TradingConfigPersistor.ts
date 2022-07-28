import { ipcEvents } from '@/constants';
import { TradingConfig } from '@/node/domain/TradingConfig';
import * as fs from 'fs';
import InstrumentsPersistor from './InstrumentsPersistor';
import logger from './Logger';


const configFilePath = `./trading-config.json`;

const defaultConfigParameters = {
  availableBalance: null,
  maxHolding: null,
  minSpread: null,
  moveOrdersOnStep: null,
  lotsDistribution: null,
  stopLoss: null,
  askStopLoss: null,
  watchAsk: null,
  waitTillNextBuyMs: null,
  waitAfterStopLossMs: null,
};


export default class TradingConfigPersistor {
  private cached: { [ticker: string]: TradingConfig } = {};
  private isInited = false;
  private instrumentsPersisor = new InstrumentsPersistor();

  constructor() {
    this.init();
  }

  private async init() {
    try {
      if (!fs.existsSync(configFilePath)) {
        fs.writeFileSync(configFilePath, JSON.stringify({}));
      }

      await this.loadFromFile();
      this.isInited = true;
    } catch (e) {
      logger.error('TradingConfigPersistor.init', e);
    }
  }

  public async changeConfig(ticker: string, newConfig: TradingConfig): Promise<TradingConfig> {
    if (!this.isInited) throw new ReferenceError('TradingConfigPersistor is not inited');
    if (!this.cached[ticker]) {
      this.cached[ticker] = newConfig;
    }
    const parameters = Object.assign(
      { ...defaultConfigParameters },
      this.cached[ticker].parameters,
      newConfig.parameters,
    );
    this.cached[ticker].parameters = parameters;

    this.saveToFile();
    return this.cached[ticker];
  }

  public async loadByTicker(ticker: string): Promise<TradingConfig> {
    if (!this.isInited) {
      await this.loadFromFile();
    }
    if (!this.cached[ticker]) {
      const instrument = await this.instrumentsPersisor.getByTicker(ticker);
      if (!instrument) throw new ReferenceError(`Instrument ${ticker} not found`);
      this.cached[ticker] = {
        ticker,
        figi: instrument.figi,
        strategy: 'Spread',
        parameters: { ...defaultConfigParameters } as any,
      };
    }

    return this.cached[ticker];
  }

  private async loadFromFile() {
    try {
      const fileContent = fs.readFileSync(configFilePath, 'utf8');
      if (fileContent) {
        const config = JSON.parse(fileContent);
        this.cached = config;
      }
    } catch (e) {
      logger.error('TradingConfigPersistor.loadFromFile', e);
    }
  }

  private async saveToFile() {
    try {
      fs.writeFileSync(configFilePath, JSON.stringify(this.cached));
    } catch (e) {
      logger.error('TradingConfigPersistor.saveToFile', e);
    }
  }
}