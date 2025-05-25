import type { PaneId } from '../../../../../lib/layout/types';

const panes: PaneId[] = ['explorer', 'main', 'chat'];

// Display labels for the panes
const paneLabels: Record<PaneId, string> = {
  explorer: 'Explorer',
  main: 'Main',
  chat: 'Chat',
};

interface Props {
  selected: PaneId | null;
  onSelect(id: PaneId): void;
}

export default function PaneList({ selected, onSelect }: Props) {
  return (
    <ul className="space-y-1">
      {panes.map((p) => (
        <li key={p}>
          <button
            type="button"
            onClick={() => onSelect(p)}
            className={`w-full rounded px-2 py-1 text-left text-sm ${
              p === selected ? 'bg-neutral-700 text-white' : 'hover:bg-neutral-800 text-neutral-300'
            }`}
          >
            {paneLabels[p]}
          </button>
        </li>
      ))}
    </ul>
  );
}
