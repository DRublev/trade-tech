import { StartTradingCmd } from '@node/interfaces/commands';
import createWorker from '../createWorker';

export const TYPES = {
  startStrategy: 'start-strategy',
}

export const startStrategy = (config: StartTradingCmd) => new Promise((resolve, reject) => {
  const worker = createWorker('./src/node/interfaces/workers/trading/worker.ts', {
    eval: true,
    workerData: { type: TYPES.startStrategy, config },
  });
  worker.on('message', resolve);
  worker.on('error', reject);
  worker.on('exit', (code) => {
    if (code !== 0)
      reject(new Error(`Worker stopped with exit code ${code}`));
  });
});
