import { ipcEvents } from "@/constants";

export default class InstrumentsListUseCase {
  private instruments: Array<any> = [];

  public async load() {
    try {
      this.instruments = await window.ipc.invoke(ipcEvents.GET_INSTRUMENTS);
    } catch (e) {
      console.error('load', e);
    }
  }

  public get Instruments() { return this.instruments; }
}