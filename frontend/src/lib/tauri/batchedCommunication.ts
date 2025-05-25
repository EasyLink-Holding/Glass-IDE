/**
 * Utility for batched communication between Tauri and React
 *
 * This module provides optimized communication between the Tauri backend and React frontend
 * by batching messages, debouncing updates, and implementing smart caching to reduce
 * unnecessary IPC calls.
 */

// Using Tauri v2 API structure - import from correct modules
import { core } from '@tauri-apps/api';
import { emit, listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as codec from './codecWorkerClient';

// Batch window for collecting commands (milliseconds)
const BATCH_WINDOW = 25;

// Cache timeout (milliseconds)
const CACHE_TIMEOUT = 2000;

// LRU cache implementation with max size to avoid memory bloat
interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  prev?: CacheEntry<T>;
  next?: CacheEntry<T>;
}

const MAX_CACHE_SIZE = 500;

class LRUCache {
  private map = new Map<string, CacheEntry<unknown>>();
  private head: CacheEntry<unknown> | null = null;
  private tail: CacheEntry<unknown> | null = null;

  get<T>(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    this.moveToFront(entry);
    return entry.data as T;
  }

  getEntry<T>(key: string): CacheEntry<T> | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    this.moveToFront(entry);
    return entry as CacheEntry<T>;
  }

  set<T>(key: string, data: T): void {
    let entry = this.map.get(key);
    if (entry) {
      entry.data = data;
      entry.timestamp = Date.now();
      this.moveToFront(entry);
    } else {
      entry = { key, data, timestamp: Date.now() };
      this.map.set(key, entry);
      this.addToFront(entry);
      if (this.map.size > MAX_CACHE_SIZE && this.tail) {
        this.map.delete(this.tail.key);
        this.remove(this.tail);
      }
    }
  }

  delete(key: string): void {
    const entry = this.map.get(key);
    if (!entry) return;
    this.remove(entry);
    this.map.delete(key);
  }

  private moveToFront(entry: CacheEntry<unknown>): void {
    if (entry === this.head) return;
    this.remove(entry);
    this.addToFront(entry);
  }

  private addToFront(entry: CacheEntry<unknown>): void {
    entry.prev = undefined;
    entry.next = this.head || undefined;
    if (this.head) this.head.prev = entry;
    this.head = entry;
    if (!this.tail) this.tail = entry;
  }

  private remove(entry: CacheEntry<unknown>): void {
    if (entry.prev) entry.prev.next = entry.next;
    if (entry.next) entry.next.prev = entry.prev;
    if (entry === this.head) this.head = entry.next ?? null;
    if (entry === this.tail) this.tail = entry.prev ?? null;
    entry.prev = entry.next = undefined;
  }

  *entries() {
    for (const entry of this.map.values()) {
      yield entry;
    }
  }
}

const responseCache = new LRUCache();

/**
 * Creates a deterministic string representation of an object
 * by sorting object keys before serialization.
 * Handles circular references and non-serializable types safely.
 *
 * @param obj The object to stringify
 * @returns A deterministic JSON string
 */
function deterministicStringify(obj: Record<string, unknown>): string {
  // Set to track objects we've already processed (for circular reference detection)
  const visited = new WeakSet();

  // Helper function to recursively sort keys of nested objects
  function sortObjectKeys(input: unknown, depth = 0): unknown {
    // Prevent stack overflow with deep objects - limit to 100 levels
    if (depth > 100) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    // Handle primitives and null
    if (input === null) return null;

    // Handle non-objects
    if (typeof input !== 'object') {
      // Handle non-serializable types
      if (typeof input === 'function') return '[Function]';
      if (typeof input === 'symbol') return '[Symbol]';
      if (typeof input === 'undefined') return null; // Convert undefined to null for JSON compatibility
      if (Number.isNaN(input)) return null; // Convert NaN to null
      if (input === Number.POSITIVE_INFINITY || input === Number.NEGATIVE_INFINITY) return null; // Convert Infinity to null

      return input; // Return primitive values as-is
    }

    // Handle circular references
    if (visited.has(input)) {
      return '[Circular]';
    }

    // Add to visited set to detect circular references
    visited.add(input);

    // Handle arrays - recursively sort the contents
    if (Array.isArray(input)) {
      return input.map((item) => sortObjectKeys(item, depth + 1));
    }

    // Handle Date objects
    if (input instanceof Date) {
      return input.toISOString();
    }

    // Handle other special object types
    if (input instanceof RegExp) return input.toString();
    if (input instanceof Error) return `[Error: ${input.message}]`;
    if (input instanceof Map || input instanceof Set) {
      return `[${input.constructor.name}]`;
    }

    // For regular objects - create new object with sorted keys
    const sortedKeys = Object.keys(input).sort();
    const result: Record<string, unknown> = {};

    for (const key of sortedKeys) {
      // Recursively sort nested objects
      result[key] = sortObjectKeys((input as Record<string, unknown>)[key], depth + 1);
    }

    return result;
  }

  // Try-catch block to handle any unexpected serialization issues
  try {
    // Sort the object keys and then stringify
    const sortedObj = sortObjectKeys(obj);
    return JSON.stringify(sortedObj);
  } catch (error) {
    console.warn('deterministicStringify: Failed to stringify object', error);
    // Fallback to a safe representation
    return JSON.stringify({ error: 'Unstringifiable object' });
  }
}

