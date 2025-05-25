import { CaretDown as CaretDownIcon } from 'phosphor-react';
import { memoIcon } from '../../../lib/ui/memoIcon';
const CaretDown = memoIcon(CaretDownIcon);
import type { ChangeEvent, SelectHTMLAttributes } from 'react';

// Generic select component used across the app
export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function Select({
  value,
  defaultValue,
  options,
  onChange,
  placeholder,
  className = '',
  disabled,
  ...rest
}: SelectProps) {
  const baseSelect =
    'appearance-none w-full pr-8 rounded border border-neutral-600 bg-neutral-800 p-1 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500 disabled:opacity-50';

  const wrapper = `relative inline-block w-full max-w-xs ${className}`.trim();

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={wrapper}>
      <select
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        disabled={disabled}
        className={baseSelect}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map(({ value: v, label }) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
      <CaretDown
        size={16}
        weight="bold"
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400"
      />
    </div>
  );
}
