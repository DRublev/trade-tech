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
        figi: 'BBG222222222', parameters: {
          availableBalance: 1,
          maxHolding: 1,
          minSpread: 0,
          moveOrdersOnStep: 0.2,
        }
      });
    } catch (e) {
      console.error(e);
    }
  }
}