import { Server } from 'socket.io';
import Database from 'better-sqlite3';
import type { ServerToClientEvents, ClientToServerEvents } from 'shared';
import { SessionService } from '../services/session/session-service';
import { CameraEngine } from '../services/camera/camera-engine';
import { PrintService } from '../services/print/print-service';
import { getSettings, updateSettings } from '../db/queries/settings';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;

// Shared service instances (singleton for the server lifetime)
let sessionService: SessionService | null = null;
let cameraEngine: CameraEngine | null = null;

export function registerSocketServices(
  _io: IO,
  camera: CameraEngine,
  session: SessionService
): void {
  cameraEngine = camera;
  sessionService = session;
}

export function setupSocketHandlers(io: IO, db: Database.Database): void {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Send current state on connect
    const settings = getSettings(db);
    socket.emit('settings:update', settings);

    if (cameraEngine) {
      socket.emit('camera:status', cameraEngine.getStatus());
    }

    // ── Session Events ────────────────────────────────────────────
    socket.on('session:create', async ({ templateId }) => {
      if (!sessionService) {
        socket.emit('error', { code: 'NOT_READY', message: 'Server not ready' });
        return;
      }
      try {
        await sessionService.createAndStartSession(templateId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        socket.emit('error', { code: 'SESSION_CREATE_ERROR', message });
      }
    });

    socket.on('session:cancel', async (sessionId: string) => {
      if (!sessionService) return;
      try {
        await sessionService.cancelSession(sessionId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        socket.emit('error', { code: 'SESSION_CANCEL_ERROR', message });
      }
    });

    // ── Print Events ──────────────────────────────────────────────
    socket.on('print:request', async ({ sessionId, copies, size }) => {
      const printService = new PrintService();
      const { getSession } = await import('../db/queries/sessions');
      const session = getSession(db, sessionId);

      if (!session?.outputPath) {
        socket.emit('error', { code: 'PRINT_ERROR', message: 'No output file for session' });
        return;
      }

      const settings = getSettings(db);
      try {
        await printService.print(session.outputPath, settings.defaultPrinter, {
          copies: copies ?? settings.printCopies,
          size: size ?? settings.defaultPrintSize,
        });
        socket.emit('print:status', {
          id: '',
          sessionId,
          printer: settings.defaultPrinter,
          printerType: 'epson',
          status: 'done',
          copies: copies ?? settings.printCopies,
          size: size ?? settings.defaultPrintSize,
          filePath: session.outputPath,
          createdAt: Date.now(),
          completedAt: Date.now(),
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        socket.emit('error', { code: 'PRINT_ERROR', message });
      }
    });

    // ── Settings Events ───────────────────────────────────────────
    socket.on('settings:get', () => {
      const settings = getSettings(db);
      socket.emit('settings:update', settings);
    });

    socket.on('settings:update', (partial) => {
      const updated = updateSettings(db, partial);
      io.emit('settings:update', updated); // broadcast to all clients

      // Update camera watch folder if changed
      if (partial.watchFolder && cameraEngine) {
        cameraEngine.updateWatchFolder(partial.watchFolder);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}
