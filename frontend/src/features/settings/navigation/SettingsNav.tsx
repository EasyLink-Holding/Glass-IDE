import { Folders, GearSix, Sliders } from 'phosphor-react';
import NavItem from './NavItem';

type SectionId = 'general' | 'workspace' | 'customization';

interface Props {
  current: SectionId;
  onSelect(id: SectionId): void;
}

const items = [
  { id: 'general', label: 'General', icon: GearSix },
  { id: 'workspace', label: 'Workspace', icon: Folders },
  { id: 'customization', label: 'Customization', icon: Sliders },
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
