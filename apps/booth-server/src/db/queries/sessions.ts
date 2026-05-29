import Database from 'better-sqlite3';
import type { Session, CapturedPhoto, SessionStatus } from 'shared';

interface SessionRow {
  id: string;
  created_at: number;
  updated_at: number;
  template_id: string | null;
  status: string;
  photo_count: number;
  output_path: string | null;
  output_url: string | null;
  gif_path: string | null;
  qr_code: string | null;
  print_job_id: string | null;
}

interface PhotoRow {
  id: string;
  session_id: string;
  sequence: number;
  raw_path: string;
  processed_path: string | null;
  created_at: number;
}

function rowToSession(row: SessionRow, photos: CapturedPhoto[]): Session {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    templateId: row.template_id,
    status: row.status as SessionStatus,
    photoCount: row.photo_count,
    capturedPhotos: photos,
    outputPath: row.output_path,
    gifPath: row.gif_path,
    qrCode: row.qr_code,
    printJobId: row.print_job_id,
  };
}

function rowToPhoto(row: PhotoRow): CapturedPhoto {
  return {
    id: row.id,
    sessionId: row.session_id,
    sequence: row.sequence,
    rawPath: row.raw_path,
    processedPath: row.processed_path,
    createdAt: row.created_at,
  };
}

export function createSession(db: Database.Database, session: Session): Session {
  db.prepare(`
    INSERT INTO sessions (id, created_at, updated_at, template_id, status, photo_count, output_path, output_url, gif_path, qr_code, print_job_id)
    VALUES (@id, @createdAt, @updatedAt, @templateId, @status, @photoCount, @outputPath, @outputUrl, @gifPath, @qrCode, @printJobId)
  `).run({
    id: session.id,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    templateId: session.templateId,
    status: session.status,
    photoCount: session.photoCount,
    outputPath: session.outputPath,
    outputUrl: null,
    gifPath: session.gifPath,
    qrCode: session.qrCode,
    printJobId: session.printJobId,
  });
  return session;
}

export function getSession(db: Database.Database, id: string): Session | null {
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow | undefined;
  if (!row) return null;
  const photoRows = db
    .prepare('SELECT * FROM photos WHERE session_id = ? ORDER BY sequence ASC')
    .all(id) as PhotoRow[];
  return rowToSession(row, photoRows.map(rowToPhoto));
}

export function updateSession(
  db: Database.Database,
  id: string,
  partial: Partial<Omit<Session, 'id' | 'createdAt' | 'capturedPhotos'>>
): Session | null {
  const now = Date.now();
  const fields: string[] = ['updated_at = @updatedAt'];
  const params: Record<string, unknown> = { id, updatedAt: now };

  if (partial.templateId !== undefined) { fields.push('template_id = @templateId'); params.templateId = partial.templateId; }
  if (partial.status !== undefined) { fields.push('status = @status'); params.status = partial.status; }
  if (partial.photoCount !== undefined) { fields.push('photo_count = @photoCount'); params.photoCount = partial.photoCount; }
  if (partial.outputPath !== undefined) { fields.push('output_path = @outputPath'); params.outputPath = partial.outputPath; }
  if (partial.gifPath !== undefined) { fields.push('gif_path = @gifPath'); params.gifPath = partial.gifPath; }
  if (partial.qrCode !== undefined) { fields.push('qr_code = @qrCode'); params.qrCode = partial.qrCode; }
  if (partial.printJobId !== undefined) { fields.push('print_job_id = @printJobId'); params.printJobId = partial.printJobId; }

  db.prepare(`UPDATE sessions SET ${fields.join(', ')} WHERE id = @id`).run(params);
  return getSession(db, id);
}

export function listSessions(
  db: Database.Database,
  limit = 50,
  offset = 0
): Session[] {
  const rows = db
    .prepare('SELECT * FROM sessions ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(limit, offset) as SessionRow[];

  return rows.map((row) => {
    const photoRows = db
      .prepare('SELECT * FROM photos WHERE session_id = ? ORDER BY sequence ASC')
      .all(row.id) as PhotoRow[];
    return rowToSession(row, photoRows.map(rowToPhoto));
  });
}

export function deleteSession(db: Database.Database, id: string): boolean {
  const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  return result.changes > 0;
}

// ─── Photos ─────────────────────────────────────────────────
export function addPhoto(db: Database.Database, photo: CapturedPhoto): CapturedPhoto {
  db.prepare(`
    INSERT INTO photos (id, session_id, sequence, raw_path, processed_path, created_at)
    VALUES (@id, @sessionId, @sequence, @rawPath, @processedPath, @createdAt)
  `).run({
    id: photo.id,
    sessionId: photo.sessionId,
    sequence: photo.sequence,
    rawPath: photo.rawPath,
    processedPath: photo.processedPath,
    createdAt: photo.createdAt,
  });
  return photo;
}

export function updatePhoto(
  db: Database.Database,
  id: string,
  partial: Partial<Pick<CapturedPhoto, 'processedPath'>>
): void {
  if (partial.processedPath !== undefined) {
    db.prepare('UPDATE photos SET processed_path = ? WHERE id = ?').run(partial.processedPath, id);
  }
}

export function getPhotosForSession(db: Database.Database, sessionId: string): CapturedPhoto[] {
  const rows = db
    .prepare('SELECT * FROM photos WHERE session_id = ? ORDER BY sequence ASC')
    .all(sessionId) as PhotoRow[];
  return rows.map(rowToPhoto);
}
