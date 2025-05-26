import { useEffect, useRef, useState } from 'react';
import { runTask } from '../workers/pool/workerPool';

interface State {
  html: string;
  loading: boolean;
  error: string | null;
}

/**
 * Converts a markdown string to HTML in a background worker.
 * Automatically debounces rapid edits and cancels stale results.
 */
export function useMarkdownHtml(markdown: string, debounceMs = 120): State {
  const [state, setState] = useState<State>({ html: '', loading: false, error: null });
  const lastReqRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // Start debounce timer
    timerRef.current = setTimeout(() => {
      const reqId = ++lastReqRef.current;
      setState((s) => ({ ...s, loading: true, error: null }));

      runTask<string>('mdToHtml', { markdown })
        .then((html) => {
          if (reqId !== lastReqRef.current) return; // stale
          setState({ html, loading: false, error: null });
        })
        .catch((err) => {
          if (reqId !== lastReqRef.current) return;
          setState({
            html: '',
            loading: false,
            error: err instanceof Error ? err.message : String(err),
          });
        });
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [markdown, debounceMs]);

  return state;
}
