import Select, { type SelectOption } from '../../../../../components/ui/buttons/Select';
// Import templates data
import { DEFAULT_EDITOR_TEMPLATE } from '../../../../../lib/layout/defaults';
import { templates } from '../../../../../lib/layout/templates';

interface Props {
  value: string;
  onChange(value: string): void;
}

export default function TemplatePicker({ value, onChange }: Props) {
  // build option list once
  const options: SelectOption[] = templates.map(
    (t): SelectOption => ({
      value: t.id,
      label: `${t.name}${t.id === DEFAULT_EDITOR_TEMPLATE ? ' (editor default)' : ''}${t.id === 'single' ? ' (basic default)' : ''}`,
    })
  );

  return (
    <Select aria-label="Layout template" value={value} onChange={onChange} options={options} />
  );
}
