import { useMemo, useState } from 'react';
import { templates } from '../../../../lib/layout/templates';
import type { PaneId } from '../../../../lib/layout/types';
import { useSettings } from '../../../../lib/settings/store';
import PaneList from './layout/PaneList';
import SlotVisualizer from './layout/SlotVisualizer';
import TemplatePicker from './layout/TemplatePicker';

export default function LayoutSubSection() {
  const [selected, setSelected] = useState<PaneId | null>(null);
  const activeTemplateId = useSettings((s) => s.activeTemplateId);
  const paneSlotMap = useSettings((s) => s.paneSlotMap);
  const setSettings = useSettings((s) => s.set);

  const [localTemplate, setLocalTemplate] = useState<string>(activeTemplateId);
  const [localMap, setLocalMap] = useState<Record<string, string>>(paneSlotMap);
  const dirty =
    localTemplate !== activeTemplateId || JSON.stringify(localMap) !== JSON.stringify(paneSlotMap);

  const template = useMemo(
    () => templates.find((t) => t.id === localTemplate) ?? templates[0],
    [localTemplate]
  );

  function handleSelectSlot(slotId: string) {
    if (!selected) return;
    setLocalMap({
      ...localMap,
      [selected]: slotId,
    });
  }

  function handleSave() {
    setSettings('activeTemplateId', localTemplate);
    setSettings('paneSlotMap', localMap);
  }

  return (
    <div className="rounded border border-neutral-700 p-4 space-y-4">
      <h3 className="font-medium">Layout</h3>
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-300">Template:</span>
        <TemplatePicker value={localTemplate} onChange={setLocalTemplate} />
      </div>
      <div className="flex gap-4">
        <PaneList selected={selected} onSelect={setSelected} />
        <SlotVisualizer
          template={template}
          selectedPane={selected}
          onSelect={handleSelectSlot}
          paneNames={localMap}
        />
      </div>
      <button
        type="button"
        disabled={!dirty}
        onClick={handleSave}
        className={`rounded px-3 py-1 text-sm ${dirty ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'}`}
      >
        Save
      </button>
    </div>
  );
}
