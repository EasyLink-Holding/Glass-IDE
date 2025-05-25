/**
 * Keyboard Shortcuts settings panel
 * Allows users to view & customize keyboard bindings stored in settings
 */
import { useEffect, useMemo, useState } from 'react';
import { useSettings } from '../../../lib/settings/store';
import { type ActionId, DEFAULT_SHORTCUTS, actionLabels } from '../../../lib/shortcuts/shortcuts';

function formatShortcut(shortcut: string) {
  const parts = shortcut.split('+');
  return parts
    .map((part) => {
      if (part === 'cmd') return '⌘';
      if (part === 'ctrl') return 'Ctrl';
      if (part === 'alt') return 'Alt';
      if (part === 'shift') return 'Shift';
      return part;
    })
    .join('+');
}

export default function ShortcutsSection() {
  const shortcuts = useSettings((s) => s.shortcuts);
  const setSettings = useSettings((s) => s.set);

  const [local, setLocal] = useState({ ...shortcuts });
  const [recording, setRecording] = useState<ActionId | null>(null);

  // Capture next key stroke when recording is active
  useEffect(() => {
    if (!recording) return;

    function handler(e: KeyboardEvent) {
      e.preventDefault();
      const parts: string[] = [];
      if (e.metaKey) parts.push('cmd');
      if (e.ctrlKey) parts.push('ctrl');
      if (e.altKey) parts.push('alt');
      if (e.shiftKey) parts.push('shift');
      if (e.key && !['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
        parts.push(e.key.toLowerCase());
      }
      const combo = parts.join('+');
      if (combo) setLocal((prev) => ({ ...prev, [recording as ActionId]: combo }));
      setRecording(null);
    }

    window.addEventListener('keydown', handler, { capture: true });
    return () =>
      window.removeEventListener('keydown', handler, { capture: true } as EventListenerOptions);
  }, [recording]);

  // Detect duplicate bindings (very simple)
  const duplicates = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of Object.values(local)) {
      counts[c] = (counts[c] ?? 0) + 1;
    }
    return Object.keys(counts).filter((k) => counts[k] > 1);
  }, [local]);

  const dirty = JSON.stringify(local) !== JSON.stringify(shortcuts);

  function handleSave() {
    setSettings('shortcuts', local);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
        <p className="text-neutral-400 text-sm">Click “Change” then press a new key combination.</p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-400">
            <th className="py-1 font-normal">Action</th>
            <th className="py-1 font-normal">Binding</th>
            <th className="py-1 font-normal" />
          </tr>
        </thead>
        <tbody>
          {(Object.keys(DEFAULT_SHORTCUTS) as ActionId[]).map((id) => {
            const combo = local[id] ?? '';
            const dup = duplicates.includes(combo);
            return (
              <tr key={id} className="border-t border-neutral-700">
                <td className="py-1.5 pr-2">{actionLabels[id]}</td>
                <td className={`py-1.5 ${dup ? 'text-red-400' : ''}`}>
                  {combo ? formatShortcut(combo) : '—'}
                </td>
                <td className="py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => setRecording(id)}
                    className="rounded bg-neutral-700 px-2 py-0.5 text-xs hover:bg-neutral-600"
                  >
                    {recording === id ? 'Press…' : 'Change'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex gap-2">
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
