import Editor from '@monaco-editor/react';
import { useEffect } from 'react';
import { LARGE_FILE_THRESHOLD, ensureLanguage } from '../../lib/monaco/loader';
import { type VirtualDocument, createVirtualDocument } from '../../lib/monaco/virtualDocument';

export interface CodeEditorProps {
  language?: string;
  initialCode?: string;
}

/**
 * Thin wrapper around Monaco that sets sensible defaults and fills available space.
 * Placed under src/features/editor to co-locate all editor-feature specific files.
 */
export default function CodeEditor({
  language = 'typescript',
  initialCode = '// Start coding…',
}: CodeEditorProps) {
  // Lazy-load language support on mount
  useEffect(() => {
    void ensureLanguage(language);
  }, [language]);

  const modelProps: Record<string, unknown> = {};
  let virtualDoc: VirtualDocument | undefined;
  if ((initialCode?.length ?? 0) > LARGE_FILE_THRESHOLD) {
    virtualDoc = createVirtualDocument(initialCode, language);
    modelProps.model = virtualDoc.model;
  }

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      defaultValue={initialCode}
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: false },
      }}
      onMount={(editor) => {
        virtualDoc?.attachEditor(editor);
      }}
      {...modelProps}
    />
  );
}
