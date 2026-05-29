import { Router, Request, Response } from 'express';
import Database from 'better-sqlite3';
import { listTemplates, getTemplate, upsertTemplate, deleteTemplate } from '../db/queries/templates';
import type { ApiResponse, Template } from 'shared';
import { v4 as uuidv4 } from 'uuid';

export function createTemplatesRouter(db: Database.Database): Router {
  const router = Router();

  // GET /api/templates
  router.get('/', (req: Request, res: Response) => {
    const { category } = req.query;
    const templates = listTemplates(db, category as string | undefined);
    res.json({ success: true, data: templates } satisfies ApiResponse);
  });

  // GET /api/templates/:id
  router.get('/:id', (req: Request, res: Response) => {
    const id = String(req.params['id'] ?? '');
    const template = getTemplate(db, id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, data: template } satisfies ApiResponse);
  });

  // POST /api/templates
  router.post('/', (req: Request, res: Response) => {
    const body = req.body as Partial<Template>;
    if (!body.name || !body.size || !body.slots) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const template: Template = {
      id: body.id ?? uuidv4(),
      name: body.name,
      category: body.category ?? 'custom',
      description: body.description,
      size: body.size,
      background: body.background,
      overlay: body.overlay,
      slots: body.slots,
      texts: body.texts ?? [],
      stickers: body.stickers ?? [],
      qrPlaceholder: body.qrPlaceholder,
      lut: body.lut ?? null,
      photoCount: body.photoCount ?? body.slots.length,
      isBuiltin: false,
      thumbnail: body.thumbnail,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const saved = upsertTemplate(db, template);
    res.status(201).json({ success: true, data: saved } satisfies ApiResponse);
  });

  // PUT /api/templates/:id
  router.put('/:id', (req: Request, res: Response) => {
    const id = String(req.params['id'] ?? '');
    const existing = getTemplate(db, id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    if (existing.isBuiltin) {
      return res.status(403).json({ success: false, error: 'Cannot modify built-in templates' });
    }

    const updated = upsertTemplate(db, { ...existing, ...req.body, id });
    res.json({ success: true, data: updated } satisfies ApiResponse);
  });

  // DELETE /api/templates/:id
  router.delete('/:id', (req: Request, res: Response) => {
    const id = String(req.params['id'] ?? '');
    const deleted = deleteTemplate(db, id);
    if (!deleted) {
      return res.status(400).json({ success: false, error: 'Cannot delete template' });
    }
    res.json({ success: true, message: 'Template deleted' } satisfies ApiResponse);
  });

  return router;
}
