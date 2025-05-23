import type { SettingKey } from '../../../lib/settings/schema';
import { useSettings } from '../../../lib/settings/store';

interface Props {
  settingKey: SettingKey;
  label: string;
}

export default function Toggle({ settingKey, label }: Props) {
  const value = useSettings<boolean>((s) => s[settingKey] as boolean);
  const set = useSettings((s) => s.set);

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => set(settingKey, e.target.checked)}
        className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-blue-500 focus:ring-blue-500"
      />
      <span className="select-none text-sm">{label}</span>
    </label>
  );
}
