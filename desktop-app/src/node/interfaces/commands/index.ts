export type StartTradingCmd = {
  figi: string;
  parameters: {
    availableBalance: number;
    maxHolding: number;
    minSpread: number;
    moveOrdersOnStep: number;
    lotsDistribution: number;
  }
};