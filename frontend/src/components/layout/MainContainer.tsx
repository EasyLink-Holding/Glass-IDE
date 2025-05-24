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
    /**
     * Defines margins between panes inside the main container (p-2)
     * */
    <div className="flex h-full w-full rounded-lg border border-neutral-700 bg-neutral-800/60 p-2 backdrop-blur">
      {children}
    </div>
  );
}
