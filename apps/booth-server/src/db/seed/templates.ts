import Database from 'better-sqlite3';
import type { Template } from 'shared';
import { upsertTemplate } from '../queries/templates';

// ── Built-in template definitions ────────────────────────────────────────────
const BUILTIN_TEMPLATES: Template[] = [
  // 1. Korean 4-Grid (四宫格)
  {
    id: 'builtin-korean-4grid',
    name: '韩式四宫格',
    category: 'korean',
    description: '经典韩式四格相纸，竖版布局',
    isBuiltin: true,
    photoCount: 4,
    size: { width: 1200, height: 1800, dpi: 300 },
    background: { color: '#ffffff' },
    overlay: { src: 'overlays/korean-white-border.png', opacity: 1 },
    slots: [
      { id: 's1', x: 60, y: 60, width: 510, height: 382, radius: 8, fit: 'cover' },
      { id: 's2', x: 630, y: 60, width: 510, height: 382, radius: 8, fit: 'cover' },
      { id: 's3', x: 60, y: 510, width: 510, height: 382, radius: 8, fit: 'cover' },
      { id: 's4', x: 630, y: 510, width: 510, height: 382, radius: 8, fit: 'cover' },
    ],
    texts: [
      {
        id: 't-date',
        type: 'date',
        format: 'YYYY.MM.DD',
        x: 600,
        y: 980,
        font: 'Pretendard',
        size: 32,
        color: '#555555',
        align: 'center',
      },
      {
        id: 't-brand',
        type: 'static',
        value: 'MayeBooth',
        x: 600,
        y: 1020,
        font: 'Pretendard',
        size: 24,
        color: '#999999',
        align: 'center',
      },
    ],
    stickers: [],
    lut: null,
  },

  // 2. Film Strip (胶片条)
  {
    id: 'builtin-film-strip',
    name: '胶片条',
    category: 'strip',
    description: '竖版长条胶片风格，适合 2x6 打印纸',
    isBuiltin: true,
    photoCount: 4,
    size: { width: 600, height: 1800, dpi: 300 },
    background: { color: '#1a1a1a' },
    slots: [
      { id: 's1', x: 30, y: 30, width: 540, height: 390, radius: 4, fit: 'cover' },
      { id: 's2', x: 30, y: 460, width: 540, height: 390, radius: 4, fit: 'cover' },
      { id: 's3', x: 30, y: 890, width: 540, height: 390, radius: 4, fit: 'cover' },
      { id: 's4', x: 30, y: 1320, width: 540, height: 390, radius: 4, fit: 'cover' },
    ],
    texts: [
      {
        id: 't-date',
        type: 'date',
        format: 'YYYY.MM.DD',
        x: 300,
        y: 1740,
        font: 'Pretendard',
        size: 24,
        color: '#cccccc',
        align: 'center',
      },
    ],
    stickers: [],
    lut: null,
  },

  // 3. Polaroid (拍立得)
  {
    id: 'builtin-polaroid',
    name: '拍立得',
    category: 'polaroid',
    description: 'Polaroid 经典白框风格',
    isBuiltin: true,
    photoCount: 1,
    size: { width: 800, height: 960, dpi: 300 },
    background: { color: '#ffffff' },
    slots: [
      { id: 's1', x: 50, y: 50, width: 700, height: 700, radius: 2, fit: 'cover' },
    ],
    texts: [
      {
        id: 't-caption',
        type: 'static',
        value: '✦ 记忆 ✦',
        x: 400,
        y: 820,
        font: 'Pretendard',
        size: 36,
        color: '#333333',
        align: 'center',
      },
      {
        id: 't-date',
        type: 'date',
        format: 'YYYY.MM.DD',
        x: 400,
        y: 870,
        font: 'Pretendard',
        size: 22,
        color: '#888888',
        align: 'center',
      },
    ],
    stickers: [],
    lut: null,
  },

  // 4. Y2K Style
  {
    id: 'builtin-y2k',
    name: 'Y2K 风格',
    category: 'y2k',
    description: '千禧年 Y2K 风格，彩色边框',
    isBuiltin: true,
    photoCount: 4,
    size: { width: 1200, height: 1800, dpi: 300 },
    background: { color: '#e8f4ff' },
    slots: [
      { id: 's1', x: 70, y: 70, width: 490, height: 368, radius: 20, fit: 'cover', border: { width: 4, color: '#ff6b9d' } },
      { id: 's2', x: 640, y: 70, width: 490, height: 368, radius: 20, fit: 'cover', border: { width: 4, color: '#7ec8e3' } },
      { id: 's3', x: 70, y: 510, width: 490, height: 368, radius: 20, fit: 'cover', border: { width: 4, color: '#a8e6cf' } },
      { id: 's4', x: 640, y: 510, width: 490, height: 368, radius: 20, fit: 'cover', border: { width: 4, color: '#ffd93d' } },
    ],
    texts: [
      {
        id: 't-brand',
        type: 'static',
        value: '☆ MayeBooth ☆',
        x: 600,
        y: 960,
        font: 'Pretendard',
        size: 36,
        color: '#ff6b9d',
        align: 'center',
      },
      {
        id: 't-date',
        type: 'date',
        format: 'YYYY.MM.DD',
        x: 600,
        y: 1010,
        font: 'Pretendard',
        size: 26,
        color: '#666',
        align: 'center',
      },
    ],
    stickers: [],
    lut: null,
  },

  // 5. Minimal Mono
  {
    id: 'builtin-minimal-mono',
    name: '极简黑白',
    category: 'minimal',
    description: '极简风格，黑白背景，细边框',
    isBuiltin: true,
    photoCount: 4,
    size: { width: 1200, height: 1800, dpi: 300 },
    background: { color: '#f5f5f5' },
    slots: [
      { id: 's1', x: 80, y: 80, width: 480, height: 360, radius: 0, fit: 'cover' },
      { id: 's2', x: 640, y: 80, width: 480, height: 360, radius: 0, fit: 'cover' },
      { id: 's3', x: 80, y: 520, width: 480, height: 360, radius: 0, fit: 'cover' },
      { id: 's4', x: 640, y: 520, width: 480, height: 360, radius: 0, fit: 'cover' },
    ],
    texts: [
      {
        id: 't-brand',
        type: 'static',
        value: 'MAYEBOOTH',
        x: 600,
        y: 970,
        font: 'Pretendard',
        size: 28,
        color: '#111',
        align: 'center',
      },
      {
        id: 't-date',
        type: 'date',
        format: 'YYYY / MM / DD',
        x: 600,
        y: 1010,
        font: 'Pretendard',
        size: 20,
        color: '#888',
        align: 'center',
      },
    ],
    stickers: [],
    lut: null,
  },

  // 6. Kawaii Pink
  {
    id: 'builtin-kawaii',
    name: 'Kawaii 粉色',
    category: 'kawaii',
    description: '可爱粉色风格，大圆角',
    isBuiltin: true,
    photoCount: 4,
    size: { width: 1200, height: 1800, dpi: 300 },
    background: { color: '#fff0f5' },
    slots: [
      { id: 's1', x: 60, y: 60, width: 510, height: 382, radius: 40, fit: 'cover' },
      { id: 's2', x: 630, y: 60, width: 510, height: 382, radius: 40, fit: 'cover' },
      { id: 's3', x: 60, y: 510, width: 510, height: 382, radius: 40, fit: 'cover' },
      { id: 's4', x: 630, y: 510, width: 510, height: 382, radius: 40, fit: 'cover' },
    ],
    texts: [
      {
        id: 't-brand',
        type: 'static',
        value: '♡ MayeBooth ♡',
        x: 600,
        y: 975,
        font: 'Pretendard',
        size: 34,
        color: '#e91e8c',
        align: 'center',
      },
      {
        id: 't-date',
        type: 'date',
        format: 'YYYY.MM.DD',
        x: 600,
        y: 1020,
        font: 'Pretendard',
        size: 24,
        color: '#cc6699',
        align: 'center',
      },
    ],
    stickers: [],
    lut: null,
  },
];

export function seedBuiltinTemplates(db: Database.Database): void {
  for (const template of BUILTIN_TEMPLATES) {
    const existing = db
      .prepare('SELECT id FROM templates WHERE id = ?')
      .get(template.id);
    if (!existing) {
      upsertTemplate(db, template);
      console.log(`  📋 Seeded template: ${template.name}`);
    }
  }
}
