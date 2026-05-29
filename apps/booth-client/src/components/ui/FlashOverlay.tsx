'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '../../stores';

export function FlashOverlay() {
  const isFlashing = useSessionStore((s) => s.isFlashing);

  return (
    <AnimatePresence>
      {isFlashing && (
        <motion.div
          key="flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.5, times: [0, 0.1, 0.4, 1] }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'white',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      )}
    </AnimatePresence>
  );
}
