import { memo } from 'react';
import CodeEditor from '../../features/editor/CodeEditor';
import EditorTabs from './EditorTabs';
import { useTabStore } from './tabStore';

/** Combines tab strip + Monaco editor below */
function EditorAreaImpl() {
  const { activeTab, updateCode } = useTabStore((s) => ({
    activeTab: s.tabs.find((t) => t.id === s.activeTabId) ?? null,
    updateCode: s.updateTabCode,
  }));

  if (!activeTab) {
    return (
      <div className="flex items-center justify-center h-full w-full text-neutral-400 select-none">
        Open a file to get started
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full min-w-0 min-h-0 rounded-lg border border-neutral-700 bg-neutral-900/60">
      <EditorTabs />
      <div className="flex-1 min-h-0 min-w-0">
        <CodeEditor
          language={activeTab.language}
          // Always reflect latest code stored
          initialCode={activeTab.code}
          onChange={(val) => updateCode(activeTab.id, val ?? '')}
          /* No key – we keep the editor instance alive and swap models for perf */
        />
      </div>
    </div>
  );
}

export const EditorArea = memo(EditorAreaImpl);
