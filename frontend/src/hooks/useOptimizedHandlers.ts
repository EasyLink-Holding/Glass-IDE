import { useCallback, useRef } from 'react';

/**
 * Creates an optimized event handler that doesn't change identity on re-renders
 * but still has access to the latest dependencies.
 *
 * @param handler The event handler function
 * @param deps Dependencies that should trigger a handler refresh when changed
 * @returns A stable callback function that won't cause unnecessary re-renders
 */
// Use a wider type constraint to accommodate specific parameter types
export function useStableCallback<TArgs extends readonly unknown[], TReturn>(
  handler: (...args: TArgs) => TReturn,
  deps: React.DependencyList = []
): (...args: TArgs) => TReturn {
  // Keep track of the latest handler function
  const handlerRef = useRef(handler);

  // Update the ref whenever handler changes
  handlerRef.current = handler;

  // Return a stable callback that uses the latest handler
  // This callback's identity is stable across renders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((...args: TArgs): TReturn => {
    // Call the latest handler with the provided arguments
    return handlerRef.current(...args);
  }, deps);
}

/**
 * Creates a throttled version of a function that only executes at most once
 * per the specified time period.
 *
 * @param fn The function to throttle
 * @param delay The minimum time between function executions (in ms)
 * @param deps Dependencies to watch for updates to the throttled function
 * @returns A throttled version of the function that returns the same value as the original function
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay = 100,
  deps: React.DependencyList = []
): T {
  // Track the time of the last execution
  const lastTimeRef = useRef<number>(0);
  // Store the last result to maintain consistent return behavior
  const lastResultRef = useRef<ReturnType<T> | undefined>(undefined);

  return useStableCallback((...args: unknown[]) => {
    const now = Date.now();

    // Execute immediately if:
    // 1. We haven't executed before (lastResultRef is undefined)
    // 2. Enough time has passed since last execution
    if (lastResultRef.current === undefined || now - lastTimeRef.current >= delay) {
      lastTimeRef.current = now;
      const result = fn(...args) as ReturnType<T>;
      lastResultRef.current = result;
      return result;
    }

    // Return the cached result when throttled for consistent behavior
    return lastResultRef.current;
  }, deps) as T;
}

/**
 * Creates a debounced version of a function that delays execution
 * until after the specified delay has elapsed since the last call.
 *
 * @param fn The function to debounce
 * @param delay The delay after the last call before executing (in ms)
 * @returns A debounced version of the function that returns void immediately
 *          and executes the original function asynchronously after the delay
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay = 300,
  deps: React.DependencyList = []
): (...args: unknown[]) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // We explicitly return void to indicate the async nature
  return useStableCallback((...args: unknown[]) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      fn(...args);
      timerRef.current = null;
    }, delay);

    // Explicitly return void to make it clear this function
    // doesn't return the same value as the original function
    return;
  }, deps);
}
