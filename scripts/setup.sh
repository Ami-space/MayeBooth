#!/bin/bash
# ============================================================
# MayeBooth — 一键安装脚本
# 适用于 macOS (Apple Silicon & Intel)
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      MayeBooth 安装脚本              ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── 检查 Node.js ─────────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo "❌ 未找到 Node.js，请先安装 Node.js 20+："
  echo "   https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt "20" ]; then
  echo "❌ Node.js 版本需要 20+，当前版本: $(node --version)"
  exit 1
fi
echo "✅ Node.js: $(node --version)"

# ── 检查 pnpm ────────────────────────────────────────────────
if ! command -v pnpm &> /dev/null; then
  echo "📦 安装 pnpm..."
  npm install -g pnpm
fi
echo "✅ pnpm: $(pnpm --version)"

# ── 检查 ffmpeg ──────────────────────────────────────────────
if command -v ffmpeg &> /dev/null; then
  echo "✅ ffmpeg: $(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')"
else
  echo "⚠️  未找到 ffmpeg (GIF 功能需要)"
  echo "   安装命令: brew install ffmpeg"
fi

# ── 创建 Watch Folder ────────────────────────────────────────
WATCH_FOLDER="$HOME/Pictures/MayeBooth-Watch"
if [ ! -d "$WATCH_FOLDER" ]; then
  mkdir -p "$WATCH_FOLDER"
  echo "✅ 创建 Watch Folder: $WATCH_FOLDER"
fi

# ── 安装依赖 ─────────────────────────────────────────────────
echo ""
echo "📦 安装项目依赖..."
cd "$(dirname "$0")/.."
pnpm install

echo ""
echo "╔══════════════════════════════════════╗"
echo "║      ✅ 安装完成！                   ║"
echo "╠══════════════════════════════════════╣"
echo "║  启动命令: pnpm dev                  ║"
echo "║  或: bash scripts/start-booth.sh     ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "📷 Sony A7C 配置："
echo "   1. 在相机中开启 PC Remote 模式"
echo "   2. 将照片保存目录指向: $WATCH_FOLDER"
echo "   3. 或使用 Sony Imaging Edge Remote，配置自动保存到此目录"
echo ""
