import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';

import { initializeDatabase } from './db/database';
import { initializeDefaultSettings } from './db/queries/settings';
import { seedBuiltinTemplates } from './db/seed/templates';
import { registerRoutes } from './routes';
import { setupSocketHandlers, registerSocketServices } from './socket';
import { CameraEngine } from './services/camera/camera-engine';
import { SessionService } from './services/session/session-service';
import { ensureDirectories } from './utils/fs';
import { getSettings } from './db/queries/settings';
import type { ServerToClientEvents, ClientToServerEvents } from 'shared';

// ─── Bootstrap ───────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '4000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

async function bootstrap() {
  console.log('🎬 MayeBooth Server starting...');

  // 1. Ensure runtime directories exist
  await ensureDirectories();

  // 2. Initialize SQLite database
  const db = initializeDatabase();
  console.log('✅ Database initialized');

  // 3. Seed default settings and built-in templates
  initializeDefaultSettings(db);
  seedBuiltinTemplates(db);
  console.log('✅ Templates and settings seeded');

  // 4. Create Express app
  const app = express();
  app.use(helmet({ contentSecurityPolicy: false })); // disable CSP for local dev
  app.use(cors({ origin: '*' }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));

  // 5. Serve static files (photos, exports, etc.)
  const storagePath = path.resolve(process.cwd(), '../../storage');
  app.use('/storage', express.static(storagePath));

  const assetsPath = path.resolve(process.cwd(), '../../assets');
  app.use('/assets', express.static(assetsPath));

  // 6. Register API routes
  registerRoutes(app, db);

  // 7. Create HTTP server
  const httpServer = createServer(app);

  // 8. Setup Socket.IO
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: '*' },
    transports: ['websocket', 'polling'],
  });

  setupSocketHandlers(io, db);

  // 9. Start Camera Engine (Watch Folder)
  const settings = getSettings(db);
  const cameraEngine = new CameraEngine(io, settings.watchFolder);
  await cameraEngine.start();
  console.log(`📷 Camera Engine watching: ${settings.watchFolder}`);

  // Register services with socket handler
  const sessionService = new SessionService(io, db, cameraEngine);
  registerSocketServices(io, cameraEngine, sessionService);
  console.log('✅ Session service registered');

  // 10. Start HTTP server
  httpServer.listen(PORT, HOST, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║        🎉 MayeBooth Server Ready         ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  API:    http://localhost:${PORT}            ║`);
    console.log(`║  Socket: ws://localhost:${PORT}              ║`);
    console.log('║  iPad:   Open in Safari → Add to Home   ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
  });

  // 11. Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down MayeBooth Server...');
    cameraEngine.stop();
    db.close();
    httpServer.close(() => process.exit(0));
  });
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start MayeBooth Server:', err);
  process.exit(1);
});
