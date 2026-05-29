# MayeBooth 🎀

> 完全离线的专业韩式 Photobooth 系统 | MacBook 主控 × iPad 触摸遥控 × Sony A7C

[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://typescriptlang.org)

---

## ✨ 功能特色

| 功能 | 状态 |
|---|---|
| 完全离线运行 | ✅ |
| Sony A7C Watch Folder 拍摄 | ✅ |
| Fujifilm X-S20 备用支持 | ✅ |
| iPad 触摸 PWA 控制屏 | ✅ |
| 实时取景预览 (WebRTC) | ✅ |
| 3/2/1 倒计时 + 闪光效果 | ✅ |
| 韩式四格模板 | ✅ |
| 胶片条 / Polaroid / Y2K / Kawaii | ✅ |
| 模板编辑器 (Konva.js) | ✅ |
| 300 DPI 高质量输出 | ✅ |
| GIF 生成 (ffmpeg) | ✅ |
| Epson L8168 自动打印 | ✅ |
| Instax Mini Link 2 导出 | ✅ (手动 App 打印) |
| 二维码局域网下载 | ✅ |
| 本地图库 | ✅ |
| Admin Dashboard | ✅ |
| macOS 开机自启 | ✅ |
| SQLite 本地数据库 | ✅ |

---

## 🏗 系统架构

```
Sony A7C (PC Remote 模式)
       ↓ 自动保存到 Watch Folder
MacBook (主控)
  ├─ booth-server (Node.js/Express/Socket.IO, port 4000)
  │    ├─ Camera Engine (chokidar 文件监听)
  │    ├─ Image Engine (Sharp 图像处理)
  │    ├─ Template Engine (node-canvas 模板渲染)
  │    ├─ Print Engine (lp → Epson L8168)
  │    ├─ GIF Engine (ffmpeg)
  │    ├─ QR Engine (qrcode)
  │    └─ SQLite DB (better-sqlite3)
  └─ booth-client (Next.js 15 PWA, port 3000)
       ├─ Booth 流程界面
       ├─ 模板编辑器 (Konva.js)
       ├─ Admin Dashboard
       └─ Socket.IO Client
            ↓ 局域网 WebSocket
iPad Safari (全屏 PWA)
  └─ 触摸控制界面
```

---

## 🚀 快速开始

### 1. 环境要求

- macOS 13+ (Ventura 或更新)
- Node.js 20+
- pnpm 9+
- [ffmpeg](https://ffmpeg.org/) (GIF 功能)：`brew install ffmpeg`

### 2. 安装

```bash
# 克隆项目
git clone <repo> MayeBooth
cd MayeBooth

# 一键安装
bash scripts/setup.sh
```

### 3. 启动

```bash
# 开发模式（推荐）
pnpm dev

# 或使用 Booth Kiosk 模式
bash scripts/start-booth.sh
```

访问：
- **MacBook**: http://localhost:3000
- **iPad**: 在 Safari 中打开 `http://<MacBook的IP>:3000`

### 4. iPad 设置

1. 在 iPad Safari 中打开 MayeBooth 地址
2. 点击分享按钮 → 「添加到主屏幕」
3. 从主屏幕打开即为全屏 PWA 模式
4. 横竖屏均支持

---

## 📷 Sony A7C 相机配置

### 方案一：PC Remote + Watch Folder（推荐）

1. 相机菜单 → 网络 → PC Remote 设置 → 开启
2. 在 Sony Imaging Edge Remote 中：
   - 连接相机
   - 设置「自动保存」路径为：`~/Pictures/MayeBooth-Watch`
3. 在 MayeBooth Admin 中，确认 Watch Folder 路径一致

### 方案二：WiFi 直连

1. 相机 WiFi → 连接到 MacBook 热点
2. 使用 Imaging Edge Mobile 远程拍摄
3. 照片保存到 Watch Folder

---

## 🖨️ 打印机配置

### Epson L8168

```bash
# 安装驱动后，查看打印机名称
lpstat -p

# 在 Admin > 设置 中填入打印机名称
# 例如: EPSON_L8168
```

### Instax Mini Link 2

- MayeBooth 会导出适配尺寸的图片 (731×543px)
- 用官方「Instax Mini Link」App 打开并打印

---

## 📁 目录结构

```
MayeBooth/
├── apps/
│   ├── booth-client/      # Next.js 15 前端
│   └── booth-server/      # Node.js 后端
├── packages/
│   └── shared/            # 共享 TypeScript 类型
├── assets/
│   ├── templates/         # 内置模板 JSON
│   ├── overlays/          # PNG overlay 素材
│   ├── stickers/          # 贴纸素材
│   ├── fonts/             # Pretendard 字体
│   ├── sounds/            # 音效文件
│   └── luts/              # .cube LUT 文件
├── storage/               # 运行时数据 (自动创建)
│   ├── sessions/          # 拍摄会话
│   ├── exports/           # 合成输出
│   └── gifs/              # GIF 输出
└── scripts/
    ├── setup.sh           # 安装脚本
    ├── start-booth.sh     # Kiosk 启动
    └── create-launchagent.sh # 开机自启
```

---

## 📋 模板 JSON Schema

```json
{
  "id": "my-template",
  "name": "我的模板",
  "category": "korean",
  "size": { "width": 1200, "height": 1800, "dpi": 300 },
  "background": { "color": "#ffffff" },
  "overlay": { "src": "overlays/border.png", "opacity": 1 },
  "slots": [
    {
      "id": "s1",
      "x": 60, "y": 60,
      "width": 510, "height": 382,
      "radius": 8,
      "fit": "cover"
    }
  ],
  "texts": [
    {
      "id": "date",
      "type": "date",
      "format": "YYYY.MM.DD",
      "x": 600, "y": 980,
      "font": "Pretendard",
      "size": 32,
      "color": "#555",
      "align": "center"
    }
  ],
  "stickers": [],
  "photoCount": 4,
  "lut": null
}
```

---

## ⚙️ 配置

所有配置在 Admin Dashboard 中管理，也可直接编辑 SQLite 数据库中的 settings 表。

| 设置项 | 默认值 | 说明 |
|---|---|---|
| watchFolder | ~/Pictures/MayeBooth-Watch | 相机照片监听目录 |
| countdownSeconds | 3 | 倒计时秒数 |
| intervalBetweenShots | 2000 | 拍摄间隔 (ms) |
| photoCount | 4 | 每次拍摄张数 |
| autoPrint | false | 自动打印 |
| printCopies | 1 | 打印份数 |
| qrExpireMinutes | 60 | QR 二维码过期时间 |
| brandName | MayeBooth | 品牌名称 |

---

## 🔧 开机自启（Kiosk 模式）

```bash
bash scripts/create-launchagent.sh
```

---

## 🛠 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 查看后端日志
pnpm --filter booth-server dev

# 数据库位置
storage/mayebooth.db
```

---

## 📡 Socket.IO Events

| Event | 方向 | 说明 |
|---|---|---|
| `session:create` | Client→Server | 创建并开始会话 |
| `session:update` | Server→Client | 会话状态更新 |
| `camera:countdown` | Server→Client | 倒计时 tick |
| `camera:flash` | Server→Client | 拍照闪光 |
| `camera:captured` | Server→Client | 照片已捕获 |
| `template:rendered` | Server→Client | 模板合成完成 |
| `print:request` | Client→Server | 请求打印 |
| `print:status` | Server→Client | 打印状态 |
| `settings:update` | 双向 | 设置同步 |

---

## 📄 License

MIT License — 可商用，请保留原始 credit。
