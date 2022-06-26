export enum Modes {
  Sandbox,
  Real,
}

export default class ModeController {
  constructor(private mode: Modes = Modes.Sandbox) {
  }

  public get Mode() {
    return this.mode;
  }

  public set Mode(mode: Modes) {
    this.mode = mode;
  }

  public get IsSandbox() {
    return this.mode === Modes.Sandbox;
  }
}