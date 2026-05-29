'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useUIStore, useSettingsStore, useCameraStore } from '../../stores';

// ── Animated background particles ────────────────────────────────────────────
function BackgroundOrbs() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Large ambient orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(345, 78%, 65%, 0.12) 0%, transparent 70%)',
          animation: 'float 8s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(270, 60%, 55%, 0.08) 0%, transparent 70%)',
          animation: 'float 10s ease-in-out infinite reverse',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40vw',
          height: '40vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(174, 72%, 56%, 0.05) 0%, transparent 70%)',
          animation: 'float 12s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// ── Logo ─────────────────────────────────────────────────────────────────────
function BoothLogo({ brandName }: { brandName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      style={{ textAlign: 'center', marginBottom: '16px' }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '100px',
          background: 'var(--color-accent-soft)',
          border: '1px solid hsl(345, 78%, 65%, 0.25)',
          marginBottom: '24px',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--color-accent)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          ✦ Professional Photobooth
        </span>
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 10vw, 96px)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          background: 'var(--gradient-accent)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 30px hsl(345, 78%, 65%, 0.4))',
        }}
      >
        {brandName}
      </h1>

      <p
        style={{
          marginTop: '12px',
          fontSize: '18px',
          color: 'var(--color-text-sub)',
          fontWeight: 400,
          letterSpacing: '0.02em',
        }}
      >
        拍下专属记忆，带走美好瞬间
      </p>
    </motion.div>
  );
}

// ── Main Start Button ─────────────────────────────────────────────────────────
function StartButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="btn btn-primary btn-booth animate-pulse-glow"
      style={{
        fontSize: '1.5rem',
        minWidth: '280px',
        minHeight: '88px',
        borderRadius: '100px',
        letterSpacing: '0.04em',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>
        📸 &nbsp; 开始拍摄
      </span>
    </motion.button>
  );
}

// ── Status Indicators ─────────────────────────────────────────────────────────
function StatusBar({ isConnected, watchFolder }: { isConnected: boolean; watchFolder: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '100px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          fontSize: '13px',
          color: 'var(--color-text-sub)',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? 'var(--color-success)' : 'var(--color-error)',
            boxShadow: isConnected ? '0 0 8px var(--color-success)' : 'none',
          }}
        />
        {isConnected ? '服务已连接' : '等待连接...'}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '100px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          fontSize: '13px',
          color: 'var(--color-text-sub)',
        }}
      >
        📁 监听文件夹已就绪
      </div>
    </motion.div>
  );
}

// ── Gallery & Admin Links ──────────────────────────────────────────────────────
function QuickLinks({ onGallery, onAdmin }: { onGallery: () => void; onAdmin: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        marginTop: '8px',
      }}
    >
      <button
        onClick={onGallery}
        className="btn btn-ghost"
        style={{ fontSize: '14px', padding: '10px 20px' }}
      >
        🖼 图库
      </button>
      <button
        onClick={onAdmin}
        className="btn btn-ghost"
        style={{ fontSize: '14px', padding: '10px 20px' }}
      >
        ⚙️ 管理
      </button>
    </motion.div>
  );
}

// ── Main HomeScreen ───────────────────────────────────────────────────────────
export function HomeScreen() {
  const navigate = useUIStore((s) => s.navigate);
  const socketConnected = useUIStore((s) => s.socketConnected);
  const settings = useSettingsStore((s) => s.settings);
  const cameraState = useCameraStore((s) => s.cameraState);

  const brandName = settings?.brandName ?? 'MayeBooth';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        gap: '40px',
        padding: '40px',
        background: 'var(--color-bg)',
      }}
    >
      <BackgroundOrbs />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '40px',
          maxWidth: '640px',
          width: '100%',
        }}
      >
        <BoothLogo brandName={brandName} />

        <StartButton onClick={() => navigate('template-select')} />

        <StatusBar
          isConnected={socketConnected}
          watchFolder={settings?.watchFolder ?? ''}
        />

        <QuickLinks
          onGallery={() => navigate('gallery')}
          onAdmin={() => navigate('admin')}
        />
      </div>

      {/* Corner decorative elements */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        v1.0 · Offline
      </div>
    </div>
  );
}
