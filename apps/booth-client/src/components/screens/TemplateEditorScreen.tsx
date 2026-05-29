'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import { motion } from 'framer-motion';
import { useUIStore } from '../../stores';
import type { Template, TemplateSlot, TemplateText } from 'shared';
import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// ── Initial template state ────────────────────────────────────────────────────
const BLANK_TEMPLATE: Template = {
  id: '',
  name: '新建模板',
  category: 'custom',
  isBuiltin: false,
  photoCount: 4,
  size: { width: 1200, height: 1800, dpi: 300 },
  background: { color: '#ffffff' },
  slots: [
    { id: uuidv4(), x: 60, y: 60, width: 510, height: 382, radius: 8, fit: 'cover' },
    { id: uuidv4(), x: 630, y: 60, width: 510, height: 382, radius: 8, fit: 'cover' },
    { id: uuidv4(), x: 60, y: 510, width: 510, height: 382, radius: 8, fit: 'cover' },
    { id: uuidv4(), x: 630, y: 510, width: 510, height: 382, radius: 8, fit: 'cover' },
  ],
  texts: [],
  stickers: [],
  lut: null,
};

// Scale factor for canvas display (actual template is 1200×1800)
const DISPLAY_SCALE = 0.35;

// ── Slot element on canvas ────────────────────────────────────────────────────
function SlotElement({
  slot,
  isSelected,
  onSelect,
  onChange,
  scale,
}: {
  slot: TemplateSlot;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updated: Partial<TemplateSlot>) => void;
  scale: number;
}) {
  const shapeRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Rect
        ref={shapeRef}
        x={slot.x * scale}
        y={slot.y * scale}
        width={slot.width * scale}
        height={slot.height * scale}
        cornerRadius={(slot.radius ?? 0) * scale}
        fill="hsl(200, 60%, 80%)"
        stroke={isSelected ? '#e05578' : 'rgba(100,150,200,0.5)'}
        strokeWidth={isSelected ? 2 : 1}
        opacity={0.8}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: Math.round(e.target.x() / scale),
            y: Math.round(e.target.y() / scale),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current!;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: Math.round(node.x() / scale),
            y: Math.round(node.y() / scale),
            width: Math.round((node.width() * scaleX) / scale),
            height: Math.round((node.height() * scaleY) / scale),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
}

// ── Template Editor Screen ─────────────────────────────────────────────────────
export function TemplateEditorScreen() {
  const navigate = useUIStore((s) => s.navigate);
  const [template, setTemplate] = useState<Template>({ ...BLANK_TEMPLATE, id: uuidv4() });
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const canvasWidth = template.size.width * DISPLAY_SCALE;
  const canvasHeight = template.size.height * DISPLAY_SCALE;

  const updateSlot = useCallback((slotId: string, changes: Partial<TemplateSlot>) => {
    setTemplate((prev) => ({
      ...prev,
      slots: prev.slots.map((s) => (s.id === slotId ? { ...s, ...changes } : s)),
    }));
  }, []);

  const addSlot = () => {
    const newSlot: TemplateSlot = {
      id: uuidv4(),
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      radius: 8,
      fit: 'cover',
    };
    setTemplate((prev) => ({
      ...prev,
      slots: [...prev.slots, newSlot],
      photoCount: prev.slots.length + 1,
    }));
  };

  const removeSelectedSlot = () => {
    if (!selectedSlotId) return;
    setTemplate((prev) => ({
      ...prev,
      slots: prev.slots.filter((s) => s.id !== selectedSlotId),
      photoCount: Math.max(1, prev.slots.length - 1),
    }));
    setSelectedSlotId(null);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch(`${API_URL}/api/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...template, name: template.name || '自定义模板' }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('idle');
    }
  };

  const selectedSlot = template.slots.find((s) => s.id === selectedSlotId);

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
      {/* Header toolbar */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate('admin')}
          className="btn btn-ghost"
          style={{ padding: '8px 14px', fontSize: '13px' }}
        >
          ← 返回
        </button>

        <input
          className="input"
          value={template.name}
          onChange={(e) => setTemplate((prev) => ({ ...prev, name: e.target.value }))}
          style={{ width: '200px', fontSize: '15px' }}
          placeholder="模板名称"
        />

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button onClick={addSlot} className="btn btn-secondary" style={{ fontSize: '13px' }}>
            + 添加照片框
          </button>
          {selectedSlotId && (
            <button
              onClick={removeSelectedSlot}
              className="btn btn-ghost"
              style={{ fontSize: '13px', color: 'var(--color-error)' }}
            >
              🗑 删除选中
            </button>
          )}
          <motion.button
            onClick={handleSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="btn btn-primary"
            style={{ fontSize: '13px' }}
          >
            {saveStatus === 'saving' ? '保存中...' : saveStatus === 'saved' ? '✓ 已保存' : '💾 保存模板'}
          </motion.button>
        </div>
      </div>

      {/* Main editor area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Canvas area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'hsl(0,0%,7%)',
            padding: '24px',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <Stage
              width={canvasWidth}
              height={canvasHeight}
              onClick={(e) => {
                if (e.target === e.target.getStage()) setSelectedSlotId(null);
              }}
            >
              <Layer>
                {/* Background */}
                <Rect
                  width={canvasWidth}
                  height={canvasHeight}
                  fill={template.background?.color ?? '#fff'}
                />

                {/* Photo slots */}
                {template.slots.map((slot) => (
                  <SlotElement
                    key={slot.id}
                    slot={slot}
                    isSelected={selectedSlotId === slot.id}
                    onSelect={() => setSelectedSlotId(slot.id)}
                    onChange={(changes) => updateSlot(slot.id, changes)}
                    scale={DISPLAY_SCALE}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Properties panel */}
        <div
          style={{
            width: '260px',
            borderLeft: '1px solid var(--color-border)',
            padding: '20px',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
            {selectedSlot ? '📦 照片框属性' : '🎨 模板属性'}
          </h3>

          {selectedSlot ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(['x', 'y', 'width', 'height', 'radius'] as const).map((prop) => (
                <div key={prop}>
                  <label
                    style={{
                      fontSize: '12px',
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    {prop === 'radius' ? '圆角' : prop.toUpperCase()}
                  </label>
                  <input
                    className="input"
                    type="number"
                    value={selectedSlot[prop] ?? 0}
                    onChange={(e) =>
                      updateSlot(selectedSlot.id, { [prop]: Number(e.target.value) })
                    }
                    style={{ fontSize: '14px' }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                  背景颜色
                </label>
                <input
                  type="color"
                  value={template.background?.color ?? '#ffffff'}
                  onChange={(e) =>
                    setTemplate((prev) => ({
                      ...prev,
                      background: { ...prev.background, color: e.target.value },
                    }))
                  }
                  style={{ width: '100%', height: '40px', borderRadius: '8px', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                  照片数量
                </label>
                <span style={{ fontSize: '15px', color: 'var(--color-text)' }}>
                  {template.slots.length} 张
                </span>
              </div>

              <div style={{ marginTop: '8px', padding: '12px', background: 'var(--color-surface)', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-text-sub)', lineHeight: 1.6 }}>
                  💡 拖拽照片框来移动<br />
                  使用角点缩放调整大小<br />
                  点击画布空白处取消选中
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
