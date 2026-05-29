import sharp from 'sharp';
import { createCanvas, loadImage, GlobalFonts, SKRSContext2D } from '@napi-rs/canvas';
import type { Template, TemplateSlot, TemplateText } from 'shared';
import path from 'path';
import fs from 'fs';
import { format as formatDate } from './date-formatter';

const ASSETS_PATH = path.resolve(process.cwd(), '../../assets');
const FONTS_PATH = path.join(ASSETS_PATH, 'fonts');

let fontsRegistered = false;

function ensureFonts(): void {
  if (fontsRegistered) return;
  const fontFiles = [
    { file: 'Pretendard-Regular.ttf', family: 'Pretendard' },
    { file: 'Pretendard-Bold.ttf', family: 'Pretendard' },
    { file: 'Pretendard-Medium.ttf', family: 'Pretendard' },
  ];
  for (const { file, family } of fontFiles) {
    const fontPath = path.join(FONTS_PATH, file);
    if (fs.existsSync(fontPath)) {
      GlobalFonts.registerFromPath(fontPath, family);
    }
  }
  fontsRegistered = true;
}

export class TemplateRenderer {
  async render(
    template: Template,
    photoPaths: string[],
    outputPath: string
  ): Promise<string> {
    ensureFonts();

    const { width, height } = template.size;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Background
    if (template.background?.image) {
      const bgPath = path.join(ASSETS_PATH, template.background.image);
      if (fs.existsSync(bgPath)) {
        const bgImage = await loadImage(bgPath);
        ctx.drawImage(bgImage, 0, 0, width, height);
      } else {
        ctx.fillStyle = template.background?.color ?? '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      ctx.fillStyle = template.background?.color ?? '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Photo slots
    for (let i = 0; i < template.slots.length; i++) {
      const slot = template.slots[i];
      const photoPath = photoPaths[i];

      if (!photoPath || !fs.existsSync(photoPath)) continue;

      try {
        await this.drawPhotoSlot(ctx, slot, photoPath);
      } catch (err) {
        console.error(`Failed to draw slot ${slot.id}:`, err);
        // Draw placeholder
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
      }
    }

    // 3. Overlay (PNG on top of photos, under texts)
    if (template.overlay?.src) {
      const overlayPath = path.join(ASSETS_PATH, template.overlay.src);
      if (fs.existsSync(overlayPath)) {
        const overlayImg = await loadImage(overlayPath);
        ctx.globalAlpha = template.overlay.opacity ?? 1;
        ctx.drawImage(overlayImg, 0, 0, width, height);
        ctx.globalAlpha = 1;
      }
    }

    // 4. Stickers
    for (const sticker of template.stickers) {
      const stickerPath = path.join(ASSETS_PATH, 'stickers', sticker.src);
      if (!fs.existsSync(stickerPath)) continue;
      try {
        const img = await loadImage(stickerPath);
        ctx.save();
        ctx.globalAlpha = sticker.opacity ?? 1;
        if (sticker.rotation) {
          const cx = sticker.x + sticker.width / 2;
          const cy = sticker.y + sticker.height / 2;
          ctx.translate(cx, cy);
          ctx.rotate((sticker.rotation * Math.PI) / 180);
          ctx.translate(-cx, -cy);
        }
        ctx.drawImage(img, sticker.x, sticker.y, sticker.width, sticker.height);
        ctx.restore();
      } catch {
        // skip missing stickers
      }
    }

    // 5. Texts
    for (const text of template.texts) {
      this.drawText(ctx, text);
    }

    // 6. Export as JPEG via sharp (higher quality than canvas)
    const pngBuffer = canvas.toBuffer('image/png');
    await sharp(pngBuffer)
      .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
      .toFile(outputPath);

    return outputPath;
  }

  private async drawPhotoSlot(
    ctx: SKRSContext2D,
    slot: TemplateSlot,
    photoPath: string
  ): Promise<void> {
    const { x, y, width, height, radius = 0, fit = 'cover', border } = slot;

    // Process photo with sharp (resize/crop to fit slot)
    const processedBuffer = await sharp(photoPath)
      .resize(width, height, {
        fit: fit === 'cover' ? 'cover' : fit === 'contain' ? 'contain' : 'fill',
        position: 'centre',
      })
      .toBuffer();

    const img = await loadImage(processedBuffer);

    // Clip to rounded rect
    ctx.save();
    if (radius > 0) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.arcTo(x + width, y, x + width, y + radius, radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
      ctx.lineTo(x + radius, y + height);
      ctx.arcTo(x, y + height, x, y + height - radius, radius);
      ctx.lineTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.closePath();
      ctx.clip();
    }

    ctx.drawImage(img, x, y, width, height);
    ctx.restore();

    // Border
    if (border) {
      ctx.save();
      ctx.strokeStyle = border.color;
      ctx.lineWidth = border.width;
      if (radius > 0) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, width, height);
      }
      ctx.restore();
    }
  }

  private drawText(ctx: SKRSContext2D, text: TemplateText): void {
    const {
      type,
      value,
      format,
      x,
      y,
      font = 'Pretendard',
      size = 28,
      color = '#333333',
      align = 'center',
      rotation = 0,
      opacity = 1,
    } = text;

    let content = '';
    if (type === 'static') {
      content = value ?? '';
    } else if (type === 'date') {
      content = formatDate(new Date(), format ?? 'YYYY.MM.DD');
    } else if (type === 'time') {
      content = formatDate(new Date(), format ?? 'HH:mm');
    } else if (type === 'datetime') {
      content = formatDate(new Date(), format ?? 'YYYY.MM.DD HH:mm');
    }

    if (!content) return;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = `${size}px "${font}", sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align as 'left' | 'right' | 'center' | 'start' | 'end';
    ctx.textBaseline = 'middle';

    if (rotation !== 0) {
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillText(content, 0, 0);
    } else {
      ctx.fillText(content, x, y);
    }

    ctx.restore();
  }
}
