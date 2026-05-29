'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '../../stores';

// ── Live Preview via WebRTC (system webcam) ───────────────────────────────────
function LivePreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 1920, height: 1080 }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          setHasCamera(true);
        }
      })
      .catch(() => setHasCamera(false));

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (!hasCamera) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'hsl(0,0%,6%)',
          color: 'var(--color-text-muted)',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '48px' }}>📷</div>
        <p style={{ fontSize: '16px' }}>
          请确认摄像头权限已开启
        </p>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
          相机取景将在此处显示
        </p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'scaleX(-1)', // mirror for selfie view
      }}
    />
  );
}

// ── Countdown Ring ────────────────────────────────────────────────────────────
function CountdownRing({
  remaining,
  total,
}: {
  remaining: number;
  total: number;
}) {
  const size = 280;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = remaining / total;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {/* SVG ring */}
      <svg
        width={size}
        height={size}
        style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(0,0%,15%)"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#countdown-grad)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
        <defs>
          <linearGradient id="countdown-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(345, 78%, 65%)" />
            <stop offset="100%" stopColor="hsl(300, 60%, 55%)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Number */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={remaining}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="countdown-number"
            style={{ fontSize: '120px' }}
          >
            {remaining === 0 ? '📸' : remaining}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Photo Progress ────────────────────────────────────────────────────────────
function PhotoProgress({
  capturedCount,
  totalCount,
}: {
  capturedCount: number;
  totalCount: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {Array.from({ length: totalCount }, (_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1 }}
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background:
              i < capturedCount
                ? 'var(--color-accent)'
                : i === capturedCount
                ? 'var(--color-border)'
                : 'var(--color-border-soft)',
            boxShadow:
              i < capturedCount
                ? '0 0 12px var(--color-accent-glow)'
                : 'none',
            border: i === capturedCount ? '2px solid var(--color-text-muted)' : 'none',
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

// ── Main CountdownScreen ──────────────────────────────────────────────────────
export function CountdownScreen() {
  const session = useSessionStore((s) => s.session);
  const countdownRemaining = useSessionStore((s) => s.countdownRemaining);
  const countdownTotal = useSessionStore((s) => s.countdownTotal);

  const capturedCount = session?.photoCount ?? 0;
  const totalCount = session ? 4 : 4; // from template

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
      {/* Live preview takes full background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
        }}
      >
        <LivePreview />

        {/* Dark gradient overlay for readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.5) 100%)',
          }}
        />
      </div>

      {/* Countdown overlay */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
        }}
      >
        {/* Header */}
        <div
          className="glass"
          style={{
            padding: '10px 20px',
            borderRadius: '100px',
          }}
        >
          <span
            style={{ color: 'white', fontSize: '16px', fontWeight: 500 }}
          >
            第 {capturedCount + 1} 张 / 共 {totalCount} 张
          </span>
        </div>

        {/* Countdown ring */}
        {countdownRemaining > 0 && (
          <CountdownRing
            remaining={countdownRemaining}
            total={countdownTotal}
          />
        )}

        {/* CHEESE text */}
        {countdownRemaining === 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              fontSize: '72px',
              fontWeight: 900,
              color: 'white',
              textShadow: '0 0 40px rgba(255,255,255,0.5)',
            }}
          >
            📸 CHEESE!
          </motion.div>
        )}

        {/* Progress dots */}
        <PhotoProgress capturedCount={capturedCount} totalCount={totalCount} />
      </div>
    </div>
  );
}
