#!/bin/bash
# =============================================================
# 图书馆借书系统 - 一键启动脚本 (Mac / Linux)
# 首次使用会自动安装依赖并构建前端，之后每次双击/运行即可。
# 数据保存在 data/library.db，备份 = 拷贝该文件。
# =============================================================

set -e
cd "$(dirname "$0")"

echo ""
echo "=========================================="
echo "   📚 图书馆借书系统 正在启动..."
echo "=========================================="
echo ""

# 1. 检查 Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ 未检测到 Node.js！"
  echo ""
  echo "请先安装 Node.js（免费的）："
  echo "  1. 打开浏览器访问 https://nodejs.org"
  echo "  2. 下载 LTS 版本（左侧绿色按钮）"
  echo "  3. 安装时一路点“下一步”即可"
  echo ""
  echo "安装完成后，重新双击本脚本。"
  echo ""
  read -p "按回车键退出..." _
  exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ 已检测到 Node.js: $NODE_VERSION"

# 2. 安装前端依赖（如未安装）
if [ ! -d "node_modules" ]; then
  echo ""
  echo "⏳ 首次运行，正在安装依赖，可能需要几分钟..."
  npm install
else
  echo "✅ 前端依赖已就绪"
fi

# 3. 安装后端依赖（如未安装）
if [ ! -d "server/node_modules" ]; then
  echo ""
  echo "⏳ 正在安装后端依赖..."
  (cd server && npm install)
else
  echo "✅ 后端依赖已就绪"
fi

# 4. 构建前端（如未构建过或源码有更新）
if [ ! -d "dist" ]; then
  echo ""
  echo "⏳ 首次构建前端页面..."
  npm run build
fi

# 5. 启动后端（后端会同时托管前端页面 + API）
echo ""
echo "✅ 启动成功！浏览器将自动打开："
echo "   http://localhost:3001/library/"
echo ""
echo "   演示管理员账号: admin@library.com / admin123"
echo "   关闭窗口即停止系统，数据不会丢失。"
echo ""

# 等待几秒后自动打开浏览器
(sleep 2 && (open "http://localhost:3001/library/" 2>/dev/null || true)) &

# 运行后端（前台，Ctrl+C 停止）
cd server
exec node index.js
