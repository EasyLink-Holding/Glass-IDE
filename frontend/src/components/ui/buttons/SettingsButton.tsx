import { GearSix } from 'phosphor-react';
import { useSettingsToggle } from '../../../hooks/useSettingsToggle';
import NavButton from './NavButton';

/**
 * Settings toggle button component
 * Uses React's hooks pattern for clean state management
 */
export default function SettingsButton() {
  // Use our custom hook for toggling settings
  const { toggleSettings, isSettingsOpen } = useSettingsToggle();

  return (
    <NavButton icon={GearSix} label="Settings" isActive={isSettingsOpen} onClick={toggleSettings} />
  );
}
