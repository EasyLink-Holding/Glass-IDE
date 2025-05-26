import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

/**
 * Simple action button with glass-ide styling.
 */
export default function Button({ label, className = '', ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`rounded bg-blue-600 px-4 py-1 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-neutral-600 disabled:cursor-not-allowed ${className}`.trim()}
    >
      {label}
    </button>
  );
}
