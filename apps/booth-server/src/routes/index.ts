import { Router } from 'express';
import type { Application } from 'express';
import Database from 'better-sqlite3';

import { createSessionsRouter } from './sessions';
import { createTemplatesRouter } from './templates';
import { createSettingsRouter } from './settings';
import { createGalleryRouter } from './gallery';

export function registerRoutes(app: Application, db: Database.Database): void {
  const api = Router();

  // Health check
  api.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'MayeBooth',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  api.use('/sessions', createSessionsRouter(db));
  api.use('/templates', createTemplatesRouter(db));
  api.use('/settings', createSettingsRouter(db));
  api.use('/gallery', createGalleryRouter(db));

  app.use('/api', api);
}
