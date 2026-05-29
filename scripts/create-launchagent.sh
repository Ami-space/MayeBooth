#!/bin/bash
# ============================================================
# MayeBooth — macOS LaunchAgent 自启动安装
# 系统登录后自动启动 MayeBooth
# ============================================================

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_NAME="com.mayebooth.booth"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo "📌 安装 macOS LaunchAgent..."

# Create LaunchAgent plist
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$PLIST_NAME</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$PROJECT_DIR/scripts/start-booth.sh</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$HOME/Library/Logs/MayeBooth/stdout.log</string>
  <key>StandardErrorPath</key>
  <string>$HOME/Library/Logs/MayeBooth/stderr.log</string>
  <key>WorkingDirectory</key>
  <string>$PROJECT_DIR</string>
</dict>
</plist>
EOF

# Create log directory
mkdir -p "$HOME/Library/Logs/MayeBooth"

# Load the agent
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo ""
echo "✅ LaunchAgent 安装完成！"
echo "   下次登录时 MayeBooth 将自动启动"
echo ""
echo "   查看日志: tail -f ~/Library/Logs/MayeBooth/stdout.log"
echo "   卸载自启: launchctl unload $PLIST_PATH"
