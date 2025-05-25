// Lightweight client that lazily spawns the codecWorker and exposes the same API
// as codec.ts but asynchronously off-threads when possible.

import * as fallback from './codec';

interface CodecAPI {
  encode(data: unknown): Promise<Uint8Array>;
  decode<T = unknown>(bytes: Uint8Array | number[]): Promise<T>;
}

let workerPromise: Promise<CodecAPI> | null = null;

function spawnWorker(): Promise<CodecAPI> {
  return new Promise((resolve) => {
    // Note: Vite handles this new URL syntax & bundles the worker correctly
    const worker = new Worker(new URL('../../workers/codecWorker.ts', import.meta.url), {
      type: 'module',
    });

    let msgId = 0;
    const pending = new Map<number, (res: unknown, err?: unknown) => void>();

    worker.onmessage = (evt: MessageEvent<{ id: number; result?: unknown; error?: string }>) => {
      const { id, result, error } = evt.data;
      const cb = pending.get(id);
      if (!cb) return;
      if (error) cb(undefined, error);
      else cb(result, undefined);
      pending.delete(id);
    };

    function call<T>(method: 'encode' | 'decode', payload: unknown): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        const id = msgId++;
        pending.set(id, (res, err) => {
          if (err) reject(err);
          else resolve(res as T);
        });
        worker.postMessage({ id, method, payload });
      });
    }

    resolve({
      encode: (d) => call<Uint8Array>('encode', d),
      decode: <T>(b: Uint8Array | number[]) => call<T>('decode', b),
    });
  });
}

// Public API – transparently choose worker or fallback
export async function encode(data: unknown): Promise<Uint8Array> {
  try {
    if (!workerPromise) workerPromise = spawnWorker();
    return (await workerPromise).encode(data);
  } catch {
    return fallback.encode(data);
  }
}

export async function decode<T = unknown>(bytes: Uint8Array | number[]): Promise<T> {
  try {
    if (!workerPromise) workerPromise = spawnWorker();
    return (await workerPromise).decode<T>(bytes);
  } catch {
    return fallback.decode<T>(bytes);
  }
}
