// Binary codec helpers using MessagePack
// Encapsulates encode/decode so the rest of the app can stay JSON-agnostic

import { decode as msgpackDecode, encode as msgpackEncode } from '@msgpack/msgpack';

export function encode(data: unknown): Uint8Array {
  try {
    return msgpackEncode(data);
  } catch (err) {
    console.error('[codec] encode failed', err);
    // Fallback: return empty buffer so IPC doesn’t crash
    return new Uint8Array();
  }
}

export function decode<T = unknown>(bytes: Uint8Array | number[]): T {
  try {
    return msgpackDecode(bytes) as T;
  } catch (err) {
    console.error('[codec] decode failed', err);
    throw err instanceof Error ? err : new Error('MessagePack decode failed');
  }
}
