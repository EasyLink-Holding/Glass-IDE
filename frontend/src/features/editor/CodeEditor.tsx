import Editor from '@monaco-editor/react';

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
    />
  );
}
