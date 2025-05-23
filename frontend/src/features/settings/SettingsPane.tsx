import { Suspense, useMemo, useState } from 'react';
import SettingsNav from './navigation/SettingsNav';
import GeneralSection from './sections/General/GeneralSection';
import WorkspaceSection from './sections/Workspace/WorkspaceSection';

const sectionMap = {
  general: GeneralSection,
  workspace: WorkspaceSection,
} as const;

type SectionId = keyof typeof sectionMap;

export default function SettingsPane() {
  const [current, setCurrent] = useState<SectionId>('general');
  const CurrentComp = useMemo(() => sectionMap[current], [current]);

  return (
    <div className="flex h-full w-full">
      <SettingsNav current={current} onSelect={setCurrent} />
      <div className="flex-1 overflow-auto p-6">
        <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
          <CurrentComp />
        </Suspense>
      </div>
    </div>
  );
}
