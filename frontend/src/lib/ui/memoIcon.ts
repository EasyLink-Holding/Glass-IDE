import { createElement, memo } from 'react';
import type { ComponentType, NamedExoticComponent } from 'react';

/**
 * Wrap an icon component (e.g., from phosphor-react) in React.memo so the SVG
 * tree isn’t recreated on every render. Avoids JSX inside a generic to satisfy
 * the TSX parser.
 */
export function memoIcon<P extends object>(Icon: ComponentType<P>): NamedExoticComponent<P> {
  // eslint-disable-next-line react/display-name
  return memo((props: P) => createElement(Icon, props));
}
