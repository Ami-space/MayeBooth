'use client';

import { motion } from 'framer-motion';
import { useSessionStore, useUIStore, useSettingsStore } from '../../stores';
import { getSocket } from '../../services/socket';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function PreviewScreen() {
  const session = useSessionStore((s) => s.session);
  const navigate = useUIStore((s) => s.navigate);
  const settings = useSettingsStore((s) => s.settings);

  if (!session) return null;

  const outputUrl = `${API_URL}/api/sessions/${session.id}/output`;

  const handlePrint = () => {
    const socket = getSocket();
    socket.emit('print:request', {
      sessionId: session.id,
      copies: settings?.printCopies ?? 1,
      size: settings?.defaultPrintSize ?? '4x6',
    });
  };

  const handleRetake = () => {
    if (session.id) {
      const socket = getSocket();
      socket.emit('session:cancel', session.id);
    }
    navigate('template-select');
  };

  const handleQR = () => {
    navigate('qr-download');
  };

  const handleHome = () => {
    navigate('home');
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
        overflow: 'hidden',
      }}
    >
      {/* Two-column layout */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 0,
          overflow: 'hidden',
        }}
      >
        {/* Left: Photo preview */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            background: 'hsl(0,0%,3%)',
          }}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '400px',
              maxHeight: '100%',
            }}
          >
            {/* Photo glow effect */}
            <div
              style={{
                position: 'absolute',
                inset: '-20px',
                borderRadius: '20px',
                background: 'radial-gradient(ellipse, var(--color-accent-glow) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={outputUrl}
              alt="Preview"
              style={{
                position: 'relative',
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 120px)',
                objectFit: 'contain',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              }}
            />
          </div>
        </motion.div>

        {/* Right: Actions panel */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          style={{
            width: '320px',
            display: 'flex',
            flexDirection: 'column',
            padding: '40px 32px',
            borderLeft: '1px solid var(--color-border)',
            gap: '16px',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '100px',
                background: 'hsl(145, 58%, 50%, 0.15)',
                border: '1px solid hsl(145, 58%, 50%, 0.3)',
                marginBottom: '12px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-success)' }} />
              <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 600 }}>照片合成完成</span>
            </div>

            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '8px',
                lineHeight: 1.2,
              }}
            >
              你的专属照片
              <br />
              已经准备好了！
            </h2>
            <p style={{ color: 'var(--color-text-sub)', fontSize: '15px', lineHeight: 1.6 }}>
              选择打印或扫描二维码下载到手机
            </p>
          </div>

          <div style={{ flex: 1 }} />

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <motion.button
              onClick={handlePrint}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn btn-primary"
              style={{ fontSize: '18px', minHeight: '64px', borderRadius: 'var(--radius-xl)' }}
            >
              🖨️ &nbsp; 立即打印
            </motion.button>

            <motion.button
              onClick={handleQR}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn btn-secondary"
              style={{ fontSize: '18px', minHeight: '64px', borderRadius: 'var(--radius-xl)' }}
            >
              📱 &nbsp; 手机下载
            </motion.button>

            <motion.button
              onClick={handleRetake}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn btn-ghost"
              style={{ fontSize: '16px', minHeight: '56px', borderRadius: 'var(--radius-xl)' }}
            >
              🔄 &nbsp; 重新拍摄
            </motion.button>
          </div>

          <button
            onClick={handleHome}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'center',
              padding: '8px',
              marginTop: '8px',
            }}
          >
            ← 返回首页
          </button>
        </motion.div>
      </div>
    </div>
  );
}
