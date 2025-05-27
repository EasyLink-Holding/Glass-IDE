import Editor from '@monaco-editor/react';
import { useEffect } from 'react';
import SkeletonPane from '../../components/common/SkeletonPane';
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
    // Large files are handled via a virtual (read-only) document to avoid
    // sending huge text to the worker.
    virtualDoc = createVirtualDocument(initialCode, language);
    modelProps.model = virtualDoc.model;
  } else {
    // For regular files we operate in *controlled* mode so the same Monaco
    // instance can be reused when switching tabs.
    modelProps.value = initialCode;
  }

  return (
    <Editor
      height="100%"
      language={language}
      theme="vs-dark"
      loading={<SkeletonPane />}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        // Disable heavier features for snappier interaction – can be toggled
        // via settings later.
        codeLens: false,
        lightbulb: { enabled: false } as const,
        inlineSuggest: { enabled: false },
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
