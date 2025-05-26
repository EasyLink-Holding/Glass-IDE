import Editor from '@monaco-editor/react';
import { useEffect } from 'react';
import { LARGE_FILE_THRESHOLD, ensureLanguage } from '../../lib/monaco/loader';

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

  // TODO: wire VirtualDocument when initialCode length > threshold
  const modelProps = {};
  if ((initialCode?.length ?? 0) > LARGE_FILE_THRESHOLD) {
    // placeholder – will hook real VirtualDocument later
    // eslint-disable-next-line no-console
    console.info('Large file detected – VirtualDocument stub');
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
      {...modelProps}
    />
  );
}
