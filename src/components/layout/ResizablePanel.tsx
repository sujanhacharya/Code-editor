import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ResizablePanelProps {
  direction: 'horizontal' | 'vertical';
  size: number;
  minSize: number;
  maxSize: number;
  onResize: (size: number) => void;
  children: React.ReactNode;
  className?: string;
  collapsed?: boolean;
  /**
   * Which edge carries the drag handle.
   *  - horizontal panels: 'end' = right edge (explorer)
   *  - vertical panels:   'start' = top edge (terminal divider under Monaco)
   * Dragging a 'start' handle upward grows the panel, which is why the delta is
   * inverted for it.
   */
  handleEdge?: 'start' | 'end';
  /** Double-clicking the divider toggles maximize (spec item 8). */
  onHandleDoubleClick?: () => void;
  /** Lets the parent suppress height animation while a drag is in flight. */
  onResizeStateChange?: (resizing: boolean) => void;
}

/**
 * Invisible grab area around the 1px visual divider (spec item 2: 6-10px).
 *
 * The handle is positioned entirely INSIDE the panel rather than straddling the
 * border with a negative offset: the animated wrapper around this panel uses
 * overflow:hidden for its open/collapse animation, which would clip away the
 * overhanging half and silently shrink the grab area.
 */
const HIT_AREA = 7;

export function ResizablePanel({
  direction,
  size,
  minSize,
  maxSize,
  onResize,
  children,
  className = '',
  collapsed = false,
  handleEdge,
  onHandleDoubleClick,
  onResizeStateChange,
}: ResizablePanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const isHorizontal = direction === 'horizontal';
  // Terminal divider sits on top; explorer divider sits on the right.
  const edge = handleEdge ?? (isHorizontal ? 'end' : 'start');
  const cursor = isHorizontal ? 'col-resize' : 'ns-resize';

  // Keep the latest values available to the move handler without re-binding it.
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);
      onResizeStateChange?.(true);

      const startPos = isHorizontal ? e.clientX : e.clientY;
      const startSize = sizeRef.current;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY;
        const delta = currentPos - startPos;
        // A handle on the start edge grows the panel when dragged toward
        // negative delta (up / left), so invert it.
        const raw = edge === 'start' ? startSize - delta : startSize + delta;
        onResizeRef.current(Math.min(maxSize, Math.max(minSize, raw)));
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        onResizeStateChange?.(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = cursor;
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [isHorizontal, edge, minSize, maxSize, cursor, onResizeStateChange]
  );

  // Safety net: if the component unmounts mid-drag, restore the cursor.
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const active = isDragging || isHovering;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        position: 'relative',
        // Fill the slot the parent gives us so children can use height: 100%.
        width: '100%',
        height: '100%',
        // Nested flex children need this to be allowed to shrink (spec item 17).
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {children}

      {!collapsed && (
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={onHandleDoubleClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          title={onHandleDoubleClick ? 'Drag to resize · double-click to maximize' : 'Drag to resize'}
          style={{
            position: 'absolute',
            zIndex: 50,
            cursor,
            // Sits flush against the panel's own edge so the whole strip is
            // grabbable and the 1px line lands exactly on the border.
            ...(isHorizontal
              ? {
                  [edge === 'start' ? 'left' : 'right']: 0,
                  top: 0,
                  bottom: 0,
                  width: HIT_AREA,
                  justifyContent: edge === 'start' ? 'flex-start' : 'flex-end',
                  alignItems: 'stretch',
                }
              : {
                  [edge === 'start' ? 'top' : 'bottom']: 0,
                  left: 0,
                  right: 0,
                  height: HIT_AREA,
                  alignItems: edge === 'start' ? 'flex-start' : 'flex-end',
                  justifyContent: 'stretch',
                }),
            background: 'transparent',
            display: 'flex',
          }}
        >
          {/* Subtle 1px line that only lights up on hover/drag. */}
          <div
            style={{
              ...(isHorizontal
                ? { width: 1, height: '100%' }
                : { height: 1, width: '100%' }),
              background: isDragging
                ? 'var(--accent-primary)'
                : isHovering
                ? 'var(--border-hover)'
                : 'transparent',
              transition: isDragging ? 'none' : 'background var(--transition-fast)',
              pointerEvents: 'none',
              opacity: active ? 1 : 0,
            }}
          />
        </div>
      )}
    </div>
  );
}
