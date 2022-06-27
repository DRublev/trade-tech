import { StartTradingCmd } from '@node/interfaces/commands';
import WorkersPool from '../WorkersPool';
import createWorker from '../createWorker';
import logger from '../../../infra/Logger';

export const TYPES = {
  startStrategy: 'start-strategy',
}

export const startStrategy = (token: string, config: StartTradingCmd, onLog: (chunk: Uint8Array) => void, onWorker: (workerId: number) => void) => new Promise((resolve, reject) => {
  const worker = createWorker('./src/node/interfaces/workers/trading/worker.ts', {
    eval: true,
    workerData: {
      type: TYPES.startStrategy,
      token,
      config,
    },
  });
  WorkersPool.Set(worker);
  onWorker(worker.threadId);

  worker.on('message', onLog);
  worker.on('error', reject);
  worker.on('exit', (code) => {
    if (code !== 0) {
      return reject(new Error(`Worker stopped with exit code ${code}`));
    } 
    resolve(code);
  });
});

export const pauseStrategy = (threadId: number) => {
  try {
    const worker = WorkersPool.Get(threadId);
    worker.postMessage({ type: 'pause-strategy' });
  } catch (e) {
    logger.error('pauseStrategy', e);
    throw e;
  }
};

export const resumeStrategy = (threadId: number) => {
  try {
    const worker = WorkersPool.Get(threadId);
    worker.postMessage({ type: 'resume-strategy' });
  } catch (e) {
    logger.error('resumeStrategy', e);
    throw e;
  }
};
