import { Suspense, useMemo, useState } from 'react';
import SettingsNav from '../../features/settings/navigation/SettingsNav';
import CustomizationSection from '../../features/settings/sections/Customization/CustomizationSection';
import GeneralSection from '../../features/settings/sections/General/GeneralSection';
import ShortcutsSection from '../../features/settings/sections/ShortcutsSection';
import WorkspaceSection from '../../features/settings/sections/Workspace/WorkspaceSection';

const sectionMap = {
  general: GeneralSection,
  workspace: WorkspaceSection,
  customization: CustomizationSection,
  shortcuts: ShortcutsSection,
} as const;

// Use a consistent type definition for section IDs across the app
export type SectionId = keyof typeof sectionMap;

export default function SettingsPane() {
  const [current, setCurrent] = useState<SectionId>('general');
  const CurrentComp = useMemo(() => sectionMap[current], [current]);

  return (
    <div className="flex h-full w-full min-w-0 min-h-0">
      <SettingsNav current={current} onSelect={setCurrent} />
      <div className="flex-1 min-w-0 min-h-0 overflow-auto p-6">
        <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
          <CurrentComp />
        </Suspense>
      </div>
    </div>
  );
}
