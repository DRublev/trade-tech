import { InvalidArgumentException } from "@/utils/exceptions";

export default class StrategyState {
  constructor(
    protected isWorking: boolean,
    protected availableBalance: number,
    protected holdingLots: number = 0,
    protected leftBalance?: number,
  ) {
    if (this.holdingLots < 0) throw new InvalidArgumentException('holdingLots', 'Must be positive or 0');
    if (!this.leftBalance && this.leftBalance != 0) {
      this.leftBalance = this.availableBalance;
    }
  }

  public set IsWorking(isWorking: boolean) { this.isWorking = isWorking; }

  public get IsWorking(): boolean { return this.isWorking; }
  public get AvailableBalance(): number { return this.availableBalance; }
  public get LeftBalance(): number { return this.leftBalance; }
  public get HoldingLots(): number { return this.holdingLots; }

  public stringify() {
    const keys = Object.keys(this);
    const msg = keys.map(key => `${key}: ${this[key]}`).join(',\n');
    return `${Date.now()}: {\n${msg}\n}`;
  }
}

export interface IStrategyStateConstructor {
  new(
    isWorking: boolean,
    availableBalance: number,
    holdingLots: number,
    leftBalance?: number,
  ): StrategyState;
}
