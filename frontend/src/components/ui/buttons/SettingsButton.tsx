import { GearSix as GearSixIcon } from 'phosphor-react';
import { memo } from 'react';
import { usePrefetch } from '../../../hooks/usePrefetch';
import { useSettingsToggle } from '../../../hooks/useSettingsToggle';
import { memoIcon } from '../../../lib/ui/memoIcon';
import NavButton from './NavButton';

const GearSix = memoIcon(GearSixIcon);

/**
 * Settings toggle button component
 * Uses React's hooks pattern for clean state management
 * Implements prefetching for the settings panel to improve perceived performance
 */
function SettingsButton() {
  // Use our custom hook for toggling settings
  const { toggleSettings, isSettingsOpen } = useSettingsToggle();

  // Prefetch the settings panel when this component mounts
  // This ensures the settings view loads instantly when clicked
  const prefetchSettings = usePrefetch(
    // Import the actual settings pane component for correct prefetching
    () => import('../../../app/settings/SettingsPane'),
    { prefetchOnMount: true }
  );

  return (
    <NavButton
      icon={GearSix}
      label="Settings"
      isActive={isSettingsOpen}
      onClick={toggleSettings}
      onMouseEnter={prefetchSettings} // Prefetch when hovering as extra insurance
    />
  );
}

// Export a memoized version to prevent unnecessary re-renders
export default memo(SettingsButton);
