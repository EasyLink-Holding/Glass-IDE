// src/lib/monaco/virtualDocument.ts
// -----------------------------------------------------------------------------
// VirtualDocument streams huge files and frees memory for off-screen chunks.
// Strategy:
//   1. Split file into fixed-size CHUNK_SIZE lines.
//   2. Load only chunks within viewport ±1 chunk.
//   3. Replace evicted chunks with newline placeholders so line numbers stay.
// This allows opening ~100k-line files without large memory spikes.
// -----------------------------------------------------------------------------

import * as monaco from 'monaco-editor';

const CHUNK_SIZE = 2_000;
const LOOKAHEAD = 1; // how many chunks around viewport to keep

interface Chunk {
  startLine: number; // 1-based
  endLine: number;
  text: string | null; // null == evicted
}

// Minimal subset of IStandaloneCodeEditor we rely on. Keeps us type-safe without
// depending on an exact Monaco version.
interface EditorViewport {
  onDidScrollChange(listener: () => void): monaco.IDisposable;
  getVisibleRanges(): monaco.IRange[];
}

export class VirtualDocument {
  readonly model: monaco.editor.ITextModel;
  private chunks: Chunk[] = [];

  constructor(
    private fullText: string,
    language: string
  ) {
    const uri = monaco.Uri.parse(`inmemory://virtual/${Date.now()}.${language}`);
    this.model = monaco.editor.createModel('', language, uri);

    const lines = fullText.split(/\r?\n/);
    const totalLines = lines.length;
    const chunkCount = Math.ceil(totalLines / CHUNK_SIZE);

    for (let i = 0; i < chunkCount; i += 1) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalLines);
      const text = i === 0 ? lines.slice(start, end).join('\n') : null;
      this.chunks.push({ startLine: start + 1, endLine: end, text });
    }

    // set initial visible text (first chunk) so editor paints instantly
    this.model.setValue(this.chunks[0]?.text ?? '');
  }

  attachEditor(editor: EditorViewport): void {
    // Load missing chunks + evict far ones on scroll
    editor.onDidScrollChange(() => {
      const ranges = editor.getVisibleRanges();
      if (!ranges.length) return;
      const visibleStart = ranges[0].startLineNumber;
      const visibleEnd = ranges[0].endLineNumber;
      const needChunksStart = Math.max(0, Math.floor((visibleStart - 1) / CHUNK_SIZE) - LOOKAHEAD);
      const needChunksEnd = Math.min(
        this.chunks.length - 1,
        Math.floor((visibleEnd - 1) / CHUNK_SIZE) + LOOKAHEAD
      );

      for (let idx = 0; idx < this.chunks.length; idx += 1) {
        const chunk = this.chunks[idx];
        if (!chunk) continue;
        const loaded = chunk.text !== null;
        const shouldBeLoaded = idx >= needChunksStart && idx <= needChunksEnd;

        if (shouldBeLoaded && !loaded) {
          // load chunk
          const text = this.getChunkText(idx);
          this.applyChunk(idx, text);
        } else if (!shouldBeLoaded && loaded && idx !== 0) {
          // evict chunk (never evict first chunk)
          this.applyChunk(idx, null);
        }
      }
    });
  }

  dispose(): void {
    this.model.dispose();
    this.chunks.length = 0;
    // allow GC of big string
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.fullText = '';
  }

  private getChunkText(idx: number): string {
    const chunk = this.chunks[idx];
    if (!chunk) return '';
    if (chunk.text !== null) return chunk.text;
    const startIdx = idx * CHUNK_SIZE;
    const endIdx = chunk.endLine; // already 1-based line number end
    const lines = this.fullText.split(/\r?\n/).slice(startIdx, endIdx).join('\n');
    return lines;
  }

  private applyChunk(idx: number, text: string | null): void {
    const chunk = this.chunks[idx];
    if (!chunk) return;
    const placeholder = '\n'.repeat(chunk.endLine - chunk.startLine);
    const newText = text ?? placeholder;
    const range = new monaco.Range(
      chunk.startLine,
      1,
      chunk.endLine,
      this.model.getLineMaxColumn(chunk.endLine)
    );
    this.model.pushEditOperations(
      [],
      [
        {
          range,
          text: newText,
          forceMoveMarkers: true,
        },
      ],
      () => null
    );
    chunk.text = text;
  }
}

// Factory helper for existing call-sites
export function createVirtualDocument(fullText: string, language: string): VirtualDocument {
  return new VirtualDocument(fullText, language);
}
