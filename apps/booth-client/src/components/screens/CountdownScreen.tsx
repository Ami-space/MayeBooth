'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '../../stores';
import { getSocket } from '../../services/socket';

// ── Live Preview via WebRTC ────────────────────────────────────────────────
function LivePreview({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
          setHasCamera(true);
        }
      })
      .catch(() => setHasCamera(false));

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [videoRef]);

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16/9',
        maxHeight: '45vh',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'hsl(0,0%,8%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)', // mirror
          display: hasCamera ? 'block' : 'none',
        }}
      />
      {!hasCamera && (
        <div style={{ textAlign: 'center', color: 'var(--color-text-sub)' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>📷</div>
          <div style={{ fontSize: '14px' }}>无摄像头预览</div>
        </div>
      )}
    </div>
  );
}

// ── Ring countdown timer ───────────────────────────────────────────────────
function CountdownRing({ remaining, total }: { remaining: number; total: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? remaining / total : 0;
  const offset = circumference * (1 - progress);

  const color =
    remaining <= 1 ? '#ef4444' : remaining <= 2 ? '#f59e0b' : 'var(--color-primary)';

  return (
    <div style={{ position: 'relative', width: 160, height: 160 }}>
      <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={remaining}
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ fontSize: '52px', fontWeight: 800, color, lineHeight: 1 }}
          >
            {remaining === 0 ? '📸' : remaining}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Capture webcam frame and send to server ────────────────────────────────
function captureWebcamFrame(
  video: HTMLVideoElement,
  sessionId: string
): void {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d')!;

  // Mirror to match preview (un-mirror for the actual capture)
  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  const imageBase64 = canvas.toDataURL('image/jpeg', 0.92);
  const socket = getSocket();
  socket.emit('camera:capture_frame', {
    sessionId,
    imageBase64,
    mimeType: 'image/jpeg',
  });
}

// ── Main CountdownScreen ───────────────────────────────────────────────────
export function CountdownScreen() {
  const session = useSessionStore((s) => s.session);
  const countdownRemaining = useSessionStore((s) => s.countdownRemaining);
  const countdownTotal = useSessionStore((s) => s.countdownTotal);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasTriggeredRef = useRef(false);

  const shotNumber = (session?.photoCount ?? 0) + 1;

  // When countdown reaches 0, capture webcam frame and send to server
  useEffect(() => {
    if (countdownRemaining === 0 && countdownTotal > 0 && !hasTriggeredRef.current && session?.id) {
      hasTriggeredRef.current = true;

      if (videoRef.current && videoRef.current.readyState >= 2) {
        captureWebcamFrame(videoRef.current, session.id);
      } else {
        console.log('📷 No webcam stream — waiting for Watch Folder...');
      }
    }

    // Reset trigger flag when a new countdown starts (remaining resets to total)
    if (countdownRemaining === countdownTotal && countdownTotal > 0) {
      hasTriggeredRef.current = false;
    }
  }, [countdownRemaining, countdownTotal, session?.id]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '32px',
        padding: '24px',
      }}
    >
      {/* Shot number indicator */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <span style={{ color: 'var(--color-text-sub)', fontSize: '14px' }}>
          第 {shotNumber} 张
        </span>
      </motion.div>

      {/* Live preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: '560px' }}
      >
        <LivePreview videoRef={videoRef} />
      </motion.div>

      {/* Countdown ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {countdownTotal > 0 ? (
          <CountdownRing remaining={countdownRemaining} total={countdownTotal} />
        ) : (
          <div style={{ color: 'var(--color-text-sub)', fontSize: '14px' }}>等待服务器...</div>
        )}
      </motion.div>

      {/* Tip */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.3 }}
        style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center' }}
      >
        {videoRef.current?.srcObject
          ? '📷 摄像头已就绪 — 倒计时结束自动拍照'
          : '🎥 请允许摄像头权限，或连接 Sony A7C 使用 Watch Folder 模式'}
      </motion.p>
    </div>
  );
}
