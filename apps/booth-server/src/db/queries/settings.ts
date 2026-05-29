import Database from 'better-sqlite3';
import type { BoothSettings, PrintSize } from 'shared';
import path from 'path';
import os from 'os';

const DEFAULT_SETTINGS: BoothSettings = {
  watchFolder: path.join(os.homedir(), 'Pictures', 'MayeBooth-Watch'),
  cameraMode: 'watch_folder',
  photoCount: 4,
  countdownSeconds: 3,
  intervalBetweenShots: 2000,
  autoPrint: false,
  defaultPrinter: '',
  printCopies: 1,
  defaultPrintSize: '4x6' as PrintSize,
  brandName: 'MayeBooth',
  boothMode: true,
  kioskMode: false,
  language: 'zh',
  storagePath: path.resolve(process.cwd(), '../../storage'),
  maxStorageDays: 30,
  qrExpireMinutes: 60,
  serverHost: '0.0.0.0',
  serverPort: 4000,
};

export function initializeDefaultSettings(db: Database.Database): void {
  const upsert = db.prepare(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`
  );
  upsert.run('booth', JSON.stringify(DEFAULT_SETTINGS));
}

export function getSettings(db: Database.Database): BoothSettings {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('booth') as
    | { value: string }
    | undefined;
  if (!row) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...JSON.parse(row.value) } as BoothSettings;
}

export function updateSettings(
  db: Database.Database,
  partial: Partial<BoothSettings>
): BoothSettings {
  const current = getSettings(db);
  const updated = { ...current, ...partial };
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    .run('booth', JSON.stringify(updated));
  return updated;
}
