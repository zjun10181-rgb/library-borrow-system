# 📚 图书馆借书系统（单机版）

一个**完全离线、数据存在自己电脑硬盘上**的图书馆借书管理系统。
不需要联网、不需要注册账号、不需要服务器，复制到任何一台电脑即可使用。

---

## 一、给你的朋友：如何安装和使用

### 准备工作（一次性）

需要电脑里装有 **Node.js**（免费的运行环境，只装一次）：

1. 打开浏览器访问：**https://nodejs.org**
2. 点击左侧绿色按钮 **下载 LTS 版本**（如 20.x 或 22.x）
3. 下载完成后双击安装，一路点「下一步」即可

> 不确定装没装过？运行启动脚本时如果提示"未检测到 Node.js"，照着上面装一次就行。

### 启动系统

**Windows 用户**：双击 `start.bat`
**Mac 用户**：在文件夹里右键 `start.sh` → 「打开」→ 在终端中运行

首次启动会自动完成以下事情（需要几分钟，之后每次启动都很快）：

1. 自动安装依赖（只需第一次）
2. 自动构建前端页面（只需第一次）
3. 自动创建数据库 `data/library.db` 并写入 132 本初始图书
4. 自动打开浏览器进入系统

### 使用说明

| 账号 | 密码 | 身份 |
|------|------|------|
| `admin@library.com` | `admin123` | 管理员（可管理所有用户、图书、审核） |

- 其他人注册后，需要管理员在「用户管理」中点击**批准**后才能登录。
- 管理员可以给用户**重置密码**、修改角色。

### 关闭系统

直接关闭启动窗口即可。所有数据已经实时保存到硬盘，**不会丢失**。

---

## 二、数据备份与迁移

**整个系统最重要的一个文件：`data/library.db`**

- ✅ **备份**：把 `data/` 文件夹里的 `library.db` 拷贝到 U 盘/网盘即可
- ✅ **恢复**：把备份的 `library.db` 放回 `data/` 文件夹，重新启动即可
- ✅ **迁移**：把整个文件夹拷到新电脑（或只拷贝 `library.db` + 程序文件夹），重新启动即可

> 提示：可以把这个文件加入到 Windows「文件历史记录」或 Mac「时间机器」自动备份。

---

## 三、技术说明（给维护者）

- **前端**：Vite + React + TypeScript（原有代码几乎未动）
- **后端**：Node.js + Express + better-sqlite3（同步 SQLite 驱动）
- **数据库**：SQLite 单文件（`data/library.db`），WAL 模式
- **密码安全**：Node 内置 `crypto.scrypt` 加盐哈希，数据库里**没有明文密码**
- **登录保持**：HMAC 签名 Token（7 天有效），令牌存于浏览器 localStorage
- **端口**：后端 `3001`，开发时前端通过 Vite 代理 `/api` 转发到本地后端

### 目录结构

```
├── server/                 # 后端
│   ├── index.js            # Express 入口（含生产模式静态托管）
│   ├── db.js               # 建表 + 幂等种子
│   ├── seed.js             # 种子数据写入（密码 scrypt 哈希）
│   ├── seed-data.js        # 种子数据（由 convert-mock 从前端 mockData 生成）
│   ├── auth.js             # 密码哈希 / Token / 认证路由
│   └── routes/             # users / books / borrow / families / common
├── data/                   # 数据库文件目录（备份拷贝这里）
├── src/utils/supabase.ts   # 前端数据层（统一 fetch /api，无 localStorage 数据存储）
├── start.sh                # Mac/Linux 一键启动
├── start.bat               # Windows 一键启动
└── vite.config.ts          # /api 代理指向 localhost:3001
```

### 开发调试

```bash
# 终端 1：启动后端（端口 3001）
npm run dev:server

# 终端 2：启动前端（端口 5173，自动代理 /api）
npm run dev
```

### 修改种子数据

初始数据来自 `src/utils/mockData.ts`，修改后执行：

```bash
cd server && npm run seed:convert   # 重新生成 seed-data.js
# 删除 data/library.db 后重启，即可重新灌入新种子数据
```

---

## 四、已知限制（单机版设计如此）

- 数据只存在本机，**不跨设备共享**（这是单机版的初衷）
- 需要访问本机 `localhost`，手机等其他设备无法直接访问
- 封面图使用在线占位图服务，完全离线时封面可能不显示，不影响功能

---

祝使用愉快！
