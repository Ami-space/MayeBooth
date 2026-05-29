'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore, useUIStore, useSettingsStore } from '../../stores';

const AUTO_CLOSE_SECONDS = 30;

export function QRDownloadScreen() {
  const session = useSessionStore((s) => s.session);
  const navigate = useUIStore((s) => s.navigate);
  const settings = useSettingsStore((s) => s.settings);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CLOSE_SECONDS);

  // Auto-close countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          navigate('home');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  if (!session?.qrCode) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg)',
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  const host = settings?.serverHost === '0.0.0.0' ? 'localhost' : settings?.serverHost;
  const downloadUrl = `http://${host}:${settings?.serverPort ?? 4000}/api/sessions/${session.id}/download`;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        gap: '32px',
        padding: '40px',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60vw',
          height: '60vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--color-accent-glow) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', zIndex: 1 }}
      >
        <h2
          style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800,
            color: 'var(--color-text)',
            marginBottom: '12px',
          }}
        >
          📱 扫码下载照片
        </h2>
        <p style={{ color: 'var(--color-text-sub)', fontSize: '18px' }}>
          用手机扫描二维码，即可免费下载专属照片
        </p>
      </motion.div>

      {/* QR Code */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        style={{
          padding: '24px',
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 2px hsl(345,78%,65%,0.3)',
          zIndex: 1,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={session.qrCode}
          alt="QR Code"
          style={{ width: '240px', height: '240px', display: 'block' }}
        />
      </motion.div>

      {/* URL display */}
      <div
        className="glass"
        style={{
          padding: '10px 20px',
          borderRadius: '100px',
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: '13px',
            color: 'var(--color-text-sub)',
            fontFamily: 'monospace',
          }}
        >
          {downloadUrl}
        </span>
      </div>

      {/* Auto-close timer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ zIndex: 1, textAlign: 'center' }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: '3px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px',
            fontSize: '20px',
            fontWeight: 700,
            color: secondsLeft <= 10 ? 'var(--color-accent)' : 'var(--color-text-sub)',
            borderColor: secondsLeft <= 10 ? 'var(--color-accent)' : 'var(--color-border)',
            boxShadow: secondsLeft <= 10 ? '0 0 20px var(--color-accent-glow)' : 'none',
            transition: 'all 0.3s',
          }}
        >
          {secondsLeft}
        </div>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
          {secondsLeft} 秒后自动返回首页
        </p>
      </motion.div>

      <button
        onClick={() => navigate('preview')}
        className="btn btn-ghost"
        style={{ zIndex: 1 }}
      >
        ← 返回预览
      </button>
    </div>
  );
}
