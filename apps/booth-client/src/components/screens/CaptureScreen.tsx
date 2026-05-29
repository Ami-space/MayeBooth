'use client';

import { motion } from 'framer-motion';
import { useSessionStore } from '../../stores';

export function CaptureScreen() {
  const session = useSessionStore((s) => s.session);
  const captured = session?.photoCount ?? 0;
  const total = 4;

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
        gap: '40px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📸</div>
        <h2
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: '8px',
          }}
        >
          已拍摄 {captured} 张
        </h2>
        <p style={{ color: 'var(--color-text-sub)', fontSize: '18px' }}>
          稍等片刻，准备下一张...
        </p>
      </motion.div>

      {/* Photo strip thumbnails */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {Array.from({ length: total }, (_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            style={{
              width: '80px',
              height: '100px',
              borderRadius: '8px',
              border: `2px solid ${i < captured ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background:
                i < captured
                  ? 'var(--color-accent-soft)'
                  : 'var(--color-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: i < captured ? '28px' : '20px',
              boxShadow:
                i < captured
                  ? '0 0 20px var(--color-accent-glow)'
                  : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {i < captured ? '✓' : <span style={{ color: 'var(--color-text-muted)' }}>{i + 1}</span>}
          </motion.div>
        ))}
      </div>

      <div className="progress-dots">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`progress-dot ${i < captured ? 'done' : i === captured ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
