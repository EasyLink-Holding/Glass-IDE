import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
// Lightweight typed wrapper around react-window for easy virtualisation
import { FixedSizeList as List } from 'react-window';
import type { ListChildComponentProps } from 'react-window';

export interface VirtualListProps<T> {
  items: T[];
  render: (item: T, index: number) => React.ReactNode;
  /** Row height (px) */
  itemSize?: number;
  /** Explicit viewport height (px). If omitted, the list will automatically fill the
   *  available parent height using a `ResizeObserver`. */
  height?: number;
  /** Explicit width (px or %). If omitted or set to `"100%"`, width will be
   *  measured from the parent element. */
  width?: number | string;
}

function VirtualListInner<T>({
  items,
  render,
  itemSize = 24,
  height,
  width = '100%',
}: VirtualListProps<T>) {
  /** Ref to the wrapper element used for auto-sizing */
  const containerRef = useRef<HTMLDivElement>(null);

  /** Measured parent size – falls back to defaults if unavailable */
  const [autoSize, setAutoSize] = useState<{ height: number; width: number }>({
    height: height ?? 400,
    width: typeof width === 'number' ? width : 0, // 0 means measure later
  });

  // Measure the parent element when explicit height / width are not provided.
  const shouldMeasureHeight = height === undefined;
  const shouldMeasureWidth = typeof width !== 'number';

  /** Helper that performs a single measurement */
  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const { clientHeight, clientWidth } = containerRef.current;
    setAutoSize((prev) => ({
      height: shouldMeasureHeight ? clientHeight : prev.height,
      width: shouldMeasureWidth ? clientWidth : prev.width,
    }));
  }, [shouldMeasureHeight, shouldMeasureWidth]);

  // Perform an initial synchronous measurement after DOM paint.
  useLayoutEffect(() => {
    measure();
  }, [measure]);

  // Re-measure on resize using ResizeObserver.
  useEffect(() => {
    if (!shouldMeasureHeight && !shouldMeasureWidth) return undefined;
    if (!containerRef.current) return undefined;

    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [shouldMeasureHeight, shouldMeasureWidth, measure]);

  const listHeight = height ?? autoSize.height;
  const listWidth = typeof width === 'number' ? width : autoSize.width || '100%';

  const Row = ({ index, style }: ListChildComponentProps) => (
    <div style={style}>{render(items[index], index)}</div>
  );

  return (
    <div ref={containerRef} className="h-full w-full">
      <List height={listHeight} itemCount={items.length} itemSize={itemSize} width={listWidth}>
        {Row}
      </List>
    </div>
  );
}

export const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;
