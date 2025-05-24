declare module 'hotkeys-js' {
  type ModKey = 'cmd' | 'ctrl' | 'shift' | 'alt' | 'option' | 'control' | 'command';

  export interface HotkeysEvent {
    key: string;
    scope: string;
    shortcut: string;
    method: (event: KeyboardEvent, handler: HotkeysEvent) => void;
    mods: ModKey[];
  }

  export type Handler = (event: KeyboardEvent, handler: HotkeysEvent) => void;

  export interface Options {
    scope?: string;
    splitKey?: string;
  }

  interface HotkeysStatic {
    (keys: string, handler: Handler): void;
    (keys: string, options: Options, handler: Handler): void;
    (keys: string, scope: string, handler: Handler): void;

    // Unbind
    unbind(keys?: string): void;

    // Scope management
    setScope(scopeName: string): void;
    getScope(): string;
    deleteScope(scopeName: string): void;

    // Misc utilities
    filter(event: KeyboardEvent): boolean;
    noConflict(): HotkeysStatic;

    // Modifier flags
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
  }

  const hotkeys: HotkeysStatic;
  export = hotkeys;
}
