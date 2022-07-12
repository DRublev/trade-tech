import * as fs from 'fs';
import { ipcMain } from 'electron';

import { ipcEvents } from '@/constants';
import logger from '@/node/infra/Logger';
import Instrument from '@/node/domain/Instruments';
import { TinkoffSdk } from '@/node/app/tinkoff';

const allSharesListPath = './allShares.json';

let cached: Array<Instrument> = [];

const fetch = async (): Promise<Array<Instrument>> => {
  const allShares = await TinkoffSdk.Sdk.InstrumentsFetcher.fetchShares();
  const allEtfs = await TinkoffSdk.Sdk.InstrumentsFetcher.fetchEtf();
  return allShares.concat(allEtfs as any);
}
const saveToFile = (instruments: Array<Instrument>) => {
  fs.writeFileSync(allSharesListPath, JSON.stringify({ instruments }));
}

ipcMain.handle(ipcEvents.GET_INSTRUMENTS, async (event, data) => {
  try {
    if (cached.length) return cached;
    let instruments: Array<Instrument>  = [];
    if (!fs.existsSync(allSharesListPath)) {
      instruments = await fetch();
      saveToFile(instruments);
    } else {
      const fileContent = await fs.readFileSync(allSharesListPath, 'utf8');
      const persisted = JSON.parse(fileContent);
      instruments = persisted.instruments;
      if (!instruments.length) {
        instruments = await fetch();
        saveToFile(instruments);
      }
    }
    cached = instruments;
    return instruments;
  } catch (e) {
    logger.error('GET_INSTRUMENTS', e);
    return [];
  }
});
