// Provides a deep-equality based memo similar to React.useMemo
// Uses react-fast-compare for lightning-fast deep checks.

import { useRef } from 'react';
import isEqual from 'react-fast-compare';

/**
 * Memoise a computed value with deep-equality on a dependency array.
 * Useful when deps are complex objects/arrays that are re-created between renders
 * but remain deeply equal.
 */
export function useDeepMemo<T>(factory: () => T, deps: unknown[]): T {
  const prevRef = useRef<{ deps: unknown[]; value: T } | null>(null);

  if (prevRef.current) {
    const prevDeps = prevRef.current.deps;
    if (deps.length === prevDeps.length && deps.every((d, i) => isEqual(d, prevDeps[i]))) {
      return prevRef.current.value;
    }
  }

  const value = factory();
  prevRef.current = { deps, value };
  return value;
}
