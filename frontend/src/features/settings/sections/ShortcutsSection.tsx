/**
 * Keyboard Shortcuts settings panel
 * Allows users to view & customize keyboard bindings stored in settings
 */
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FixedSizeList as List, type ListChildComponentProps } from 'react-window';
import { useShortcutsStore } from '../../../lib/settings/shortcutsStore';
import { formatShortcut } from '../../../lib/shortcuts/helpers';
import { ACTION_LABELS, type ActionId, DEFAULT_SHORTCUTS } from '../../../lib/shortcuts/shortcuts';
import { useShortcutRecorder } from '../../../lib/shortcuts/useShortcutRecorder';

/**
 * Component for managing keyboard shortcuts settings
 */
function ShortcutsSection() {
  // Get shortcuts from dedicated shortcuts store
  const shortcuts = useShortcutsStore((s) => s.shortcuts);
  const setShortcuts = useShortcutsStore((s) => s.setShortcuts);

  const [local, setLocal] = useState({ ...shortcuts });
  const { recordingFor, captured, start, stop } = useShortcutRecorder();

  // Apply captured combo
  useEffect(() => {
    if (recordingFor && captured) {
      setLocal((prev) => ({ ...prev, [recordingFor]: captured }));
    }
  }, [recordingFor, captured]);

  // Detect duplicate bindings (very simple)
  const duplicates = useMemo(
    () => Object.values(local).filter((c, i, arr) => arr.indexOf(c) !== i),
    [local]
  );

  const dirty = JSON.stringify(local) !== JSON.stringify(shortcuts);

  const handleSave = useCallback(() => {
    setShortcuts(local);
  }, [local, setShortcuts]);

  const cancel = useCallback(() => {
    stop();
  }, [stop]);

  // Prepare row data for react-window
  const ids = useMemo(() => Object.keys(DEFAULT_SHORTCUTS) as ActionId[], []);

  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const id = ids[index];
      const combo = local[id] ?? '';
      const dup = duplicates.includes(combo);
      return (
        <div
          style={style}
          className="grid grid-cols-[1fr_150px_auto] items-center border-t border-neutral-700 px-2"
        >
          <div>{ACTION_LABELS[id]}</div>
          <div className={dup ? 'text-red-400' : ''}>{combo ? formatShortcut(combo) : '—'}</div>
          <div className="text-right">
            <button
              type="button"
              onClick={() => (recordingFor === id ? cancel() : start(id))}
              className="rounded bg-neutral-700 px-2 py-0.5 text-xs hover:bg-neutral-600"
            >
              {recordingFor === id ? 'Press keys… (Esc to cancel)' : 'Change'}
            </button>
          </div>
        </div>
      );
    },
    [ids, local, duplicates, recordingFor, cancel, start]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
        <p className="text-neutral-400 text-sm">Click “Change” then press a new key combination.</p>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[1fr_150px_auto] text-left text-neutral-400 text-sm px-2 py-1">
        <span>Action</span>
        <span>Binding</span>
        <span />
      </div>

      {/* Virtualised list */}
      <List
        height={Math.min(ids.length * 40, 400)}
        itemCount={ids.length}
        itemSize={40}
        width="100%"
        className="text-sm"
      >
        {Row}
      </List>

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          disabled={!dirty || duplicates.length > 0}
          onClick={handleSave}
          className={`rounded px-3 py-1 text-sm ${dirty && duplicates.length === 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'}`}
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={() => setLocal({ ...DEFAULT_SHORTCUTS })}
          className="rounded px-3 py-1 text-sm bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
        >
          Reset to Defaults
        </button>
      </div>
      {duplicates.length > 0 && (
        <p className="text-sm text-red-400">
          Duplicate bindings detected — please resolve them first.
        </p>
      )}
    </div>
  );
}

// Export the memoized component for better performance
export default memo(ShortcutsSection);
