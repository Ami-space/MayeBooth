import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Session,
  Template,
  CameraState,
  BoothSettings,
  SessionStatus,
} from 'shared';

// ─── Booth Session Store ──────────────────────────────────────────────────────
interface SessionStore {
  session: Session | null;
  countdownRemaining: number;
  countdownTotal: number;
  isFlashing: boolean;

  setSession: (session: Session | null) => void;
  setCountdown: (remaining: number, total: number) => void;
  triggerFlash: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>()(
  subscribeWithSelector((set) => ({
    session: null,
    countdownRemaining: 0,
    countdownTotal: 3,
    isFlashing: false,

    setSession: (session) => set({ session }),
    setCountdown: (remaining, total) =>
      set({ countdownRemaining: remaining, countdownTotal: total }),
    triggerFlash: () => {
      set({ isFlashing: true });
      setTimeout(() => set({ isFlashing: false }), 500);
    },
    reset: () =>
      set({ session: null, countdownRemaining: 0, isFlashing: false }),
  }))
);

// ─── Template Store ────────────────────────────────────────────────────────
interface TemplateStore {
  templates: Template[];
  selectedTemplate: Template | null;
  isLoading: boolean;

  setTemplates: (templates: Template[]) => void;
  selectTemplate: (template: Template) => void;
  clearSelection: () => void;
  setLoading: (loading: boolean) => void;
}

export const useTemplateStore = create<TemplateStore>()((set) => ({
  templates: [],
  selectedTemplate: null,
  isLoading: false,

  setTemplates: (templates) => set({ templates }),
  selectTemplate: (template) => set({ selectedTemplate: template }),
  clearSelection: () => set({ selectedTemplate: null }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

// ─── Camera Store ─────────────────────────────────────────────────────────
interface CameraStore {
  cameraState: CameraState;
  isConnected: boolean;

  setCameraState: (state: CameraState) => void;
}

export const useCameraStore = create<CameraStore>()((set) => ({
  cameraState: { status: 'disconnected', watchFolder: '' },
  isConnected: false,

  setCameraState: (state) =>
    set({ cameraState: state, isConnected: state.status !== 'disconnected' }),
}));

// ─── Settings Store ───────────────────────────────────────────────────────
interface SettingsStore {
  settings: BoothSettings | null;
  setSettings: (settings: BoothSettings) => void;
}

export const useSettingsStore = create<SettingsStore>()((set) => ({
  settings: null,
  setSettings: (settings) => set({ settings }),
}));

// ─── UI Store ─────────────────────────────────────────────────────────────
type UIRoute =
  | 'home'
  | 'template-select'
  | 'countdown'
  | 'capture'
  | 'processing'
  | 'preview'
  | 'qr-download'
  | 'gallery'
  | 'admin'
  | 'editor';

interface UIStore {
  currentRoute: UIRoute;
  socketConnected: boolean;
  showAdminOverlay: boolean;

  navigate: (route: UIRoute) => void;
  setSocketConnected: (connected: boolean) => void;
  toggleAdmin: () => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  currentRoute: 'home',
  socketConnected: false,
  showAdminOverlay: false,

  navigate: (route) => set({ currentRoute: route }),
  setSocketConnected: (connected) => set({ socketConnected: connected }),
  toggleAdmin: () =>
    set((s) => ({ showAdminOverlay: !s.showAdminOverlay })),
}));
