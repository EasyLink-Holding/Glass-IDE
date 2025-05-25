// Web Worker for MessagePack encode/decode using @msgpack/msgpack
// Runs heavy serialization logic off the main thread. Loaded as an ES module.

import { decode as msgpackDecode, encode as msgpackEncode } from '@msgpack/msgpack';

type WorkerRequest = {
  id: number;
  method: 'encode' | 'decode';
  payload: unknown;
};

type WorkerResponse = {
  id: number;
  result?: unknown;
  error?: string;
};

self.onmessage = (event: MessageEvent<WorkerRequest>): void => {
  const { id, method, payload } = event.data;
  const response: WorkerResponse = { id };

  try {
    if (method === 'encode') {
      const encoded = msgpackEncode(payload);
      response.result = encoded;
      // Transfer ArrayBuffer for zero-copy performance
      (self as unknown as Worker).postMessage(response, [encoded.buffer as ArrayBuffer]);
      return;
    }

    if (method === 'decode') {
      const bytes =
        payload instanceof Uint8Array ? payload : new Uint8Array(payload as ArrayLike<number>);
      response.result = msgpackDecode(bytes);
      (self as unknown as Worker).postMessage(response);
      return;
    }

    throw new Error(`Unknown method "${method}"`);
  } catch (err) {
    response.error = err instanceof Error ? err.message : String(err);
    (self as unknown as Worker).postMessage(response);
  }
};
