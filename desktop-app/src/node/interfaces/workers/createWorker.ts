import { Worker } from 'worker_threads';

const createWorker = (file: string, wkOpts: WorkerOptions & any): Worker => {
  wkOpts.eval = true;
  if (!wkOpts.workerData) {
    wkOpts.workerData = {};
  }

  wkOpts.workerData.__filename = file;
  return new Worker(`
          const wk = require('worker_threads');
          require('tsconfig-paths/register');
          require('ts-node').register({
            "compilerOptions": {
              "target": "es2016",
              "esModuleInterop": true,
              "module": "commonjs",
              "rootDir": ".",
            }
          });
          let file = wk.workerData.__filename;
          delete wk.workerData.__filename;
          require(file);
      `,
    wkOpts
  );
};

export default createWorker;