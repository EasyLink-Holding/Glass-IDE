import { useMemo, useState } from 'react';
import { templates } from '../../../../lib/layout/templates';
import { SPACES } from '../../../../lib/layout/types';
import type { SpaceId } from '../../../../lib/layout/types';
import type { PaneId } from '../../../../lib/layout/types';
import { useSettings } from '../../../../lib/settings/store';
import PaneList from './layout/PaneList';
import SlotVisualizer from './layout/SlotVisualizer';
import TemplatePicker from './layout/TemplatePicker';

export default function LayoutSubSection() {
  // Space selector state
  const [currentSpace, setCurrentSpace] = useState<SpaceId>('editor');
  const [selected, setSelected] = useState<PaneId | null>(null);

  // Access space template and pane mappings
  const spaceTemplateMap = useSettings((s) => s.spaceTemplateMap);
  const spacePaneSlotMaps = useSettings((s) => s.spacePaneSlotMaps);
  const setSettings = useSettings((s) => s.set);

  // Local state for the current space's template and pane mappings
  // We clone the settings values to avoid direct mutations
  const [localTemplateMap, setLocalTemplateMap] = useState<Record<SpaceId, string>>({
    ...spaceTemplateMap,
  });
  const [localPaneSlotMaps, setLocalPaneSlotMaps] = useState<
    Record<SpaceId, Record<PaneId, string>>
  >({ ...spacePaneSlotMaps });

  // Current space's template and pane map
  // Ensures we always have a valid template ID for the current space
  const currentTemplateId =
    localTemplateMap[currentSpace] || (currentSpace === 'editor' ? 'split-horizontal' : 'single');

  // Ensure we have a valid pane map for the current space
  const currentPaneMap =
    localPaneSlotMaps[currentSpace] ||
    (currentSpace === 'editor'
      ? { explorer: 'left', editor: 'main', console: 'right' }
      : { explorer: 'none', editor: 'main', console: 'none' });

  // Track whether settings have been modified
  const dirty =
    JSON.stringify(localTemplateMap) !== JSON.stringify(spaceTemplateMap) ||
    JSON.stringify(localPaneSlotMaps) !== JSON.stringify(spacePaneSlotMaps);

  // Get the template object for the current space
  const template = useMemo(
    () => templates.find((t) => t.id === currentTemplateId) ?? templates[0],
    [currentTemplateId]
  );

  // Update the selected pane's slot in the current space's pane map
  function handleSelectSlot(slotId: string) {
    if (!selected) return;

    // Update the local pane map for the current space
    const updatedViewMap = {
      ...localPaneSlotMaps,
      [currentSpace]: {
        ...localPaneSlotMaps[currentSpace],
        [selected]: slotId,
      },
    };

    setLocalPaneSlotMaps(updatedViewMap);
  }

  // Update the template for the current space
  function handleTemplateChange(templateId: string) {
    setLocalTemplateMap({
      ...localTemplateMap,
      [currentSpace]: templateId,
    });
  }

  // Save all changes to settings
  function handleSave() {
    // Update the space-specific settings with the local state
    // This will persist the changes to the settings store
    setSettings('spaceTemplateMap', localTemplateMap);
    setSettings('spacePaneSlotMaps', localPaneSlotMaps);
  }

  return (
    <div className="rounded border border-neutral-700 p-4 space-y-4">
      <h3 className="font-medium">Layout Configuration</h3>

      {/* Space selector */}
      <div className="space-y-1">
        <span className="text-sm text-neutral-300">Configure layout for:</span>
        <select
          value={currentSpace}
          onChange={(e) => setCurrentSpace(e.target.value as SpaceId)}
          className="w-full max-w-xs rounded border border-neutral-600 bg-neutral-800 p-1 text-sm"
          aria-label="Select space to configure"
        >
          {SPACES.map((space: SpaceId) => (
            <option key={space} value={space}>
              {space.charAt(0).toUpperCase() + space.slice(1)} Space
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4 pt-2">
        {/* Template selector */}
        <div className="space-y-1">
          <span className="text-sm text-neutral-300">Template for {currentSpace} space:</span>
          <TemplatePicker value={currentTemplateId} onChange={handleTemplateChange} />
        </div>

        {/* Pane list - only show if not using 'single' template */}
        {currentTemplateId !== 'single' && (
          <>
            <div className="pt-2 border-t border-neutral-800">
              <span className="text-sm text-neutral-300">Configure pane positions:</span>
            </div>
            <div className="flex gap-4">
              <PaneList selected={selected} onSelect={setSelected} />

              {/* Slot visualiser */}
              <SlotVisualizer
                template={template}
                selectedPane={selected}
                onSelect={handleSelectSlot}
                paneNames={currentPaneMap}
              />
            </div>
          </>
        )}

        {currentTemplateId === 'single' && (
          <div className="py-2 text-sm text-neutral-400">
            Single pane template uses main content only - no additional configuration needed.
          </div>
        )}
      </div>

      <div className="flex justify-between pt-2 border-t border-neutral-800">
        <button
          type="button"
          disabled={!dirty}
          onClick={handleSave}
          className={`rounded px-3 py-1 text-sm ${dirty ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-400 cursor-not-allowed'}`}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
