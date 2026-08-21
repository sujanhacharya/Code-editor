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
}

export function ResizablePanel({
  direction,
  size,
  minSize,
  maxSize,
  onResize,
  children,
  className = '',
  collapsed = false,
}: ResizablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const startPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const startSize = size;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const currentPos = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY;
        const delta = currentPos - startPos;
        const newSize = direction === 'horizontal'
          ? startSize + delta
          : startSize + delta;
        const clamped = Math.min(maxSize, Math.max(minSize, newSize));
        onResize(clamped);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [direction, size, minSize, maxSize, onResize]
  );

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }
  }, [isDragging, direction]);

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      ref={panelRef}
      className={className}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
      {!collapsed && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            zIndex: 50,
            ...(isHorizontal
              ? {
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  cursor: 'col-resize',
                }
              : {
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  cursor: 'row-resize',
                }),
            background: isDragging ? 'var(--accent-primary)' : 'transparent',
            transition: isDragging ? 'none' : 'background var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            if (!isDragging) {
              (e.target as HTMLElement).style.background = 'var(--border-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              (e.target as HTMLElement).style.background = 'transparent';
            }
          }}
        />
      )}
    </div>
  );
}
