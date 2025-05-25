import { useMemo, useState } from 'react';
import { templates } from '../../../../lib/layout/templates';
import type { SpaceId } from '../../../../lib/layout/types';
import type { PaneId } from '../../../../lib/layout/types';
import { useSettings } from '../../../../lib/settings/store';
import SaveButton from '../../ui/SaveButton';
import PaneList from './layout/PaneList';
import SlotVisualizer from './layout/SlotVisualizer';
import SpaceSelector from './layout/SpaceSelector';
import TemplatePicker from './layout/TemplatePicker';

/**
 * Layout configuration subsection that allows users to customize the layout for each space
 */
export default function LayoutSubSection() {
  // ----- State Management -----
  // Space selector state
  const [currentSpace, setCurrentSpace] = useState<SpaceId>('editor');
  const [selected, setSelected] = useState<PaneId | null>(null);

  // Access settings from store
  const spaceTemplateMap = useSettings((s) => s.spaceTemplateMap);
  const spacePaneSlotMaps = useSettings((s) => s.spacePaneSlotMaps);
  const setSettings = useSettings((s) => s.set);

  // Local state for temporary modifications before saving
  const [localTemplateMap, setLocalTemplateMap] = useState<Record<SpaceId, string>>({
    ...spaceTemplateMap,
  });
  const [localPaneSlotMaps, setLocalPaneSlotMaps] = useState<
    Record<SpaceId, Record<PaneId, string>>
  >({ ...spacePaneSlotMaps });

  // ----- Derived Values -----
  // Get current template ID with fallback
  const currentTemplateId =
    localTemplateMap[currentSpace] || (currentSpace === 'editor' ? 'split-horizontal' : 'single');

  // Get current pane map with fallback
  const currentPaneMap =
    localPaneSlotMaps[currentSpace] ||
    (currentSpace === 'editor'
      ? { explorer: 'left', main: 'main', chat: 'right' }
      : { explorer: 'none', main: 'main', chat: 'none' });

  // Track whether settings have been modified
  const dirty =
    JSON.stringify(localTemplateMap) !== JSON.stringify(spaceTemplateMap) ||
    JSON.stringify(localPaneSlotMaps) !== JSON.stringify(spacePaneSlotMaps);

  // Get the template object for the current space
  const template = useMemo(
    () => templates.find((t) => t.id === currentTemplateId) ?? templates[0],
    [currentTemplateId]
  );

  // ----- Event Handlers -----

  /**
   * Update the selected pane's slot in the current space's pane map
   */
  function handleSelectSlot(slotId: string) {
    if (!selected) return;

    setLocalPaneSlotMaps({
      ...localPaneSlotMaps,
      [currentSpace]: {
        ...localPaneSlotMaps[currentSpace],
        [selected]: slotId,
      },
    });
  }

  /**
   * Update the template for the current space
   */
  function handleTemplateChange(templateId: string) {
    setLocalTemplateMap({
      ...localTemplateMap,
      [currentSpace]: templateId,
    });
  }

  /**
   * Handle space selection change
   */
  function handleSpaceChange(spaceId: SpaceId) {
    setCurrentSpace(spaceId);
    setSelected(null); // Reset selected pane when changing space
  }

  /**
   * Save all changes to settings
   */
  function handleSave() {
    setSettings('spaceTemplateMap', localTemplateMap);
    setSettings('spacePaneSlotMaps', localPaneSlotMaps);
  }

  // ----- Render Component -----
  return (
    <div className="rounded border border-neutral-700 p-4 space-y-4">
      <h3 className="font-medium">Layout Configuration</h3>

      {/* Space selector component */}
      <SpaceSelector currentSpace={currentSpace} onSpaceChange={handleSpaceChange} />

      <div className="space-y-4 pt-2">
        {/* Template selector */}
        <div className="space-y-1">
          <span className="text-sm text-neutral-300">Template for {currentSpace} space:</span>
          <TemplatePicker value={currentTemplateId} onChange={handleTemplateChange} />
        </div>

        {/* Pane configuration - only shown for multi-pane templates */}
        {currentTemplateId !== 'single' && (
          <>
            <div className="pt-2 border-t border-neutral-800">
              <span className="text-sm text-neutral-300">Configure pane positions:</span>
            </div>
            <div className="flex gap-4">
              <PaneList selected={selected} onSelect={setSelected} />

              {/* Slot visualizer */}
              <SlotVisualizer
                template={template}
                selectedPane={selected}
                onSelect={handleSelectSlot}
                paneNames={currentPaneMap}
              />
            </div>
          </>
        )}

        {/* Info message for single template */}
        {currentTemplateId === 'single' && (
          <div className="py-2 text-sm text-neutral-400">
            Single pane template uses main content only - no additional configuration needed.
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-between pt-2 border-t border-neutral-800">
        <SaveButton dirty={dirty} onSave={handleSave} />
      </div>
    </div>
  );
}
