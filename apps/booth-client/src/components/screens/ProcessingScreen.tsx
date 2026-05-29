'use client';

import { motion } from 'framer-motion';

function ProcessingDots() {
  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
          }}
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: 'var(--color-accent)',
          }}
        />
      ))}
    </div>
  );
}

export function ProcessingScreen() {
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
      }}
    >
      {/* Spinning camera icon */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{ fontSize: '72px', display: 'block' }}
      >
        🎨
      </motion.div>

      <div style={{ textAlign: 'center' }}>
        <h2
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: '12px',
          }}
        >
          正在合成照片
        </h2>
        <p style={{ color: 'var(--color-text-sub)', fontSize: '18px', marginBottom: '24px' }}>
          请稍候，正在为您生成专属相片...
        </p>
        <ProcessingDots />
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '240px',
          height: '4px',
          borderRadius: '2px',
          background: 'var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '50%',
            height: '100%',
            background: 'var(--gradient-accent)',
            borderRadius: '2px',
          }}
        />
      </div>
    </div>
  );
}
