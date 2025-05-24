import { DEFAULT_TEMPLATE } from '../../../../../lib/layout/defaults';
import { templates } from '../../../../../lib/layout/templates';

interface Props {
  value: string;
  onChange(value: string): void;
}

export default function TemplatePicker({ value, onChange }: Props) {
  return (
    <select
      aria-label="Layout template"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-xs rounded border border-neutral-600 bg-neutral-800 p-1 text-sm"
    >
      {templates.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
          {t.id === DEFAULT_TEMPLATE ? ' (default)' : ''}
        </option>
      ))}
    </select>
  );
}
