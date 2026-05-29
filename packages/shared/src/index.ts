// ============================================================
// MayeBooth — 全局共享类型定义
// ============================================================

// ─── Session ────────────────────────────────────────────────
export type SessionStatus =
  | 'idle'
  | 'template_select'
  | 'countdown'
  | 'capturing'
  | 'processing'
  | 'preview'
  | 'qr_download'
  | 'complete'
  | 'error';

export interface Session {
  id: string;
  createdAt: number;
  updatedAt: number;
  templateId: string | null;
  status: SessionStatus;
  photoCount: number;
  capturedPhotos: CapturedPhoto[];
  outputPath: string | null;
  gifPath: string | null;
  qrCode: string | null;
  printJobId: string | null;
}

export interface CapturedPhoto {
  id: string;
  sessionId: string;
  sequence: number;     // 1-based
  rawPath: string;
  processedPath: string | null;
  createdAt: number;
}

// ─── Template ────────────────────────────────────────────────
export type TemplateCategory =
  | 'korean'
  | 'polaroid'
  | 'strip'
  | 'square'
  | 'magazine'
  | 'wedding'
  | 'y2k'
  | 'kawaii'
  | 'minimal'
  | 'custom';

export type SlotFit = 'cover' | 'contain' | 'fill';

export interface TemplateSlot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  fit?: SlotFit;
  border?: TemplateBorder;
  rotation?: number;
}

export interface TemplateBorder {
  width: number;
  color: string;
  style?: 'solid' | 'dashed';
}

export type TextType = 'static' | 'date' | 'time' | 'datetime' | 'session_id';
export type TextAlign = 'left' | 'center' | 'right';

export interface TemplateText {
  id: string;
  type: TextType;
  value?: string;     // for static
  format?: string;    // for date/time: YYYY.MM.DD etc.
  x: number;
  y: number;
  font: string;
  size: number;
  color: string;
  align?: TextAlign;
  rotation?: number;
  opacity?: number;
}

export interface TemplateSticker {
  id: string;
  src: string;        // relative path from assets/stickers/
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
}

export interface TemplateSize {
  width: number;
  height: number;
  dpi: number;
}

export interface TemplateBackground {
  color?: string;
  image?: string;     // relative path from assets/
  opacity?: number;
}

export interface TemplateOverlay {
  src: string;        // relative path from assets/overlays/
  opacity?: number;
}

export interface TemplateQRPlaceholder {
  id: string;
  x: number;
  y: number;
  size: number;
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description?: string;
  size: TemplateSize;
  background?: TemplateBackground;
  overlay?: TemplateOverlay;
  slots: TemplateSlot[];
  texts: TemplateText[];
  stickers: TemplateSticker[];
  qrPlaceholder?: TemplateQRPlaceholder;
  lut?: string | null;   // relative path to .cube file
  photoCount: number;    // how many photos this template needs
  isBuiltin: boolean;
  thumbnail?: string;    // base64 or path
  createdAt?: number;
  updatedAt?: number;
}

// ─── Print ───────────────────────────────────────────────────
export type PrinterType = 'epson' | 'instax' | 'system';
export type PrintStatus = 'queued' | 'printing' | 'done' | 'error';
export type PrintSize = '4x6' | '2x6' | 'square' | 'a4' | 'custom';

export interface PrintJob {
  id: string;
  sessionId: string;
  printer: string;
  printerType: PrinterType;
  status: PrintStatus;
  copies: number;
  size: PrintSize;
  filePath: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

// ─── Camera ──────────────────────────────────────────────────
export type CameraStatus = 'disconnected' | 'connected' | 'capturing' | 'error';

export interface CameraState {
  status: CameraStatus;
  watchFolder: string;
  lastCapture?: string;
  error?: string;
}

// ─── Settings ────────────────────────────────────────────────
export interface BoothSettings {
  // Camera
  watchFolder: string;
  cameraMode: 'watch_folder' | 'webcam';
  webcamDeviceId?: string;

  // Session flow
  photoCount: number;        // default 4
  countdownSeconds: number;  // default 3
  intervalBetweenShots: number; // ms, default 2000

  // Template
  defaultTemplateId?: string;

  // Print
  autoPrint: boolean;
  defaultPrinter: string;
  printCopies: number;
  defaultPrintSize: PrintSize;

  // UI
  brandName: string;
  brandLogo?: string;
  boothMode: boolean;
  kioskMode: boolean;
  language: 'zh' | 'en' | 'ko';

  // Storage
  storagePath: string;
  maxStorageDays: number;

  // QR
  qrExpireMinutes: number;
  serverHost: string;   // e.g. '192.168.1.100'
  serverPort: number;   // e.g. 3001
}

// ─── Socket.IO Events ────────────────────────────────────────
// Server → Client
export interface ServerToClientEvents {
  'session:update': (session: Session) => void;
  'camera:countdown': (data: { remaining: number; total: number }) => void;
  'camera:flash': () => void;
  'camera:captured': (photo: CapturedPhoto) => void;
  'photo:processed': (photo: CapturedPhoto) => void;
  'template:rendered': (data: { sessionId: string; outputPath: string; outputUrl: string }) => void;
  'print:status': (job: PrintJob) => void;
  'camera:status': (state: CameraState) => void;
  'settings:update': (settings: BoothSettings) => void;
  'error': (data: { code: string; message: string }) => void;
}

// Client → Server
export interface ClientToServerEvents {
  'session:create': (data: { templateId: string }) => void;
  'session:cancel': (sessionId: string) => void;
  'session:restart': (sessionId: string) => void;
  'camera:trigger': (sessionId: string) => void;
  'camera:capture_frame': (data: { sessionId: string; imageBase64: string; mimeType: string }) => void;
  'print:request': (data: { sessionId: string; copies?: number; size?: PrintSize }) => void;
  'settings:get': () => void;
  'settings:update': (settings: Partial<BoothSettings>) => void;
}

// ─── API Response Types ───────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
