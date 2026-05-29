'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useUIStore, useSettingsStore, useCameraStore } from '../../stores';
import { getSocket } from '../../services/socket';
import type { BoothSettings } from 'shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function StatusCard({
  title,
  value,
  icon,
  status,
}: {
  title: string;
  value: string;
  icon: string;
  status?: 'ok' | 'warn' | 'error';
}) {
  const statusColor = {
    ok: 'var(--color-success)',
    warn: 'var(--color-warning)',
    error: 'var(--color-error)',
    undefined: 'var(--color-text-muted)',
  }[status ?? 'undefined'];

  return (
    <div
      className="card"
      style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}
    >
      <span style={{ fontSize: '32px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
          {title}
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: statusColor ?? 'var(--color-text)' }}>
          {value}
        </div>
      </div>
      {status && (
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: statusColor,
            boxShadow: status === 'ok' ? `0 0 10px ${statusColor}` : 'none',
          }}
        />
      )}
    </div>
  );
}

function SettingRow({
  label,
  value,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string | number | boolean;
  type?: 'text' | 'number' | 'toggle';
  onChange: (v: string | number | boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 0',
        borderBottom: '1px solid var(--color-border-soft)',
        gap: '20px',
      }}
    >
      <span style={{ fontSize: '15px', color: 'var(--color-text)', flex: 1 }}>{label}</span>
      {type === 'toggle' ? (
        <button
          onClick={() => onChange(!value)}
          style={{
            width: '52px',
            height: '28px',
            borderRadius: '14px',
            border: 'none',
            background: value ? 'var(--color-accent)' : 'var(--color-border)',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '3px',
              left: value ? '26px' : '3px',
              width: '22px',
              height: '22px',
              borderRadius: '11px',
              background: 'white',
              transition: 'left 0.2s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          />
        </button>
      ) : (
        <input
          className="input"
          type={type}
          value={String(value)}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          style={{ width: '200px' }}
        />
      )}
    </div>
  );
}

export function AdminScreen() {
  const navigate = useUIStore((s) => s.navigate);
  const settings = useSettingsStore((s) => s.settings);
  const cameraState = useCameraStore((s) => s.cameraState);
  const [printers, setPrinters] = useState<string[]>([]);
  const [localSettings, setLocalSettings] = useState<Partial<BoothSettings>>({});
  const [activeTab, setActiveTab] = useState<'status' | 'settings' | 'templates'>('status');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    fetch(`${API_URL}/api/settings/printers`)
      .then((r) => r.json())
      .then((data) => setPrinters(data.data ?? []));
  }, []);

  const handleSave = () => {
    setSaveStatus('saving');
    const socket = getSocket();
    socket.emit('settings:update', localSettings);
    setTimeout(() => setSaveStatus('saved'), 800);
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const updateLocal = (key: keyof BoothSettings, value: unknown) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const TABS = [
    { id: 'status', label: '系统状态' },
    { id: 'settings', label: '设置' },
    { id: 'templates', label: '模板' },
  ] as const;

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
          padding: '20px 32px',
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
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>⚙️ 管理后台</h2>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.id ? 'var(--color-accent-soft)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-sub)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        {activeTab === 'status' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            <StatusCard
              icon="📷"
              title="相机状态"
              value={
                cameraState.status === 'connected'
                  ? '已连接 (Watch Folder)'
                  : cameraState.status === 'capturing'
                  ? '拍摄中...'
                  : cameraState.status === 'error'
                  ? '错误'
                  : '等待连接'
              }
              status={
                cameraState.status === 'connected' || cameraState.status === 'capturing'
                  ? 'ok'
                  : cameraState.status === 'error'
                  ? 'error'
                  : 'warn'
              }
            />
            <StatusCard
              icon="🖨️"
              title="打印机"
              value={printers.length > 0 ? printers[0] : '未找到打印机'}
              status={printers.length > 0 ? 'ok' : 'warn'}
            />
            <StatusCard
              icon="📁"
              title="监听文件夹"
              value={settings?.watchFolder ?? '-'}
              status="ok"
            />
            <StatusCard
              icon="💾"
              title="服务器"
              value={`http://localhost:${settings?.serverPort ?? 4000}`}
              status="ok"
            />
          </div>
        )}

        {activeTab === 'settings' && localSettings && (
          <div>
            <div
              className="card"
              style={{ padding: '24px', maxWidth: '640px' }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>基础设置</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '20px' }}>
                修改后点击保存生效
              </p>

              <SettingRow
                label="品牌名称"
                value={localSettings.brandName ?? 'MayeBooth'}
                onChange={(v) => updateLocal('brandName', v)}
              />
              <SettingRow
                label="监听文件夹路径"
                value={localSettings.watchFolder ?? ''}
                onChange={(v) => updateLocal('watchFolder', v)}
              />
              <SettingRow
                label="倒计时秒数"
                type="number"
                value={localSettings.countdownSeconds ?? 3}
                onChange={(v) => updateLocal('countdownSeconds', v)}
              />
              <SettingRow
                label="拍摄间隔 (毫秒)"
                type="number"
                value={localSettings.intervalBetweenShots ?? 2000}
                onChange={(v) => updateLocal('intervalBetweenShots', v)}
              />
              <SettingRow
                label="自动打印"
                type="toggle"
                value={localSettings.autoPrint ?? false}
                onChange={(v) => updateLocal('autoPrint', v)}
              />
              <SettingRow
                label="打印份数"
                type="number"
                value={localSettings.printCopies ?? 1}
                onChange={(v) => updateLocal('printCopies', v)}
              />
              <SettingRow
                label="QR 过期时间 (分钟)"
                type="number"
                value={localSettings.qrExpireMinutes ?? 60}
                onChange={(v) => updateLocal('qrExpireMinutes', v)}
              />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <motion.button
                onClick={handleSave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="btn btn-primary"
                style={{ minWidth: '120px' }}
              >
                {saveStatus === 'saving'
                  ? '保存中...'
                  : saveStatus === 'saved'
                  ? '✓ 已保存'
                  : '保存设置'}
              </motion.button>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>模板管理</h3>
              <button
                onClick={() => navigate('editor')}
                className="btn btn-secondary"
                style={{ fontSize: '14px' }}
              >
                + 新建模板
              </button>
            </div>
            <p style={{ color: 'var(--color-text-sub)', fontSize: '14px' }}>
              前往模板选择页查看和管理所有模板。点击「新建模板」使用 Konva 编辑器创建自定义模板。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
