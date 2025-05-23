import { Folders, GearSix } from 'phosphor-react';
import NavItem from './NavItem';

interface Props {
  current: 'general' | 'workspace';
  onSelect(id: 'general' | 'workspace'): void;
}

const items = [
  { id: 'general', label: 'General', icon: GearSix },
  { id: 'workspace', label: 'Workspace', icon: Folders },
] as const;

export default function SettingsNav({ current, onSelect }: Props) {
  return (
    <nav className="w-40 border-r border-neutral-700 p-2">
      {items.map((item) => (
        <NavItem
          key={item.id}
          active={current === item.id}
          onClick={() => onSelect(item.id)}
          label={item.label}
          Icon={item.icon}
        />
      ))}
    </nav>
  );
}
