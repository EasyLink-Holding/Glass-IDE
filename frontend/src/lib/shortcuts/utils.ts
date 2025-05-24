/**
 * Cross-platform keyboard helpers + formatting
 */

/** Detect whether runtime platform is macOS. */
export const isMac = (): boolean =>
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/** Platform-aware modifier keyword (⌘ or Ctrl) */
export const MOD = isMac() ? 'cmd' : 'ctrl';

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
