import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { getSettings, updateSettings } from '../db/queries/settings';
import { PrintService } from '../services/print/print-service';
import type { ApiResponse } from 'shared';

const printService = new PrintService();

export function createSettingsRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/settings
  router.get('/', (_req: Request, res: Response) => {
    const settings = getSettings(db);
    res.json({ success: true, data: settings } satisfies ApiResponse);
  });

  // PATCH /api/settings
  router.patch('/', (req: Request, res: Response) => {
    const updated = updateSettings(db, req.body);
    res.json({ success: true, data: updated } satisfies ApiResponse);
  });

  // GET /api/settings/printers - list available printers
  router.get('/printers', async (_req: Request, res: Response) => {
    const printers = await printService.listPrinters();
    res.json({ success: true, data: printers } satisfies ApiResponse);
  });

  return router;
}
