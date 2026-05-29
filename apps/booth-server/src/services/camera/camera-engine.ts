import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import fs from 'fs';
import { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, CameraState } from 'shared';
import { SessionService } from '../session/session-service';

type IO = Server<ClientToServerEvents, ServerToClientEvents>;

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.heic']);
const IGNORE_PATTERNS = [/\.DS_Store/, /Thumbs\.db/, /\.tmp$/];

export class CameraEngine {
  private io: IO;
  private watchFolder: string;
  private watcher: FSWatcher | null = null;
  private processedFiles = new Set<string>();
  private status: CameraState['status'] = 'disconnected';
  private sessionService: SessionService | null = null;
  private pendingCapture: { sessionId: string; resolve: (path: string) => void } | null = null;
  private captureTimeout: NodeJS.Timeout | null = null;
  // Buffer for frames that arrive before waitForNextCapture is called
  private frameBuffer: Map<string, string> = new Map(); // sessionId → filePath

  constructor(io: IO, watchFolder: string) {
    this.io = io;
    this.watchFolder = watchFolder;
  }

  setSessionService(service: SessionService): void {
    this.sessionService = service;
  }

  async start(): Promise<void> {
    // Ensure watch folder exists
    if (!fs.existsSync(this.watchFolder)) {
      fs.mkdirSync(this.watchFolder, { recursive: true });
      console.log(`📁 Created watch folder: ${this.watchFolder}`);
    }

    this.watcher = chokidar.watch(this.watchFolder, {
      persistent: true,
      ignoreInitial: true,   // ignore files already in folder on start
      awaitWriteFinish: {
        stabilityThreshold: 500,   // wait 500ms of no change before emitting
        pollInterval: 100,
      },
      depth: 0,              // only watch top level
    });

    this.watcher
      .on('add', (filePath) => this.handleNewFile(filePath))
      .on('error', (err) => {
        console.error('Camera watcher error:', err);
        this.setStatus('error');
      })
      .on('ready', () => {
        this.setStatus('connected');
        console.log('📷 Camera watch folder ready');
      });
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.captureTimeout) {
      clearTimeout(this.captureTimeout);
      this.captureTimeout = null;
    }
    this.setStatus('disconnected');
  }

  updateWatchFolder(newFolder: string): void {
    this.watchFolder = newFolder;
    if (this.watcher) {
      this.stop();
      this.start();
    }
  }

  getStatus(): CameraState {
    return {
      status: this.status,
      watchFolder: this.watchFolder,
    };
  }

  /**
   * Wait for the next photo to appear in the watch folder.
   * Resolves with the file path when a new image is detected.
   */
  waitForNextCapture(sessionId: string, timeoutMs = 60_000): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check if a frame was already buffered (race condition: client sent frame before we started waiting)
      if (this.frameBuffer.has(sessionId)) {
        const bufferedPath = this.frameBuffer.get(sessionId)!;
        this.frameBuffer.delete(sessionId);
        console.log(`📸 Using buffered webcam frame for session ${sessionId}`);
        this.setStatus('connected');
        resolve(bufferedPath);
        return;
      }

      if (this.pendingCapture) {
        reject(new Error('Another capture is already pending'));
        return;
      }

      this.pendingCapture = { sessionId, resolve };
      this.setStatus('capturing');

      this.captureTimeout = setTimeout(() => {
        this.pendingCapture = null;
        this.frameBuffer.delete(sessionId);
        this.setStatus('connected');
        reject(new Error(`Capture timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  cancelPendingCapture(): void {
    if (this.captureTimeout) {
      clearTimeout(this.captureTimeout);
      this.captureTimeout = null;
    }
    this.pendingCapture = null;
    this.setStatus('connected');
  }

  /**
   * Inject a webcam frame directly (bypasses watch folder).
   * Called when client sends camera:capture_frame event.
   */
  injectFrame(sessionId: string, imageBase64: string, mimeType: string): void {
    // Save base64 image to a file in the watch folder
    const ext = mimeType.includes('png') ? '.png' : '.jpg';
    const filename = `webcam-${Date.now()}${ext}`;
    const filePath = path.join(this.watchFolder, filename);

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    // Mark as processed so chokidar doesn't double-trigger
    this.processedFiles.add(filePath);
    console.log(`📸 Webcam frame saved: ${filename}`);

    if (this.pendingCapture && this.pendingCapture.sessionId === sessionId) {
      // waitForNextCapture is already waiting — resolve immediately
      const { resolve } = this.pendingCapture;
      this.pendingCapture = null;
      if (this.captureTimeout) {
        clearTimeout(this.captureTimeout);
        this.captureTimeout = null;
      }
      this.setStatus('connected');
      this.io.emit('camera:flash');
      this.io.emit('camera:captured', {
        id: '', sessionId, sequence: 0,
        rawPath: filePath, processedPath: null, createdAt: Date.now(),
      });
      resolve(filePath);
    } else {
      // waitForNextCapture hasn't been called yet — buffer the path
      console.log(`🕐 Buffering frame for session ${sessionId} (waitForNextCapture not ready yet)`);
      this.frameBuffer.set(sessionId, filePath);
      this.io.emit('camera:flash');
    }
  }
  private async handleNewFile(filePath: string): Promise<void> {
    const ext = path.extname(filePath).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(ext)) return;
    if (IGNORE_PATTERNS.some((p) => p.test(filePath))) return;
    if (this.processedFiles.has(filePath)) return;

    this.processedFiles.add(filePath);
    console.log(`📸 New image detected: ${path.basename(filePath)}`);

    // Notify all clients
    this.io.emit('camera:captured', {
      id: '',
      sessionId: this.pendingCapture?.sessionId ?? '',
      sequence: 0,
      rawPath: filePath,
      processedPath: null,
      createdAt: Date.now(),
    });

    // Resolve pending capture
    if (this.pendingCapture) {
      const { resolve } = this.pendingCapture;
      this.pendingCapture = null;
      if (this.captureTimeout) {
        clearTimeout(this.captureTimeout);
        this.captureTimeout = null;
      }
      this.setStatus('connected');
      resolve(filePath);
    }

    // Cleanup old entries (prevent memory leak over long sessions)
    if (this.processedFiles.size > 1000) {
      const arr = Array.from(this.processedFiles);
      arr.slice(0, 500).forEach((f) => this.processedFiles.delete(f));
    }
  }

  private setStatus(status: CameraState['status']): void {
    this.status = status;
    this.io.emit('camera:status', {
      status,
      watchFolder: this.watchFolder,
    });
  }
}
