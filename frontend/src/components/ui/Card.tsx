import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Minimal reusable card with rounded corners, subtle border and backdrop blur.
 */
export default function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-neutral-700 bg-neutral-800/60 p-4 backdrop-blur ${className}`.trim()}
    >
      {children}
    </div>
  );
}
