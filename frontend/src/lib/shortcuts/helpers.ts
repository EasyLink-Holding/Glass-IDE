import type { ActionId, ShortcutMap } from './bindings';
import { isMac } from './utils';

/** Convert an internal combo string (e.g. "cmd+e") into a user-friendly label. */
export function formatShortcut(combo: string): string {
  if (typeof combo !== 'string' || combo.trim() === '') return '';

  const tokenMap: Record<'cmd' | 'ctrl' | 'shift' | 'alt', string> = isMac()
    ? { cmd: '⌘', ctrl: '⌃', shift: '⇧', alt: '⌥' }
    : { cmd: 'Cmd', ctrl: 'Ctrl', shift: 'Shift', alt: 'Alt' };

  return combo
    .split('+')
    .map((t) => tokenMap[t as keyof typeof tokenMap] ?? t.toUpperCase())
    .join(isMac() ? '' : '+');
}

/** Build an internal combo string from a KeyboardEvent. */
export function parseCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.metaKey) parts.push('cmd');
  if (e.ctrlKey) parts.push('ctrl');
  if (e.altKey) parts.push('alt');
  if (e.shiftKey) parts.push('shift');

  if (e.key && !['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
    parts.push(e.key.toLowerCase());
  }
  return parts.join('+');
}

/** Simple duplicate detector */
export function isDuplicate(map: ShortcutMap, combo: string, excludeId?: ActionId): boolean {
  return (
    Object.entries(map)
      .filter(([id]) => id !== excludeId)
      .findIndex(([_, c]) => c === combo) !== -1
  );
}
