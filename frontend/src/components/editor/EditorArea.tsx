import { memo, useEffect } from 'react';
import CodeEditor from '../../features/editor/CodeEditor';
import EditorTabs from './EditorTabs';
import { useTabStore } from './tabStore';

/** Combines tab strip + Monaco editor below */
function EditorAreaImpl() {
  const { activeTab, updateCode } = useTabStore((s) => ({
    activeTab: s.tabs.find((t) => t.id === s.activeTabId) ?? null,
    updateCode: s.updateTabCode,
  }));

  // Ensure at least one tab open
  const openTab = useTabStore((s) => s.openTab);
  useEffect(() => {
    if (!activeTab) {
      openTab({ name: 'Untitled' });
    }
  }, [activeTab, openTab]);

  if (!activeTab) return null;

  return (
    <div className="flex flex-col h-full w-full min-w-0 min-h-0 rounded-lg border border-neutral-700 bg-neutral-900/60">
      <EditorTabs />
      <div className="flex-1 min-h-0 min-w-0">
        <CodeEditor
          language={activeTab.language}
          initialCode={activeTab.code}
          /**
           * Capture edits and sync back into store. In real file integration we’ll debounce & persist.
           */
          onChange={(val) => updateCode(activeTab.id, val ?? '')}
        />
      </div>
    </div>
  );
}

export const EditorArea = memo(EditorAreaImpl);
