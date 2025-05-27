import { memo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
// Lightweight typed wrapper around react-window for easy virtualisation
import { FixedSizeList as List } from 'react-window';
import type { ListChildComponentProps } from 'react-window';

export interface VirtualListProps<T> {
  items: T[];
  render: (item: T, index: number) => React.ReactNode;
  /** Row height (px) */
  itemSize?: number;
  /** Explicit viewport height (px). If omitted, component will auto-size to fill parent height. */
  height?: number;
  /** Width (px or %) when height is provided. */
  width?: number | string;
}

function VirtualListInner<T>({
  items,
  render,
  itemSize = 24,
  height,
  width = '100%',
}: VirtualListProps<T>) {
  const Row = ({ index, style }: ListChildComponentProps) => (
    <div style={style}>{render(items[index], index)}</div>
  );

  // If height is not provided, expand to fill available space using AutoSizer
  if (height === undefined) {
    return (
      <AutoSizer disableWidth={false} disableHeight={false}>
        {({ height: autoH, width: autoW }: { height: number; width: number }) => (
          <List height={autoH} itemCount={items.length} itemSize={itemSize} width={autoW}>
            {Row}
          </List>
        )}
      </AutoSizer>
    );
  }

  return (
    <List height={height} itemCount={items.length} itemSize={itemSize} width={width}>
      {Row}
    </List>
  );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;
