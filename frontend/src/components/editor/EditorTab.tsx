import { X } from 'phosphor-react';
import { useTabStore } from './tabStore';

interface Props {
  id: string;
  name: string;
  isActive: boolean;
}

/** Single tab strip item */
export function EditorTab({ id, name, isActive }: Props) {
  const setActive = useTabStore((s) => s.setActiveTab);
  const close = useTabStore((s) => s.closeTab);

  return (
    <div
      className={`flex items-center gap-2 border-b-2 px-1 py-1 select-none
        ${isActive ? 'border-blue-500 bg-neutral-800 text-white' : 'border-transparent text-neutral-300 hover:text-white'}`}
    >
      <button
        type="button"
        onClick={() => setActive(id)}
        className="flex items-center gap-2 px-2 py-0.5 truncate max-w-[150px] bg-transparent border-none outline-none"
      >
        {name}
      </button>
      <button
        title="Close tab"
        type="button"
        onClick={() => close(id)}
        className="text-neutral-400 hover:text-white px-1 py-0.5 bg-transparent border-none outline-none"
      >
        <X size={12} weight="bold" />
      </button>
    </div>
  );
}
