import type { TaskName } from './tasks';

interface TaskRequest {
  id: number;
  name: TaskName;
  payload: unknown;
}
interface TaskResponse {
  id: number;
  result?: unknown;
  error?: string;
}

// Choose concurrency based on logical CPU cores minus 1 (keep UI thread free)
const CONCURRENCY = Math.max(1, (navigator.hardwareConcurrency || 4) - 1);

const workers: Worker[] = [];
let rrIndex = 0;
let msgId = 0;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>();

function getWorker(): Worker {
  if (workers.length < CONCURRENCY) {
    const w = new Worker(new URL('./workerPoolWorker.ts', import.meta.url), { type: 'module' });
    w.onmessage = (evt: MessageEvent<TaskResponse>) => {
      const { id, result, error } = evt.data;
      const cb = pending.get(id);
      if (!cb) return;
      if (error) cb.reject(error);
      else cb.resolve(result);
      pending.delete(id);
    };
    workers.push(w);
  }
  const w = workers[rrIndex];
  rrIndex = (rrIndex + 1) % workers.length;
  return w;
}

export function runTask<T = unknown>(name: TaskName, payload: unknown): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = msgId++;
    // Cast resolve to unknown-based signature for storage
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    const worker = getWorker();
    const msg: TaskRequest = { id, name, payload };
    worker.postMessage(msg);
  });
}