/**
 * Cleans up expired cache entries to prevent memory leaks
 */
function cleanupCache(): void {
  const now = Date.now();

  for (const entry of responseCache.entries()) {
    if (now - entry.timestamp > CACHE_TIMEOUT) {
      responseCache.delete(entry.key);
    }
  }
}

// Store the interval ID for cleanup
let cacheCleanupInterval: number | null = null;

/**
 * Starts the cache cleanup interval timer
 */
export function startCacheCleanup(): void {
  if (typeof window !== 'undefined' && cacheCleanupInterval === null) {
    // Only run in browser environment and if not already running
    cacheCleanupInterval = window.setInterval(cleanupCache, CACHE_TIMEOUT);
  }
}

/**
 * Stops the cache cleanup interval timer
 * Useful during testing or hot-reloading
 */
export function stopCacheCleanup(): void {
  if (cacheCleanupInterval !== null) {
    window.clearInterval(cacheCleanupInterval);
    cacheCleanupInterval = null;
  }
}

// Start the cache cleanup by default
startCacheCleanup();

// -----------------------------------------------------------------------------
// Optional binary invoke path – enabled by default.
// -----------------------------------------------------------------------------
const USE_BINARY = true;

async function invokeSmart<T>(command: string, args: Record<string, unknown>): Promise<T> {
  if (!USE_BINARY) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return core.invoke<T>(command, args);
  }

  // Encode via MessagePack & send base64 – backend must decode.
  const packed = await codec.encode(args);
  const base64 = btoa(String.fromCharCode(...packed));
  const resultBase64 = await core.invoke<string>(command, { _bin: base64 } as Record<
    string,
    unknown
  >);
  // Decode back
  const raw = atob(resultBase64)
    .split('')
    .map((c) => c.charCodeAt(0));
  return await codec.decode<T>(Uint8Array.from(raw));
}

/**
 * Batches multiple commands into a single invoke call
 * @param commands Array of command objects to batch
 * @returns Promise resolving to an array of results in the same order
 */
export async function batchCommands<T>(
  commands: Array<{ command: string; args: Record<string, unknown> }>
): Promise<T[]> {
  // If it's just one command, don't batch
  if (commands.length === 1) {
    const { command, args } = commands[0];

    // Check cache first - use deterministic serialization
    const cacheKey = `${command}:${deterministicStringify(args)}`;
    const cacheEntry = responseCache.getEntry<T>(cacheKey);
    const now = Date.now();

    if (cacheEntry && now - cacheEntry.timestamp < CACHE_TIMEOUT) {
      return [cacheEntry.data] as T[];
    }

    // Execute and cache
    const result = await invokeSmart<T>(command, args);
    responseCache.set(cacheKey, result);
    return [result];
  }

  // Create a batch of commands
  const batch = {
    commands: commands.map(({ command, args }) => ({
      command,
      args: args || {},
    })),
  };

  // Execute the batch
  const results = await invokeSmart<T[]>('batch_commands', { batch });

  // Cache individual results
  commands.forEach(({ command, args }, index) => {
    // Use deterministicStringify for consistent cache keys between batched and single commands
    const cacheKey = `${command}:${deterministicStringify(args)}`;
    responseCache.set(cacheKey, results[index]);
  });

  return results;
}

// Queue for batching commands
let commandQueue: Array<{
  command: string;
  args: Record<string, unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: Error | unknown) => void;
}> = [];

// Timer for batching
let batchTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Processes the queue of commands as a batch
 */
async function processBatchQueue() {
  const currentQueue = [...commandQueue];
  commandQueue = [];
  batchTimer = null;

  try {
    // Extract commands for the batch
    const commands = currentQueue.map(({ command, args }) => ({
      command,
      args,
    }));

    // Execute the batch
    const results = await batchCommands(commands);

    // Resolve individual promises with their results
    currentQueue.forEach(({ resolve }, index) => {
      resolve(results[index]);
    });
  } catch (error) {
    // Reject all promises in case of error
    for (const { reject } of currentQueue) {
      reject(error);
    }
  }
}

