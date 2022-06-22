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
      (window as any).ipc.send('START_TRADING', {
        // figi: 'BBG000QCW561', // VEON
        // figi: 'BBG222222222', // TGLD
        // figi: 'BBG000000001', // TRUR
        // figi: 'BBG00DWX7QH0', // INSG
        figi: 'BBG00R240WL5', // AMTI
        parameters: {
          availableBalance: 3.5,
          // availableBalance: 12,
          maxHolding: 1,
          minSpread: 0.02,
          moveOrdersOnStep: 1,
          lotsDistribution: 1,
        }
      });
    } catch (e) {
      console.error(e);
    }
  }
}