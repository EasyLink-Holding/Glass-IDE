import type { ReactElement } from 'react';
import type { LayoutNode, LayoutTemplate, PaneId } from '../../../../../lib/layout/types';

interface Props {
  template: LayoutTemplate;
  selectedPane: PaneId | null;
  paneNames: Record<PaneId, string>; // paneId -> slotId mapping (for filled name display)
  onSelect(slotId: string): void;
}

interface SlotProps {
  id: string;
  label?: string;
  isSelected: boolean;
  isFilled: boolean;
  onSelect(): void;
}

function Slot({ id, label, isSelected, isFilled, onSelect }: SlotProps) {
  return (
    <button
      type="button"
      aria-label={`Slot ${id}`}
      onClick={onSelect}
      className={`relative flex flex-1 h-full w-full items-center justify-center border border-neutral-600 transition-colors hover:bg-neutral-800 ${
        isSelected ? 'ring-2 ring-blue-400' : ''
      } ${isFilled ? 'bg-neutral-700/40' : ''}`}
    >
      {label && <span className="text-xs capitalize text-neutral-200">{label}</span>}
    </button>
  );
}

export default function SlotVisualizer({ template, selectedPane, paneNames, onSelect }: Props) {
  const paneSlotMap = paneNames; // use passed local map instead of global for live preview

  function renderNode(node: LayoutNode): ReactElement {
    if (node.type === 'slot') {
      const isSelected = selectedPane ? paneSlotMap[selectedPane] === node.id : false;
      const isFilled = Object.values(paneSlotMap).includes(node.id);
      const paneEntry = Object.entries(paneSlotMap).find(([, slot]) => slot === node.id);
      const paneId = paneEntry ? paneEntry[0] : undefined;
      return (
        <Slot
          id={node.id}
          label={paneId}
          isSelected={isSelected}
          isFilled={isFilled}
          onSelect={() => onSelect(node.id)}
          key={node.id}
        />
      );
    }

    // split node
    const isRow = node.dir === 'row';
    const ratios =
      node.ratio && node.ratio.length === node.children.length ? node.ratio : undefined;

    return (
      <div className={`flex ${isRow ? 'flex-row' : 'flex-col'} flex-1 h-full w-full`}>
        {node.children.map((child, idx) => (
          <div
            key={child.type === 'slot' ? `slot-${child.id}` : `split-${idx}`}
            className={`flex grow-${ratios ? ratios[idx] : 1}`}
          >
            {renderNode(child)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-48 flex-1 max-w-[18rem] min-w-0 overflow-hidden border border-neutral-700">
      {renderNode(template.root)}
    </div>
  );
}
