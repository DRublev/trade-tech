import { Worker, } from "worker_threads";

class WorkersPool {
  private static instance: WorkersPool;

  private workers: { [threadId: number]: Worker } = {};
  private activeWorkers: { [threadId: number]: boolean } = {};

  private constructor() { }

  public static get Instance() {
    return this.instance || (this.instance = new this());
  }

  public Set(worker: Worker) {
    if (this.workers[worker.threadId]) throw new TypeError(`Worker ${worker.threadId} is already set`);
    this.workers[worker.threadId] = worker;
    this.activeWorkers[worker.threadId] = true;
  }

  public Get(threadId: number): Worker {
    if (!this.workers[threadId]) throw new ReferenceError('Now worker found by this id');
    if (!this.activeWorkers[threadId]) throw new TypeError(`Worker ${threadId} is not active`);
    return this.workers[threadId];
  }

  public async Terminate(threadId: number) {
    if (!this.workers[threadId]) throw new ReferenceError('Now worker found by this id');
    if (!this.activeWorkers[threadId]) throw new TypeError(`Worker ${threadId} is not active`);

    await this.workers[threadId].terminate();
    this.activeWorkers[threadId] = false;
  }
}

export default WorkersPool.Instance;