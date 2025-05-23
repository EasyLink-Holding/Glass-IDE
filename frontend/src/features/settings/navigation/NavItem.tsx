import type { ComponentType } from 'react';

interface Props {
  active: boolean;
  onClick(): void;
  label: string;
  Icon: ComponentType<{ size?: number; weight?: 'fill' | 'regular' }>;
}

export default function NavItem({ active, onClick, label, Icon }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded px-2 py-1 text-sm ${
        active ? 'bg-neutral-700 text-white' : 'hover:bg-neutral-800 text-neutral-300'
      }`}
    >
      <Icon size={16} weight={active ? 'fill' : 'regular'} />
      {label}
    </button>
  );
}
