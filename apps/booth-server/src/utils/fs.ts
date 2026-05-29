import path from 'path';
import fs from 'fs';

const ROOT = path.resolve(process.cwd(), '../../');

const DIRECTORIES = [
  'storage',
  'storage/sessions',
  'storage/exports',
  'storage/prints',
  'storage/gifs',
  'assets',
  'assets/templates',
  'assets/overlays',
  'assets/stickers',
  'assets/fonts',
  'assets/sounds',
  'assets/luts',
].map((d) => path.join(ROOT, d));

export async function ensureDirectories(): Promise<void> {
  for (const dir of DIRECTORIES) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  📁 Created: ${path.relative(ROOT, dir)}`);
    }
  }
}
