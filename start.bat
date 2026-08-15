@echo off
chcp 65001 >nul
title 图书馆借书系统
echo.
echo ==========================================
echo   图书馆借书系统 正在启动...
echo ==========================================
echo.

cd /d "%~dp0"

REM 1. 检查 Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js！
  echo.
  echo 请先安装 Node.js（免费的）：
  echo   1. 打开浏览器访问 https://nodejs.org
  echo   2. 下载 LTS 版本（左侧绿色按钮）
  echo   3. 安装时一路点"下一步"即可
  echo.
  echo 安装完成后，重新双击本脚本。
  echo.
  pause
  exit /b 1
)

echo [OK] 已检测到 Node.js: %node -v%...

REM 2. 安装前端依赖
if not exist "node_modules" (
  echo.
  echo [等待] 首次运行，正在安装依赖，可能需要几分钟...
  call npm install
) else (
  echo [OK] 前端依赖已就绪
)

REM 3. 安装后端依赖
if not exist "server\node_modules" (
  echo.
  echo [等待] 正在安装后端依赖...
  pushd server
  call npm install
  popd
) else (
  echo [OK] 后端依赖已就绪
)

REM 4. 构建前端
if not exist "dist" (
  echo.
  echo [等待] 首次构建前端页面...
  call npm run build
)

echo.
echo [OK] 启动成功！浏览器将自动打开：
echo      http://localhost:3001/library/
echo.
echo      演示管理员账号: admin@library.com / admin123
echo      关闭本窗口即停止系统，数据不会丢失。
echo.

REM 5. 启动后端（自动打开浏览器）
start "" http://localhost:3001/library/
cd server
node index.js

pause
