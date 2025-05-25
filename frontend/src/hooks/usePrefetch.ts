import { lazy, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for prefetching lazily loaded components.
 *
 * @param componentImport A function that returns a dynamic import promise
 * @param options Configuration options
 * @returns A prefetch function that can be manually triggered
 */
export function usePrefetch<T>(
  componentImport: () => Promise<{ default: T }>,
  options: {
    prefetchOnMount?: boolean; // Prefetch when component mounts
    delay?: number; // Delay before prefetching (in ms)
  } = {}
) {
  const { prefetchOnMount = false, delay = 300 } = options;
  const importFnRef = useRef(componentImport);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);

  // Update the import function reference if it changes
  useEffect(() => {
    importFnRef.current = componentImport;
  }, [componentImport]);

  // Prefetch function that can be called manually (e.g., on hover)
  const prefetch = useCallback(() => {
    // Only prefetch if we haven't already
    if (hasLoadedRef.current) return;

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set a timer to delay the prefetch
    timerRef.current = setTimeout(() => {
      const importFn = importFnRef.current;

      // Start the import
      importFn()
        .then(() => {
          hasLoadedRef.current = true;
        })
        .catch((err) => {
          console.error('Error prefetching component:', err);
          hasLoadedRef.current = false;
        });

      timerRef.current = null;
    }, delay);
  }, [delay]);

  // Prefetch on mount if option is enabled
  useEffect(() => {
    if (prefetchOnMount) {
      prefetch();
    }

    // Clean up any timers when unmounting
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [prefetch, prefetchOnMount]);

  return prefetch;
}

/**
 * Creates a lazy-loaded component with prefetching capabilities.
 * The returned component will prefetch itself on hover automatically.
 *
 * @param importFn Function that returns the component import promise
 * @returns A tuple containing [LazyComponent, prefetchFunction]
 */
export function createPrefetchableComponent<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
): [React.LazyExoticComponent<T>, () => void] {
  const LazyComponent = lazy(importFn);

  // Create a memoized prefetch function
  const prefetchFn = () => {
    // Execute the import in the background
    importFn().catch((err) => {
      console.error('Error prefetching component:', err);
    });
  };

  return [LazyComponent, prefetchFn];
}
