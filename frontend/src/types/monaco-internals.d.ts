// src/types/monaco-internals.d.ts
// -----------------------------------------------------------------------------
// Minimal typings for Monaco internal tokenization classes that are not
// published in the upstream `monaco.d.ts`. We wrap them in a virtual module
// so we don't rely on unstable deep import paths.
// -----------------------------------------------------------------------------

declare module '@glass/monaco-tokenization' {
  import type * as monaco from 'monaco-editor';

  /** Single token produced by a tokenizer. */
  export interface Token {
    /** Character offset in the line */
    startIndex: number;
    /** Scope string used by Monaco theme engine */
    scopes: string;
  }

  /** Result object returned by `tokenize` */
  export interface TokenizationResult {
    tokens: Token[];
    endState: monaco.languages.IState;
  }
}
