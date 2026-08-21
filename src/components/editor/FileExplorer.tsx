import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { File, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useAppStore } from '@/store';

export function FileExplorer() {
  const { files, activeFileId, setActiveFile, createFile, deleteFile, renameFile } = useAppStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleCreate = () => {
    if (newFileName.trim()) {
      createFile(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameFile(id, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--fg-tertiary)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          Project
        </span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCreating(true)}
          style={{
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--fg-muted)',
            transition: 'color var(--transition-fast), background var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--fg-primary)';
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-hover)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--fg-muted)';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <Plus size={14} />
        </motion.button>
      </div>

      {/* File list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 8px' }}>
        <AnimatePresence>
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 32 }}
              exit={{ opacity: 0, height: 0 }}
              onClick={() => setActiveFile(file.id)}
              onMouseEnter={() => setHoveredId(file.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: file.id === activeFileId ? 'var(--bg-surface-hover)' : 'transparent',
                transition: 'background var(--transition-fast)',
                marginBottom: 2,
              }}
            >
              <File
                size={14}
                style={{
                  color: file.id === activeFileId ? 'var(--fg-primary)' : 'var(--fg-muted)',
                  flexShrink: 0,
                }}
              />

              {editingId === file.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(file.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    style={{
                      flex: 1,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--accent-primary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px 6px',
                      fontSize: 12,
                      fontFamily: 'var(--font-code)',
                      color: 'var(--fg-primary)',
                      outline: 'none',
                    }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(file.id);
                    }}
                    style={{ color: 'var(--success)', padding: 2 }}
                  >
                    <Check size={12} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                    }}
                    style={{ color: 'var(--fg-muted)', padding: 2 }}
                  >
                    <X size={12} />
                  </motion.button>
                </div>
              ) : (
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    fontFamily: 'var(--font-code)',
                    color: file.id === activeFileId ? 'var(--fg-primary)' : 'var(--fg-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file.name}
                </span>
              )}

              {/* Actions on hover */}
              {hoveredId === file.id && editingId !== file.id && (
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(file.id);
                      setEditName(file.name.replace('.cpp', ''));
                    }}
                    style={{
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--fg-muted)',
                    }}
                    onMouseEnter={(ev) => {
                      (ev.currentTarget as HTMLElement).style.color = 'var(--fg-primary)';
                    }}
                    onMouseLeave={(ev) => {
                      (ev.currentTarget as HTMLElement).style.color = 'var(--fg-muted)';
                    }}
                  >
                    <Pencil size={11} />
                  </motion.button>
                  {files.length > 1 && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file.id);
                      }}
                      style={{
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--fg-muted)',
                      }}
                      onMouseEnter={(ev) => {
                        (ev.currentTarget as HTMLElement).style.color = 'var(--danger)';
                      }}
                      onMouseLeave={(ev) => {
                        (ev.currentTarget as HTMLElement).style.color = 'var(--fg-muted)';
                      }}
                    >
                      <Trash2 size={11} />
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* New file input */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 32 }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 8px',
                marginTop: 2,
              }}
            >
              <File size={14} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
              <input
                autoFocus
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') {
                    setIsCreating(false);
                    setNewFileName('');
                  }
                }}
                placeholder="filename.cpp"
                style={{
                  flex: 1,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '2px 6px',
                  fontSize: 12,
                  fontFamily: 'var(--font-code)',
                  color: 'var(--fg-primary)',
                  outline: 'none',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
