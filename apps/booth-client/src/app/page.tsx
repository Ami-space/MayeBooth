'use client';

import dynamic from 'next/dynamic';
import { useBoothSocket } from '../hooks/useBoothSocket';
import { useUIStore } from '../stores';
import { HomeScreen } from '../components/screens/HomeScreen';
import { TemplateSelectScreen } from '../components/screens/TemplateSelectScreen';
import { CountdownScreen } from '../components/screens/CountdownScreen';
import { CaptureScreen } from '../components/screens/CaptureScreen';
import { ProcessingScreen } from '../components/screens/ProcessingScreen';
import { PreviewScreen } from '../components/screens/PreviewScreen';
import { QRDownloadScreen } from '../components/screens/QRDownloadScreen';
import { GalleryScreen } from '../components/screens/GalleryScreen';
import { AdminScreen } from '../components/screens/AdminScreen';
const TemplateEditorScreen = dynamic(
  () => import('../components/screens/TemplateEditorScreen').then((m) => ({ default: m.TemplateEditorScreen })),
  { ssr: false }
);
import { FlashOverlay } from '../components/ui/FlashOverlay';
import { ConnectionStatus } from '../components/ui/ConnectionStatus';
import { AnimatePresence, motion } from 'framer-motion';

const SCREEN_VARIANTS = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 1.02 },
};

export default function BoothApp() {
  useBoothSocket();

  const currentRoute = useUIStore((s) => s.currentRoute);

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--color-bg)',
      }}
    >
      <FlashOverlay />
      <ConnectionStatus />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentRoute}
          variants={SCREEN_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', height: '100%' }}
        >
          {currentRoute === 'home'            && <HomeScreen />}
          {currentRoute === 'template-select' && <TemplateSelectScreen />}
          {currentRoute === 'countdown'       && <CountdownScreen />}
          {currentRoute === 'capture'         && <CaptureScreen />}
          {currentRoute === 'processing'      && <ProcessingScreen />}
          {currentRoute === 'preview'         && <PreviewScreen />}
          {currentRoute === 'qr-download'     && <QRDownloadScreen />}
          {currentRoute === 'gallery'         && <GalleryScreen />}
          {currentRoute === 'admin'           && <AdminScreen />}
          {currentRoute === 'editor'          && <TemplateEditorScreen />}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
