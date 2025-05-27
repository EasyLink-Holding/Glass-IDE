import Editor from '@monaco-editor/react';
import { useEffect } from 'react';
import { setupLspBridge } from '../../lib/lsp/bridge';
import { LARGE_FILE_THRESHOLD, ensureLanguage } from '../../lib/monaco/loader';
import { type VirtualDocument, createVirtualDocument } from '../../lib/monaco/virtualDocument';
import { useWorkspaceRoot } from '../../lib/workspace/workspaceStore';

export interface CodeEditorProps {
  language?: string;
  initialCode?: string;
  /** Callback whenever the editor content changes */
  onChange?: (value: string | undefined) => void;
}

/**
 * Thin wrapper around Monaco that sets sensible defaults and fills available space.
 * Placed under src/features/editor to co-locate all editor-feature specific files.
 */
export default function CodeEditor({
  language = 'typescript',
  initialCode = '',
  onChange,
}: CodeEditorProps) {
  const root = useWorkspaceRoot();

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
      onChange={onChange}
      onMount={(editor) => {
        virtualDoc?.attachEditor(editor);
        if (root) {
          void setupLspBridge(root, language);
        }
      }}
      {...modelProps}
    />
  );
}
