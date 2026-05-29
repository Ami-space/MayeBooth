import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export class ImageService {
  /**
   * Resize and optimize a photo for booth display (web-friendly).
   */
  async processForDisplay(inputPath: string, outputPath: string): Promise<string> {
    await sharp(inputPath)
      .resize(1920, 1440, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    return outputPath;
  }

  /**
   * Crop a photo to fit a specific slot (cover mode).
   */
  async cropToSlot(
    inputPath: string,
    targetWidth: number,
    targetHeight: number
  ): Promise<Buffer> {
    return sharp(inputPath)
      .resize(targetWidth, targetHeight, { fit: 'cover', position: 'centre' })
      .toBuffer();
  }

  /**
   * Get image metadata.
   */
  async getMetadata(filePath: string): Promise<sharp.Metadata> {
    return sharp(filePath).metadata();
  }

  /**
   * Mirror (flip horizontal) for selfie-style display.
   */
  async mirrorHorizontal(inputPath: string, outputPath: string): Promise<string> {
    await sharp(inputPath).flop().toFile(outputPath);
    return outputPath;
  }

  /**
   * Generate a thumbnail for UI preview.
   */
  async generateThumbnail(
    inputPath: string,
    outputPath: string,
    size = 300
  ): Promise<string> {
    await sharp(inputPath)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 70 })
      .toFile(outputPath);
    return outputPath;
  }
}
