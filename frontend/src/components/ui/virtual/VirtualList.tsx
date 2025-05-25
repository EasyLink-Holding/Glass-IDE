import { memo } from 'react';
// Lightweight typed wrapper around react-window for easy virtualisation
import { FixedSizeList as List } from 'react-window';
import type { ListChildComponentProps } from 'react-window';

export interface VirtualListProps<T> {
  items: T[];
  render: (item: T, index: number) => React.ReactNode;
  /** Row height (px) */
  itemSize?: number;
  /** Viewport height (px) */
  height?: number;
  /** Width (px or %) */
  width?: number | string;
}

function VirtualListInner<T>({
  items,
  render,
  itemSize = 24,
  height = 400,
  width = '100%',
}: VirtualListProps<T>) {
  const Row = ({ index, style }: ListChildComponentProps) => (
    <div style={style}>{render(items[index], index)}</div>
  );

  return (
    <List height={height} itemCount={items.length} itemSize={itemSize} width={width}>
      {Row}
    </List>
  );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;
