import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import type {
  Session,
  CapturedPhoto,
  ServerToClientEvents,
  ClientToServerEvents,
  BoothSettings,
} from 'shared';
import {
  createSession,
  getSession,
  updateSession,
  addPhoto,
  getPhotosForSession,
} from '../../db/queries/sessions';
import { getTemplate } from '../../db/queries/templates';
import { getSettings } from '../../db/queries/settings';
import { CameraEngine } from '../camera/camera-engine';
import { ImageService } from '../image/image-service';
import { TemplateRenderer } from '../template/template-renderer';
import { QRService } from '../qr/qr-service';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;

export class SessionService {
  private io: IO;
  private db: Database.Database;
  private cameraEngine: CameraEngine;
  private imageService: ImageService;
  private templateRenderer: TemplateRenderer;
  private qrService: QRService;
  private activeSessionId: string | null = null;

  constructor(io: IO, db: Database.Database, cameraEngine: CameraEngine) {
    this.io = io;
    this.db = db;
    this.cameraEngine = cameraEngine;
    this.imageService = new ImageService();
    this.templateRenderer = new TemplateRenderer();
    this.qrService = new QRService();
  }

  getActiveSession(): Session | null {
    if (!this.activeSessionId) return null;
    return getSession(this.db, this.activeSessionId);
  }

  async createAndStartSession(templateId: string): Promise<Session> {
    const settings = getSettings(this.db);
    const template = getTemplate(this.db, templateId);

    if (!template) throw new Error(`Template not found: ${templateId}`);
    if (this.activeSessionId) {
      // Cancel existing active session
      await this.cancelSession(this.activeSessionId);
    }

    const sessionId = uuidv4();
    const now = Date.now();

    const session: Session = {
      id: sessionId,
      createdAt: now,
      updatedAt: now,
      templateId,
      status: 'countdown',
      photoCount: 0,
      capturedPhotos: [],
      outputPath: null,
      gifPath: null,
      qrCode: null,
      printJobId: null,
    };

    createSession(this.db, session);
    this.activeSessionId = sessionId;

    // Create session directory
    const sessionDir = path.join(settings.storagePath, 'sessions', sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    this.emitSession(session);
    console.log(`🎬 Session started: ${sessionId} (template: ${template.name})`);

    // Start the capture flow
    this.runCaptureFlow(session, template, settings).catch((err) => {
      console.error('Capture flow error:', err);
      this.failSession(sessionId, err.message);
    });

    return session;
  }

  private async runCaptureFlow(
    session: Session,
    template: { photoCount: number; id: string; name: string },
    settings: BoothSettings
  ): Promise<void> {
    const photoPaths: string[] = [];

    for (let i = 1; i <= template.photoCount; i++) {
      // 1. Countdown
      await this.runCountdown(session.id, settings.countdownSeconds);

      // 2. Wait for capture (Sony drops file into watch folder)
      console.log(`📷 Waiting for photo ${i}/${template.photoCount}...`);
      const rawPath = await this.cameraEngine.waitForNextCapture(session.id, 30_000);

      // 3. Copy & archive photo to session directory
      const sessionDir = path.join(settings.storagePath, 'sessions', session.id);
      const destPath = path.join(sessionDir, `photo-${i}${path.extname(rawPath)}`);
      fs.copyFileSync(rawPath, destPath);

      // 4. Register photo in DB
      const photo: CapturedPhoto = {
        id: uuidv4(),
        sessionId: session.id,
        sequence: i,
        rawPath: destPath,
        processedPath: null,
        createdAt: Date.now(),
      };
      addPhoto(this.db, photo);
      photoPaths.push(destPath);

      // 5. Update session
      const updated = updateSession(this.db, session.id, {
        photoCount: i,
        status: i < template.photoCount ? 'capturing' : 'processing',
      })!;
      this.emitSession(updated);

      // Flash effect
      this.io.emit('camera:flash');
      this.io.emit('photo:processed', photo);

      // 6. Wait between shots (except last)
      if (i < template.photoCount) {
        await sleep(settings.intervalBetweenShots);
      }
    }

    // 7. Render template
    console.log('🎨 Rendering template...');
    const currentSession = getSession(this.db, session.id)!;
    const templateDef = getTemplate(this.db, currentSession.templateId!)!;

    const outputDir = path.join(settings.storagePath, 'exports');
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${session.id}.jpg`);

    await this.templateRenderer.render(templateDef, photoPaths, outputPath);
    console.log(`✅ Template rendered: ${outputPath}`);

    // 8. Generate QR code
    const host = settings.serverHost === '0.0.0.0' ? 'localhost' : settings.serverHost;
    const downloadUrl = `http://${host}:${settings.serverPort}/api/sessions/${session.id}/download`;
    const qrDataUrl = await this.qrService.generateQRDataUrl(downloadUrl);

    // 9. Finalize session
    const finalSession = updateSession(this.db, session.id, {
      status: 'preview',
      outputPath,
      qrCode: qrDataUrl,
    })!;
    this.activeSessionId = null;
    this.emitSession(finalSession);
    this.io.emit('template:rendered', {
      sessionId: session.id,
      outputPath,
      outputUrl: `/api/sessions/${session.id}/output`,
    });

    console.log(`🎉 Session complete: ${session.id}`);
  }

  private async runCountdown(sessionId: string, seconds: number): Promise<void> {
    for (let remaining = seconds; remaining > 0; remaining--) {
      this.io.emit('camera:countdown', { remaining, total: seconds });
      await sleep(1000);
    }
    this.io.emit('camera:countdown', { remaining: 0, total: seconds });
    await sleep(200); // brief pause at 0
  }

  async cancelSession(sessionId: string): Promise<void> {
    this.cameraEngine.cancelPendingCapture();
    updateSession(this.db, sessionId, { status: 'idle' });
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }
  }

  private failSession(sessionId: string, error: string): void {
    console.error(`❌ Session ${sessionId} failed: ${error}`);
    updateSession(this.db, sessionId, { status: 'error' });
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }
    this.io.emit('error', { code: 'SESSION_ERROR', message: error });
  }

  private emitSession(session: Session): void {
    this.io.emit('session:update', session);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
