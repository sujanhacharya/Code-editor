import React from 'react';
import { useAppStore } from '@/store';

export function CSSBackground() {
  const theme = useAppStore((s) => s.theme);

  if (theme === 'maximalism') {
    // Maximalism has Three.js background
    return null;
  }

  if (theme === 'brutalism') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: '#000000',
        }}
      >
        {/* Subtle grid for brutalism */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Horizontal lines */}
        <div
          style={{
            position: 'absolute',
            top: '33%',
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(255,255,255,0.02)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '66%',
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(255,255,255,0.02)',
          }}
        />
      </div>
    );
  }

  // Minimalism - subtle noise texture
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: '#0a0a0a',
      }}
    >
      {/* Subtle radial gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.02) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
