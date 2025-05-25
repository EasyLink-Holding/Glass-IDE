import type { SettingKey } from '../../../lib/settings/schema';
import { useSettings } from '../../../lib/settings/store';

/**
 * A reusable toggle component for boolean settings
 */
interface Props {
  /**
   * The setting key to toggle. Must be a boolean setting.
   */
  settingKey: SettingKey;

  /**
   * The label to display next to the toggle
   */
  label: string;

  /**
   * Optional description to display below the toggle
   */
  description?: string;
}

export default function Toggle({ settingKey, label, description }: Props) {
  const value = useSettings<boolean>((s) => s[settingKey] as boolean);
  const set = useSettings((s) => s.set);

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => set(settingKey, e.target.checked)}
          className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-blue-500 focus:ring-blue-500"
        />
        <span className="select-none text-sm">{label}</span>
      </label>
      {description && <p className="ml-6 text-xs text-neutral-400">{description}</p>}
    </div>
  );
}
