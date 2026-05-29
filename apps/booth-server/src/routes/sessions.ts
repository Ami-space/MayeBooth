import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { getSession, listSessions, deleteSession } from '../db/queries/sessions';
import type { ApiResponse } from 'shared';

export function createSessionsRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/sessions
  router.get('/', (_req: Request, res: Response) => {
    const sessions = listSessions(db, 50, 0);
    res.json({ success: true, data: sessions } satisfies ApiResponse);
  });

  // GET /api/sessions/:id
  router.get('/:id', (req: Request, res: Response) => {
    const id = String(req.params['id'] ?? '');
    const session = getSession(db, id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, data: session } satisfies ApiResponse);
  });

  // GET /api/sessions/:id/output — serve rendered composite image
  router.get('/:id/output', (req: Request, res: Response) => {
    const id = String(req.params['id'] ?? '');
    const session = getSession(db, id);
    if (!session?.outputPath) {
      return res.status(404).json({ success: false, error: 'Output not found' });
    }
    if (!fs.existsSync(session.outputPath)) {
      return res.status(404).json({ success: false, error: 'Output file missing' });
    }
    res.sendFile(path.resolve(session.outputPath));
  });

  // GET /api/sessions/:id/download — mobile download (QR target)
  router.get('/:id/download', (req: Request, res: Response) => {
    const id = String(req.params['id'] ?? '');
    const session = getSession(db, id);
    if (!session?.outputPath || !fs.existsSync(session.outputPath)) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"><title>Not Found</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:40px">
          <h1>🙈 照片已过期或不存在</h1>
          <p>请重新扫码或联系工作人员</p>
        </body></html>
      `);
    }

    const filename = `mayebooth-${session.id.slice(0, 8)}.jpg`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(path.resolve(session.outputPath));
  });

  // DELETE /api/sessions/:id
  router.delete('/:id', (req: Request, res: Response) => {
    const id = String(req.params['id'] ?? '');
    const deleted = deleteSession(db, id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({ success: true, message: 'Session deleted' } satisfies ApiResponse);
  });

  return router;
}
