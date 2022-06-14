import { ipcMain } from 'electron';

import logger from '@/infra/Logger';
import events from '../events';


ipcMain.handle(events.START_TRADING, (event, data) => {
  try {
    logger.info('Start trading');

    
    
  } catch (e) {
    logger.error('START_TRADING', e);
  }
});
