import * as fs from 'fs';
import { ipcMain } from 'electron';

import { ipcEvents } from '@/constants';
import logger from '@/node/infra/Logger';
import InstrumentsPersistor from '@/node/infra/InstrumentsPersistor';


const instrumentsPersistor = new InstrumentsPersistor();

ipcMain.handle(ipcEvents.GET_INSTRUMENTS, async (event, data) => {
  try {
    const instruments = await instrumentsPersistor.getAll();
    return instruments;
  } catch (e) {
    logger.error('GET_INSTRUMENTS', e);
    return [];
  }
});
