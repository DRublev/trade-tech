import { workerData, parentPort } from "worker_threads";
import { TinkoffSdk } from '@/node/app/tinkoff';
console.log('3 worker', workerData);

if (workerData.type && workerData.type === 'start-strategy')  {
  console.log('5 worker', TinkoffSdk.IsSdkBinded);
  setTimeout(() => {
    parentPort?.postMessage('starting strategy...');
  }, 5000);
}

