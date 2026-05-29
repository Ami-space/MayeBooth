'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTemplateStore, useUIStore } from '../../stores';
import type { Template } from 'shared';

const CATEGORY_LABELS: Record<string, string> = {
  korean:   '韩式',
  polaroid: '拍立得',
  strip:    '胶片条',
  square:   '方形',
  kawaii:   'Kawaii',
  y2k:      'Y2K',
  minimal:  '极简',
  magazine: '杂志',
  wedding:  '婚礼',
  custom:   '自定义',
};

const CATEGORY_EMOJI: Record<string, string> = {
  korean:   '🎀',
  polaroid: '📷',
  strip:    '🎞',
  square:   '⬛',
  kawaii:   '🌸',
  y2k:      '💿',
  minimal:  '◻️',
  magazine: '📰',
  wedding:  '💍',
  custom:   '✏️',
};

function TemplateCard({
  template,
  isSelected,
  onClick,
}: {
  template: Template;
  isSelected: boolean;
  onClick: () => void;
}) {
  const aspectRatio = template.size.height / template.size.width;
  const cardHeight = Math.min(220, 160 * aspectRatio);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'relative',
        background: isSelected ? 'var(--color-accent-soft)' : 'var(--gradient-card)',
        border: `2px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isSelected ? '0 0 0 4px var(--color-accent-soft), var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        width: '100%',
      }}
    >
      {/* Preview area */}
      <div
        style={{
          height: `${cardHeight}px`,
          background: template.background?.color ?? '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Slot preview mini visualization */}
        <div style={{ position: 'relative', width: '80%', height: '80%' }}>
          {template.slots.slice(0, 4).map((slot, i) => {
            // Normalize slot positions to preview area
            const scaleX = (0.8 * 160) / template.size.width;
            const scaleY = (cardHeight * 0.8) / template.size.height;
            return (
              <div
                key={slot.id}
                style={{
                  position: 'absolute',
                  left: `${slot.x * scaleX}px`,
                  top: `${slot.y * scaleY}px`,
                  width: `${slot.width * scaleX}px`,
                  height: `${slot.height * scaleY}px`,
                  borderRadius: `${(slot.radius ?? 4) * Math.min(scaleX, scaleY)}px`,
                  background: `hsl(${200 + i * 40}, 40%, ${65 - i * 5}%)`,
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              />
            );
          })}
        </div>

        {/* Selected check */}
        {isSelected && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}
          >
            ✓
          </div>
        )}

        {/* Category badge */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            padding: '2px 8px',
            borderRadius: '100px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            fontSize: '11px',
            color: 'white',
            fontWeight: 500,
          }}
        >
          {CATEGORY_EMOJI[template.category]} {CATEGORY_LABELS[template.category] ?? template.category}
        </div>
      </div>

      {/* Template info */}
      <div style={{ padding: '12px 14px' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: '15px',
            color: 'var(--color-text)',
            marginBottom: '4px',
          }}
        >
          {template.name}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
          }}
        >
          {template.photoCount} 张照片 · {template.size.width}×{template.size.height}
        </div>
      </div>
    </motion.button>
  );
}

export function TemplateSelectScreen() {
  const navigate = useUIStore((s) => s.navigate);
  const { templates, selectedTemplate, selectTemplate, setTemplates, setLoading } =
    useTemplateStore();
  const { getSocket } = require('../../services/socket');

  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/templates`)
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleStart = () => {
    if (!selectedTemplate) return;
    const socket = getSocket();
    socket.emit('session:create', { templateId: selectedTemplate.id });
    // Navigation will happen automatically via session:update event
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '28px 32px 20px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <button
            onClick={() => navigate('home')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-sub)',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← 返回
          </button>
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text)',
            }}
          >
            选择模板
          </h2>
          <p style={{ color: 'var(--color-text-sub)', fontSize: '15px', marginTop: '4px' }}>
            选择一个拍摄风格开始
          </p>
        </div>

        <motion.button
          onClick={handleStart}
          disabled={!selectedTemplate}
          whileHover={selectedTemplate ? { scale: 1.04 } : {}}
          whileTap={selectedTemplate ? { scale: 0.97 } : {}}
          className="btn btn-primary btn-booth"
          style={{ minWidth: '160px' }}
        >
          开始拍摄 →
        </motion.button>
      </div>

      {/* Template Grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate?.id === template.id}
              onClick={() => selectTemplate(template)}
            />
          ))}
        </div>

        {templates.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: 'var(--color-text-muted)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p style={{ fontSize: '18px' }}>暂无模板，请先启动服务器</p>
          </div>
        )}
      </div>
    </div>
  );
}
