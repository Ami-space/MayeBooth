import Database from 'better-sqlite3';
import type { Template } from 'shared';

interface TemplateRow {
  id: string;
  name: string;
  category: string;
  description: string | null;
  config: string;
  thumbnail: string | null;
  is_builtin: number;
  created_at: number;
  updated_at: number;
}

function rowToTemplate(row: TemplateRow): Template {
  return {
    ...JSON.parse(row.config),
    id: row.id,
    name: row.name,
    category: row.category as Template['category'],
    description: row.description ?? undefined,
    thumbnail: row.thumbnail ?? undefined,
    isBuiltin: Boolean(row.is_builtin),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function upsertTemplate(db: Database.Database, template: Template): Template {
  const now = Date.now();
  db.prepare(`
    INSERT INTO templates (id, name, category, description, config, thumbnail, is_builtin, created_at, updated_at)
    VALUES (@id, @name, @category, @description, @config, @thumbnail, @isBuiltin, @createdAt, @updatedAt)
    ON CONFLICT(id) DO UPDATE SET
      name = @name,
      category = @category,
      description = @description,
      config = @config,
      thumbnail = @thumbnail,
      updated_at = @updatedAt
  `).run({
    id: template.id,
    name: template.name,
    category: template.category,
    description: template.description ?? null,
    config: JSON.stringify(template),
    thumbnail: template.thumbnail ?? null,
    isBuiltin: template.isBuiltin ? 1 : 0,
    createdAt: template.createdAt ?? now,
    updatedAt: now,
  });
  return getTemplate(db, template.id)!;
}

export function getTemplate(db: Database.Database, id: string): Template | null {
  const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as TemplateRow | undefined;
  return row ? rowToTemplate(row) : null;
}

export function listTemplates(db: Database.Database, category?: string): Template[] {
  const rows = (
    category
      ? db.prepare('SELECT * FROM templates WHERE category = ? ORDER BY is_builtin DESC, created_at DESC').all(category)
      : db.prepare('SELECT * FROM templates ORDER BY is_builtin DESC, created_at DESC').all()
  ) as TemplateRow[];
  return rows.map(rowToTemplate);
}

export function deleteTemplate(db: Database.Database, id: string): boolean {
  const row = db.prepare('SELECT is_builtin FROM templates WHERE id = ?').get(id) as
    | { is_builtin: number }
    | undefined;
  if (!row || row.is_builtin) return false; // Cannot delete built-in templates
  const result = db.prepare('DELETE FROM templates WHERE id = ?').run(id);
  return result.changes > 0;
}
