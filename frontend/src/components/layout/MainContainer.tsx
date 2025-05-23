import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Main floating card that hosts all IDE panes.
 * Rounded corners, thin border, backdrop blur; no shadows.
 */
export default function MainContainer({ children }: Props) {
  return (
    <div className="flex h-full w-full gap-4 rounded-lg border border-neutral-700 bg-neutral-800/60 p-4 backdrop-blur">
      {children}
    </div>
  );
}
