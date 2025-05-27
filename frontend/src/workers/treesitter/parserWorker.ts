/* -------------------------------------------------------------------------
 * Tree-sitter parser worker
 * -------------------------------------------------------------------------
 * Maintains per-document incremental parse trees and responds to messages:
 *  { type: 'parse', docId, language, text }
 *  { type: 'edit',  docId, edits: { startIndex, oldEndIndex, newEndIndex, text }[] }
 *  { type: 'query', docId, queryType } – returns folds / symbols / tokens
 *
 * WARNING: minimal first-pass implementation – semantic tokens only.
 * ----------------------------------------------------------------------- */

import Parser from 'web-tree-sitter';
import { loadLanguage } from './languages';
import type { SupportedLanguage } from './languages';

interface ParseMsg {
  type: 'parse';
  docId: string;
  language: SupportedLanguage;
  text: string;
}
interface Edit {
  startIndex: number;
  oldEndIndex: number;
  newEndIndex: number;
  // Tree-sitter incremental edit also requires byte positions; we ignore here.
  // We allow additional fields so cast later.
  [key: string]: unknown;
}
interface EditMsg {
  type: 'edit';
  docId: string;
  edits: Edit[];
}
interface QueryMsg {
  type: 'query';
  docId: string;
  queryType: 'tokens';
}

type InMsg = ParseMsg | EditMsg | QueryMsg;

type OutMsg = { type: 'parsed'; docId: string } | { type: 'tokens'; docId: string; data: Token[] };

interface Token {
  startIndex: number;
  length: number;
  scope: string;
}

const parsers: Map<string, Parser> = new Map();
const trees: Map<string, Parser.Tree> = new Map();

async function getParser(lang: SupportedLanguage): Promise<Parser> {
  const existing = parsers.get(lang);
  if (existing) return existing;
  const langObj = await loadLanguage(lang);
  const parser = new Parser();
  parser.setLanguage(langObj);
  parsers.set(lang, parser);
  return parser;
}

function collectTokens(tree: Parser.Tree): Token[] {
  const tokens: Token[] = [];

  const visit = (node: Parser.SyntaxNode): void => {
    if (node.isNamed()) {
      tokens.push({
        startIndex: node.startIndex,
        length: node.endIndex - node.startIndex,
        scope: node.type,
      });
    }
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) visit(child);
    }
  };

  visit(tree.rootNode);
  return tokens;
}

self.onmessage = async (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  switch (msg.type) {
    case 'parse': {
      const parser = await getParser(msg.language);
      const tree = parser.parse(msg.text);
      trees.set(msg.docId, tree);
      const tokens = collectTokens(tree);
      postMessage({ type: 'tokens', docId: msg.docId, data: tokens } as OutMsg);
      postMessage({ type: 'parsed', docId: msg.docId } as OutMsg);
      break;
    }
    case 'edit': {
      const tree = trees.get(msg.docId);
      if (!tree) return;
      for (const edit of msg.edits) {
        // Cast because our Edit subset doesn't match Parser.Edit fully.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        tree.edit(edit as Parser.Edit);
      }
      // Note: minimal implementation – not re-parsing. Clients should request tokens.
      break;
    }
    case 'query': {
      if (msg.queryType !== 'tokens') break;
      const tree = trees.get(msg.docId);
      if (!tree) break;
      postMessage({ type: 'tokens', docId: msg.docId, data: collectTokens(tree) } as OutMsg);
      break;
    }
  }
};
