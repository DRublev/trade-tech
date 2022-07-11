import StrategyConfig from "shared-kernel/src/app/strategies/Config";

export type TradingConfig = {
  figi: string;
  strategy: string;
  ticker: string;
  parameters: StrategyConfig & { [x: string]: any };
}