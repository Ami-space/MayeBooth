'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../stores';

export function ConnectionStatus() {
  const connected = useUIStore((s) => s.socketConnected);

  return (
    <AnimatePresence>
      {!connected && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '10px 20px',
            borderRadius: '100px',
            background: 'hsl(4, 86%, 58%, 0.15)',
            border: '1px solid hsl(4, 86%, 58%, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--color-error)',
              animation: 'pulse-glow 1s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: '13px', color: 'var(--color-error)', fontWeight: 500 }}>
            正在连接服务器...
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
