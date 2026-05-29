import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { listSessions, getSession, deleteSession } from '../db/queries/sessions';
import type { ApiResponse } from 'shared';

export function createGalleryRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/gallery - paginated session gallery
  router.get('/', (req: Request, res: Response) => {
    const page = parseInt(String(req.query.page ?? '1'), 10);
    const pageSize = parseInt(String(req.query.pageSize ?? '20'), 10);
    const offset = (page - 1) * pageSize;

    const sessions = listSessions(db, pageSize, offset);
    const completeSessions = sessions.filter((s) => s.status === 'preview' || s.status === 'complete');

    res.json({
      success: true,
      data: {
        items: completeSessions,
        page,
        pageSize,
        total: completeSessions.length,
      },
    } satisfies ApiResponse);
  });

  return router;
}
