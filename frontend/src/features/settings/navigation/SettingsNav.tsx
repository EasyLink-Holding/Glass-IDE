import {
  Folders as FoldersIcon,
  GearSix as GearSixIcon,
  Keyboard as KeyboardIcon,
  Sliders as SlidersIcon,
} from 'phosphor-react';
import type { SectionId } from '../../../app/settings/SettingsPane';
import { memoIcon } from '../../../lib/ui/memoIcon';
import NavItem from './NavItem';

// Using the consistent SectionId type imported from SettingsPane

const Folders = memoIcon(FoldersIcon);
const GearSix = memoIcon(GearSixIcon);
const Keyboard = memoIcon(KeyboardIcon);
const Sliders = memoIcon(SlidersIcon);

interface Props {
  current: SectionId;
  onSelect(id: SectionId): void;
}

const items = [
  { id: 'general', label: 'General', icon: GearSix },
  { id: 'workspace', label: 'Workspace', icon: Folders },
  { id: 'customization', label: 'Customization', icon: Sliders },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
] as const;

export default function SettingsNav({ current, onSelect }: Props) {
  return (
    <nav className="w-40 border-r border-neutral-700 p-2">
      {items.map((item) => (
        <NavItem
          key={item.id}
          active={current === item.id}
          onClick={() => onSelect(item.id as SectionId)}
          label={item.label}
          Icon={item.icon}
        />
      ))}
    </nav>
  );
}
