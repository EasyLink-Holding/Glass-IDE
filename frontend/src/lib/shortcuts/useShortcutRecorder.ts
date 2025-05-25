import { useCallback, useEffect, useState } from 'react';
import type { ActionId } from './bindings';
import { parseCombo } from './helpers';

/** Hook that captures next key combo after calling start(). */
export function useShortcutRecorder() {
  const [recordingFor, setRecordingFor] = useState<ActionId | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  const start = useCallback((id: ActionId) => {
    setCaptured(null);
    setRecordingFor(id);
  }, []);

  const stop = useCallback(() => {
    setRecordingFor(null);
    setCaptured(null);
  }, []);

  useEffect(() => {
    if (!recordingFor) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      const combo = parseCombo(e);
      setCaptured(combo);
    };

    window.addEventListener('keydown', handler, { capture: true });
    return () =>
      window.removeEventListener('keydown', handler, { capture: true } as EventListenerOptions);
  }, [recordingFor]);

  return { recordingFor, captured, start, stop } as const;
}
