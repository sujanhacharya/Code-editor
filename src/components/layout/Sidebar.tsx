import React from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  Search,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store';

const sidebarItems = [
  { id: 'explorer', icon: FolderOpen, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'style', icon: Sparkles, label: 'Style' },
  { id: 'settings', icon: Settings, label: 'Settings' },
] as const;

export function Sidebar() {
  const {
    layout,
    toggleExplorer,
    setStyleSelectorOpen,
    setSettingsOpen,
    toggleSidebar,
  } = useAppStore();

  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

  return (
    <div
      style={{
        width: 'var(--sidebar-width)',
        height: '100%',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        flexShrink: 0,
        position: 'relative',
        zIndex: 110,
      }}
    >
      {/* Top items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            (item.id === 'explorer' && layout.explorerOpen) ||
            (item.id === 'style' && useAppStore.getState().styleSelectorOpen) ||
            (item.id === 'settings' && useAppStore.getState().settingsOpen);

          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (item.id === 'explorer') toggleExplorer();
                else if (item.id === 'style') setStyleSelectorOpen(true);
                else if (item.id === 'settings') setSettingsOpen(true);
              }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
                background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                transition: 'color var(--transition-fast), background var(--transition-fast)',
                position: 'relative',
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              {item.id === 'style' && (
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                  }}
                />
              )}

              {/* Tooltip */}
              {hoveredItem === item.id && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    position: 'absolute',
                    left: '100%',
                    marginLeft: 8,
                    padding: '4px 8px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 11,
                    fontFamily: 'var(--font-ui)',
                    color: 'var(--fg-primary)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 200,
                    boxShadow: 'var(--shadow-md)',
                  }}
                >
                  {item.label}
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Bottom: collapse */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleSidebar}
        style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-md)',
          color: 'var(--fg-muted)',
          transition: 'color var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = 'var(--fg-secondary)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = 'var(--fg-muted)';
        }}
      >
        {layout.sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </motion.button>
    </div>
  );
}
