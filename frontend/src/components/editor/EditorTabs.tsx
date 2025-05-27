import { EditorTab } from './EditorTab';
import { useTabStore } from './tabStore';

/** Horizontal bar that lists all open tabs */
export default function EditorTabs() {
  const { tabs, activeTabId } = useTabStore((s) => ({ tabs: s.tabs, activeTabId: s.activeTabId }));

  return (
    <div className="flex shrink-0 overflow-x-auto bg-neutral-800/80">
      {tabs.map((tab) => (
        <EditorTab key={tab.id} id={tab.id} name={tab.name} isActive={tab.id === activeTabId} />
      ))}
    </div>
  );
}
