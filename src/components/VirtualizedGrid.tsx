import React from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";

interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: number;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  /**
   * Optional pixel offset from the top of the document to where this
   * grid starts. Needed when there's a sticky header above the grid so
   * the virtualizer can correctly compute which rows are in the viewport.
   *
   * Pass the header's height (e.g. 73) here. Defaults to 0.
   */
  scrollMargin?: number;
}

export function VirtualizedGrid<T>({
  items,
  renderItem,
  columns = 3,
  estimateSize = 420,
  overscan = 4,
  className = "",
  scrollMargin = 0,
}: VirtualizedGridProps<T>) {
  

  const containerRef = React.useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(items.length / columns);

  /**
   * useWindowVirtualizer — uses window as the scroll container.
   * No scrollContainerRef needed. Works correctly with the single
   * document-scroll architecture in RoomsListing.
   *
   * scrollMargin: distance (px) from top of document to the top of
   * the virtualizer container. Without it the virtualizer miscalculates
   * which rows are visible when there's a sticky header.
   */
  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => estimateSize,
    overscan,
    scrollMargin: containerRef.current?.offsetTop ?? scrollMargin,
  });

  // Re-measure on item count change (e.g. new page loaded)
  React.useEffect(() => {
    rowVirtualizer.measure();
  }, [items.length, rowVirtualizer]);

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalHeight = rowVirtualizer.getTotalSize();
  if (!items.length) return null;

  // Determine last visible index (approx)
  const lastVisibleIndex = virtualRows.length ? (virtualRows[virtualRows.length - 1].index * columns) + (columns - 1) : -1;

  return (
    /**
     * Spacer div — sets the total scroll height so the browser
     * scrollbar has the correct range. Position relative so absolute
     * row children are offset correctly.
     */
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ height: totalHeight }}
    >
      {virtualRows.map((virtualRow) => {
        const startIndex = virtualRow.index * columns;

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={(el) => {
              if (el) rowVirtualizer.measureElement(el);
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              /**
               * Subtract scrollMargin so rows are positioned relative
               * to the container, not the document top.
               */
              transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
            }}
          >
            <div
              className="grid gap-6 pb-6 w-full"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: columns }).map((_, i) => {
                const item = items[startIndex + i];
                if (!item) return <div key={`ph-${startIndex + i}`} aria-hidden />;
                return (
                  <div key={(item as any)?.id ?? startIndex + i}>
                    {renderItem(item, startIndex + i)}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default VirtualizedGrid;