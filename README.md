# 📚 图书馆借书系统（单机版）

一个**完全离线、数据保存在本地硬盘**的图书馆借书管理系统。无需联网、无需云端服务器，复制到任何电脑即可独立运行。

## ✨ 功能

- 👥 用户管理：注册 / 审核 / 角色（学生、教师、家长、管理员）/ 重置密码
- 📖 图书管理：132 本初始图书，增删改查、按分类/关键词筛选
- 📤 借书 / 还书：借阅登记、到期提醒、库存自动增减
- 🏠 家庭图书馆：创建家庭、添加成员、共享家庭藏书
- 📊 数据看板：图书总量、在架数量、借出数量、用户统计
- 🔐 密码安全：scrypt 加盐哈希存储，Token 登录（7 天有效）

## 🚀 快速开始（给使用者）

**前提**：安装 [Node.js](https://nodejs.org) LTS 版本（一次性）。

| 平台 | 启动方式 |
|------|----------|
| Windows | 双击 `start.bat` |
| Mac / Linux | 运行 `start.sh` |

首次启动自动完成依赖安装、前端构建、数据库初始化（写入初始图书与演示账号），随后自动打开浏览器。

**演示管理员账号**：`admin@library.com` / `admin123`

## 💾 数据备份

所有数据保存在 `data/library.db`（SQLite 单文件）。**备份 = 拷贝这个文件**，恢复时放回原位置即可。

## 🧑‍💻 开发调试

```bash
npm install
npm install --prefix server   # 后端依赖

npm run dev:server            # 终端 1：后端（端口 3001）
npm run dev                   # 终端 2：前端（端口 5173）
```

## 🗂 技术栈

- 前端：Vite + React 18 + TypeScript + Tailwind CSS + Zustand
- 后端：Node.js + Express + better-sqlite3（同步 SQLite）
- 认证：scrypt 密码哈希 + HMAC 签名 Token
- 部署：生产模式由 Express 托管前端构建产物（单端口访问）

详见 [README-交付.md](./README-交付.md)。
