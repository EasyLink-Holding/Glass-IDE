// src/lib/monaco/tokenKinds.ts
// -----------------------------------------------------------------------------
// Canonical list of token kinds used by our custom tokenizer pipeline.
// These map 1-to-1 onto Monaco scope strings so that themes work out-of-the box.
// -----------------------------------------------------------------------------

export enum TokenKind {
  Keyword = 'keyword',
  Identifier = 'identifier',
  Number = 'number',
  String = 'string',
  Comment = 'comment',
  Operator = 'operator',
  Delimiter = 'delimiter',
  Whitespace = 'white',
}

/** Maps a TokenKind to the scope string consumed by Monaco themes. */
export function kindToScope(kind: TokenKind): string {
  return kind;
}

// -----------------------------------------------------------------------------
// Simple line tokenizer for C-like languages (JS/TS, C, Java…). Adequate for
// highlight fallback and worker-based tokenization. Not 100% spec-compliant.
// -----------------------------------------------------------------------------

const JS_KEYWORDS = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'let',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'enum',
  'implements',
  'interface',
  'package',
  'private',
  'protected',
  'public',
  'static',
  'await',
  'as',
  'from',
  'of',
  'asserts',
  'any',
  'boolean',
  'declare',
  'get',
  'infer',
  'is',
  'keyof',
  'module',
  'namespace',
  'never',
  'readonly',
  'require',
  'number',
  'object',
  'set',
  'string',
  'symbol',
  'type',
  'undefined',
  'unique',
  'unknown',
  'global',
  'bigint',
  'override',
]);

// Regex capturing groups: comment, string, number, identifier, delimiter, op, ws
const TOKEN_REGEX =
  /(\/\/.*)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|([{}()[\];,])|([+*\-\/=%!<>|&^~]+)|(\s+)/g;

export interface TokenStruct {
  startIndex: number;
  kind: TokenKind;
}

export function tokenizeJsLikeLine(line: string): TokenStruct[] {
  const tokens: TokenStruct[] = [];

  // Reset global regex state for each call
  TOKEN_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while (true) {
    match = TOKEN_REGEX.exec(line);
    if (!match) break;

    const [value] = match;
    let kind = TokenKind.Identifier;
    if (match[1]) kind = TokenKind.Comment;
    else if (match[2] || match[3] || match[4]) kind = TokenKind.String;
    else if (match[5]) kind = TokenKind.Number;
    else if (match[6]) {
      kind = JS_KEYWORDS.has(value) ? TokenKind.Keyword : TokenKind.Identifier;
    } else if (match[7]) kind = TokenKind.Delimiter;
    else if (match[8]) kind = TokenKind.Operator;
    else if (match[9]) kind = TokenKind.Whitespace;

    tokens.push({ startIndex: match.index, kind });
  }

  return tokens;
}
