#!/bin/bash
# ============================================================
# MayeBooth — Booth Kiosk 启动脚本
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_PORT=4000
CLIENT_PORT=3000
SERVER_URL="http://localhost:$CLIENT_PORT"

echo "🎬 MayeBooth 启动中..."

# Kill any existing instances
pkill -f "booth-server" 2>/dev/null || true
pkill -f "booth-client" 2>/dev/null || true
sleep 1

# Start booth-server
echo "🖥  启动后端服务 (port $SERVER_PORT)..."
cd "$PROJECT_DIR"
pnpm --filter booth-server dev &
SERVER_PID=$!

# Start booth-client
echo "🌐 启动前端服务 (port $CLIENT_PORT)..."
pnpm --filter booth-client dev &
CLIENT_PID=$!

# Wait for services to be ready
echo "⏳ 等待服务就绪..."
sleep 5

# Check if services are up
for i in {1..20}; do
  if curl -s "http://localhost:$SERVER_PORT/api/health" > /dev/null 2>&1; then
    echo "✅ 后端服务已就绪"
    break
  fi
  sleep 1
done

# Open in Safari (fullscreen mode recommended for iPad)
echo "🌐 在浏览器中打开 MayeBooth..."
open -a "Safari" "$SERVER_URL"

# Display info
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        🎉 MayeBooth 已启动！                 ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  MacBook 访问: http://localhost:3000          ║"
echo "║  iPad 访问: 在 Safari 中打开 MacBook 的 IP   ║"
echo "║  获取 IP: ifconfig | grep 'inet 192'          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "按 Ctrl+C 停止服务"

# Trap to cleanup on exit
cleanup() {
  echo ""
  echo "🛑 停止服务..."
  kill $SERVER_PID 2>/dev/null || true
  kill $CLIENT_PID 2>/dev/null || true
  echo "✅ 已停止"
}
trap cleanup INT TERM

# Keep running
wait
