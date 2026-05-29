import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface GifOptions {
  fps?: number;           // default 10
  width?: number;         // default 800
  loop?: boolean;         // default true
  boomerang?: boolean;    // default false (plays forward then reverse)
  quality?: number;       // 1-100, default 80
}

export class GifService {
  /**
   * Generate a GIF from a series of photos using ffmpeg.
   * ffmpeg must be available in PATH (brew install ffmpeg on macOS).
   */
  async generateGif(
    photoPaths: string[],
    outputPath: string,
    options: GifOptions = {}
  ): Promise<string> {
    const {
      fps = 8,
      width = 800,
      loop = true,
      boomerang = false,
      quality = 80,
    } = options;

    const tmpDir = path.dirname(outputPath);
    fs.mkdirSync(tmpDir, { recursive: true });

    // Build inputs list for ffmpeg
    const frameDir = path.join(tmpDir, `frames-${Date.now()}`);
    fs.mkdirSync(frameDir, { recursive: true });

    // Copy frames (optionally add reverse for boomerang)
    const frames = boomerang
      ? [...photoPaths, ...[...photoPaths].reverse()]
      : photoPaths;

    frames.forEach((src, i) => {
      const dest = path.join(frameDir, `frame-${String(i).padStart(4, '0')}.jpg`);
      fs.copyFileSync(src, dest);
    });

    // ffmpeg palette + gif pipeline
    const paletteFile = path.join(tmpDir, `palette-${Date.now()}.png`);
    const framePattern = path.join(frameDir, 'frame-%04d.jpg');
    const loopFlag = loop ? '0' : '-1'; // 0 = loop forever, -1 = no loop

    // Step 1: generate palette
    await execFileAsync('ffmpeg', [
      '-y',
      '-framerate', String(fps),
      '-i', framePattern,
      '-vf', `scale=${width}:-1:flags=lanczos,palettegen=max_colors=256`,
      paletteFile,
    ]);

    // Step 2: generate GIF with palette
    await execFileAsync('ffmpeg', [
      '-y',
      '-framerate', String(fps),
      '-i', framePattern,
      '-i', paletteFile,
      '-lavfi', `scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5`,
      '-loop', loopFlag,
      outputPath,
    ]);

    // Cleanup temp files
    fs.rmSync(frameDir, { recursive: true, force: true });
    fs.rmSync(paletteFile, { force: true });

    return outputPath;
  }

  /**
   * Check if ffmpeg is available.
   */
  async isAvailable(): Promise<boolean> {
    try {
      await execFileAsync('ffmpeg', ['-version']);
      return true;
    } catch {
      return false;
    }
  }
}
