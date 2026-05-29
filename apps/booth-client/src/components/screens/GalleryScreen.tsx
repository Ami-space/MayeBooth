'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '../../stores';
import type { Session } from 'shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function GalleryScreen() {
  const navigate = useUIStore((s) => s.navigate);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/gallery`)
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.data?.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
      {/* Header */}
      <div
        style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate('home')}
          className="btn btn-ghost"
          style={{ padding: '10px 16px', fontSize: '14px' }}
        >
          ← 返回
        </button>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>本地图库</h2>
          <p style={{ color: 'var(--color-text-sub)', fontSize: '14px', marginTop: '2px' }}>
            {sessions.length} 个会话
          </p>
        </div>
      </div>

      {/* Gallery grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
        }}
      >
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
            <div className="spinner" />
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              paddingTop: '80px',
              color: 'var(--color-text-muted)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼</div>
            <p style={{ fontSize: '18px' }}>暂无照片，去拍摄吧！</p>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px',
          }}
        >
          {sessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card"
              style={{
                overflow: 'hidden',
                cursor: 'pointer',
              }}
            >
              {/* Photo thumbnail */}
              <div
                style={{
                  height: '160px',
                  background: 'var(--color-surface)',
                  overflow: 'hidden',
                }}
              >
                {session.outputPath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_URL}/api/sessions/${session.id}/output`}
                    alt={`Session ${session.id}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              {/* Session info */}
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-sub)', marginBottom: '4px' }}>
                  {new Date(session.createdAt).toLocaleDateString('zh-CN')}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  {session.id.slice(0, 8)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
