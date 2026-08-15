import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './db.js';
import { authRouter } from './auth.js';
import { usersRouter } from './routes/users.js';
import { booksRouter } from './routes/books.js';
import { borrowRouter } from './routes/borrow.js';
import { familiesRouter } from './routes/families.js';
import { commonRouter } from './routes/common.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);

// 初始化数据库（建表 + 幂等种子）
initDatabase();

const app = express();
app.use(cors());
app.use(express.json());

// 简单请求日志
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  }
  next();
});

// API 路由
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/books', booksRouter);
app.use('/api/borrow-records', borrowRouter);
app.use('/api/families', familiesRouter);
app.use('/api/common', commonRouter);

// 生产模式：托管前端构建产物
// 构建产物在 dist/ 根目录，但资源引用带 /library/ 前缀（vite base），
// 因此将 dist/ 挂载到 /library 前缀下，并支持根路径跳转与 SPA 回退。
const distDir = join(__dirname, '../dist');

if (existsSync(distDir)) {
  // /library/xxx -> dist/xxx
  app.use('/library', express.static(distDir));
  // 根路径跳转到 /library/
  app.get('/', (_req, res) => res.redirect('/library/'));
  // SPA 回退：未知 /library 路径返回前端入口
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    if (req.path.startsWith('/library')) {
      return res.sendFile(join(distDir, 'index.html'));
    }
    return res.redirect('/library/');
  });
}

// 错误兜底
app.use((err, _req, res, _next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`\n📚 图书馆借书系统后端已启动`);
  console.log(`   API 地址: http://localhost:${PORT}/api`);
  if (existsSync(distDir)) {
    console.log(`   前端地址: http://localhost:${PORT}/library/`);
  }
  console.log(`   数据库文件: data/library.db（备份 = 拷贝该文件）\n`);
});
