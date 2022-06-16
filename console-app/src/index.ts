import 'dotenv/config';
import { TinkoffSdk } from 'shared-kernel';
import logger from './logger';


if (!process.env.TINKOFF_TOKEN) {
  logger.error('Необходимо подставить токен с полным доступ в переменную окружения TOKEN');
  process.exit(1);
}

process.on('exit', (code) => {
  console.log('Exit with code', code);
});
process.on('uncaughtException', console.error);

const killSwitch = new AbortController();

let watchIntervalId = null;
let watchOrderIntervalIds: Record<string, any> = {};


const start = async () => {
  try {
    process.on('SIGINT', async function () {
      killSwitch.abort();
      if (watchIntervalId) {
        clearInterval(watchIntervalId);
      }
      Object.values(watchOrderIntervalIds).forEach((id) => clearInterval(id));
    });

  } catch (e) {
    logger.emerg(e);
    killSwitch.abort();
  }
};

start();
