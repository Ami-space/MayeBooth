'use client';

import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';
import {
  useSessionStore,
  useCameraStore,
  useSettingsStore,
  useUIStore,
} from '../stores';

/**
 * useBoothSocket — subscribes to all Socket.IO events and syncs to Zustand stores.
 * Must be mounted once at the app root.
 */
export function useBoothSocket() {
  const initialized = useRef(false);

  const setSession = useSessionStore((s) => s.setSession);
  const setCountdown = useSessionStore((s) => s.setCountdown);
  const triggerFlash = useSessionStore((s) => s.triggerFlash);
  const setCameraState = useCameraStore((s) => s.setCameraState);
  const setSettings = useSettingsStore((s) => s.setSettings);
  const setSocketConnected = useUIStore((s) => s.setSocketConnected);
  const navigate = useUIStore((s) => s.navigate);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = getSocket();

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('session:update', (session) => {
      setSession(session);
      // Navigate based on session status
      switch (session.status) {
        case 'countdown':   navigate('countdown'); break;
        case 'capturing':   navigate('capture');   break;
        case 'processing':  navigate('processing'); break;
        case 'preview':     navigate('preview');   break;
        case 'idle':        navigate('home');       break;
      }
    });

    socket.on('camera:countdown', ({ remaining, total }) => {
      setCountdown(remaining, total);
    });

    socket.on('camera:flash', () => {
      triggerFlash();
    });

    socket.on('camera:status', (state) => {
      setCameraState(state);
    });

    socket.on('settings:update', (settings) => {
      setSettings(settings);
    });

    socket.on('template:rendered', ({ sessionId }) => {
      // Template rendered — navigate to preview is handled by session:update
      console.log('Template rendered for session:', sessionId);
    });

    socket.on('error', ({ code, message }) => {
      console.error(`Socket error [${code}]: ${message}`);
    });

    // Request initial state
    socket.emit('settings:get');

    return () => {
      // Don't disconnect on unmount to maintain persistent connection
    };
  }, []);
}
