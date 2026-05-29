import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import type { PrintSize } from 'shared';

const execFileAsync = promisify(execFile);

// macOS paper size mappings for lp command
const PAPER_SIZES: Record<PrintSize, string> = {
  '4x6': '4x6',
  '2x6': 'Custom.2x6in',
  'square': 'Custom.4x4in',
  'a4': 'A4',
  'custom': '4x6',
};

export class PrintService {
  async print(
    filePath: string,
    printerName: string,
    options: {
      copies?: number;
      size?: PrintSize;
      fitToPage?: boolean;
    } = {}
  ): Promise<void> {
    const { copies = 1, size = '4x6', fitToPage = true } = options;
    const mediaSize = PAPER_SIZES[size] ?? '4x6';

    const args = [
      '-d', printerName,
      '-o', `media=${mediaSize}`,
      '-n', String(copies),
    ];

    if (fitToPage) {
      args.push('-o', 'fit-to-page');
    }

    args.push(filePath);

    try {
      await execFileAsync('lp', args);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Print failed: ${message}`);
    }
  }

  async listPrinters(): Promise<string[]> {
    try {
      const { stdout } = await execFileAsync('lpstat', ['-p', '-h', 'localhost']);
      const lines = stdout.split('\n');
      const printers: string[] = [];
      for (const line of lines) {
        const match = line.match(/^printer (\S+)/);
        if (match) printers.push(match[1]);
      }
      return printers;
    } catch {
      return [];
    }
  }

  async getQueueStatus(printerName: string): Promise<string> {
    try {
      const { stdout } = await execFileAsync('lpq', ['-P', printerName]);
      return stdout;
    } catch {
      return 'Printer unavailable';
    }
  }

  /**
   * Export Instax-sized image (62x46mm at 300dpi = 731x543px)
   * User will manually send this to the Instax Mini Link 2 app.
   */
  getInstaxOutputSize(): { width: number; height: number } {
    // Instax Mini film: 62mm wide × 46mm tall image area at 300 DPI
    return { width: 731, height: 543 };
  }
}
