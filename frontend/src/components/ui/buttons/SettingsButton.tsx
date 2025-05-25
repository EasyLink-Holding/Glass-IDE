import { GearSix } from 'phosphor-react';
import { useSettingsToggle } from '../../../hooks/useSettingsToggle';

/**
 * Settings toggle button component
 * Uses React's hooks pattern for clean state management
 */
export default function SettingsButton() {
  // Use our custom hook for toggling settings
  const { toggleSettings } = useSettingsToggle();

  return (
    <button
      type="button"
      onClick={toggleSettings}
      aria-label="Settings"
      className="p-1 text-neutral-200 hover:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-500"
      data-no-drag
    >
      <GearSix size={20} weight="regular" />
    </button>
  );
}