/**
 * Invokes a Tauri command with batching for improved performance
 *
 * @template T The expected return type of the command
 * @param command The command name to invoke
 * @param args Arguments for the command
 * @returns Promise resolving to the command result
 *
 * @warning IMPORTANT: This function does not perform runtime type validation.
 * TypeScript generics are erased at runtime, so there's no guarantee that the
 * data returned from the backend actually matches type T.
 *
 * For improved type safety:
 * 1. Consider implementing a schema validation library like Zod to validate responses
 * 2. Always handle potential type mismatches in your consuming code
 * 3. Ensure your backend always returns data in the expected format
 */
export function batchedInvoke<T>(command: string, args: Record<string, unknown> = {}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // Add command to the queue with type validation
    commandQueue.push({
      command,
      args,
      // Simply resolve with the value as T
      // TypeScript generics are erased at runtime, so runtime type checking based on T is ineffective
      // For proper runtime validation, a schema validation library like Zod would be more appropriate
      resolve: (value: unknown) => {
        resolve(value as T);
      },
      reject,
    });

    // Set timer to process queue if not already set
    if (!batchTimer) {
      batchTimer = setTimeout(processBatchQueue, BATCH_WINDOW);
    }
  });
}

/**
 * Hook for efficient data fetching from Tauri backend
 *
 * @param command Command to invoke
 * @param args Arguments for the command
 * @param deps Dependencies array that should include all values used in args. The hook will
 *             re-run when these dependencies change (similar to useEffect)
 * @returns [data, loading, error]
 */
export function useTauriQuery<T>(
  command: string,
  args: Record<string, unknown> = {},
  deps: React.DependencyList = []
): [T | null, boolean, Error | null] {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Memoize args object to prevent unnecessary re-renders
  // We intentionally don't track the 'args' object directly in deps
  // because we use a custom deps array for fine-grained control
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const memoizedArgs = useMemo(() => args, [...deps]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await batchedInvoke<T>(command, memoizedArgs);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [command, memoizedArgs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return [data, loading, error];
}

/**
 * Sets up a batched event listener with debouncing
 *
 * @param event Event name to listen for
 * @param handler Event handler function
 * @param debounceMs Debounce time in milliseconds
 * @returns Cleanup function
 */
export function setupBatchedListener<T>(
  event: string,
  handler: (payload: T) => void,
  debounceMs = 50
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latestPayload: T | null = null;

  const cleanup = listen<T>(event, (e) => {
    latestPayload = e.payload;

    // If debounce is 0, invoke handler immediately
    if (debounceMs === 0) {
      handler(e.payload);
      return;
    }

    // Otherwise debounce the handler
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      if (latestPayload !== null) {
        handler(latestPayload);
      }
      timer = null;
    }, debounceMs);
  });

  // Return a synchronous cleanup function as required by React useEffect
  return () => {
    if (timer) clearTimeout(timer);
    // Handle the promise without awaiting it
    // This ensures the cleanup function itself is synchronous
    cleanup
      .then((unsubscribe) => unsubscribe())
      .catch((err) => console.error('Error cleaning up event listener:', err));
  };
}

/**
 * Hook for setting up batched event listeners with smart updates
 *
 * @param event Event name to listen for
 * @param handler Event handler function
 * @param debounceMs Debounce time in milliseconds
 */
export function useBatchedListener<T>(
  event: string,
  handler: (payload: T) => void,
  debounceMs = 50
): void {
  useEffect(() => {
    const cleanup = setupBatchedListener(event, handler, debounceMs);
    return () => {
      cleanup();
    };
  }, [event, handler, debounceMs]);
}

/**
 * Emits an event with debouncing to reduce event flood
 *
 * @param event Event name to emit
 * @param payload Event payload
 * @param debounceMs Debounce time in milliseconds
 */
const eventDebounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};
const eventPayloads: Record<string, unknown> = {};

export function debouncedEmit<T>(event: string, payload: T, debounceMs = 50): void {
  // Store the latest payload
  eventPayloads[event] = payload;

  // Clear existing timer
  if (eventDebounceTimers[event]) {
    clearTimeout(eventDebounceTimers[event]);
  }

  // Set a new timer
  eventDebounceTimers[event] = setTimeout(() => {
    emit(event, eventPayloads[event]);
    // Clean up both timer and payload references to prevent memory leaks
    delete eventDebounceTimers[event];
    delete eventPayloads[event];
  }, debounceMs);
}
