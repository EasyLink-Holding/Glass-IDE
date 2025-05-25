import type { ComponentType } from 'react';

/**
 * Reusable navigation button component for sidebar and top navigation
 * - Shows only the icon
 * - Uses filled icon when active, regular icon when not active
 * - No hover effects or background changes
 */
interface NavButtonProps {
  /**
   * Phosphor icon component to display
   */
  icon: ComponentType<{ size?: number; weight?: 'fill' | 'regular' }>;

  /**
   * Tooltip/aria-label text for the button
   */
  label: string;

  /**
   * Whether the button is currently active
   */
  isActive?: boolean;

  /**
   * Click handler for the button
   */
  onClick: () => void;

  /**
   * Optional mouse enter handler (for prefetching, etc.)
   */
  onMouseEnter?: () => void;

  /**
   * Optional data-testid for testing
   */
  testId?: string;

  /**
   * Optional icon size, defaults to 20
   */
  size?: number;
}

export default function NavButton({
  icon: Icon,
  label,
  isActive = false,
  onClick,
  onMouseEnter,
  testId,
  size = 20,
}: NavButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      data-testid={testId}
      data-no-drag
      className="p-2 focus:outline-none focus:ring-2 focus:ring-neutral-500 dark:text-neutral-200 text-neutral-800 bg-transparent"
    >
      <Icon size={size} weight={isActive ? 'fill' : 'regular'} />
    </button>
  );
}
