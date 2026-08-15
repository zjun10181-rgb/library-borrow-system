/**
 * 种子数据转换脚本
 * 读取前端 src/utils/mockData.ts，将其中导出的 mock 数据转换为
 * 后端 server/seed-data.js（纯 JS 模块），供首次建库时写入。
 *
 * 运行方式: node scripts/convert-mock.mjs
 * 该脚本是开发期工具，前端 mockData.ts 是种子数据的唯一来源，
 * 修改种子数据后重新运行本脚本即可同步到后端。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '../../src/utils/mockData.ts');
const OUT = join(__dirname, '../seed-data.js');

const source = readFileSync(SRC, 'utf8');

// 1. 删除 import type 行（类型注解由下一步去掉后不再需要）
let js = source
  .split('\n')
  .filter((line) => !line.trim().startsWith('import type'))
  .join('\n');

// 2. 去掉 TS 类型注解: `export const mockXxx: Type = ` -> `export const mockXxx = `
js = js.replace(/export const (\w+): [^{=]+ = /g, 'export const $1 = ');

// 3. 处理残留的 TS 类型注解（函数签名、Record 等）
//    function generateCover(title: string, ...): string { -> function generateCover(title, ...) {
js = js.replace(/function (\w+)\(([^)]*)\): \w+ \{/g, (_, name, params) => {
  const clean = params.split(',').map((p) => p.split(':')[0].trim()).join(', ');
  return `function ${name}(${clean}) {`;
});
//    const basePrompts: Record<string, string> = { -> const basePrompts = {
js = js.replace(/: Record<[^>]+> = /g, ' = ');
//    其余 `: number`、`: boolean` 等变量注解（出现在函数体内，如 `const seed: number = ...`）
js = js.replace(/\b(const|let|var) (\w+): (\w+)(\[\])? = /g, '$1 $2 = ');

// 4. 文件头注释
const header = `// 本文件由 scripts/convert-mock.mjs 自动生成，请勿手动修改。
// 种子数据唯一来源: src/utils/mockData.ts
// 修改数据后执行: npm run seed:convert (在 server 目录下)

`;

writeFileSync(OUT, header + js.trim() + '\n');
console.log(`✅ 已生成 ${OUT}`);

// 校验导出是否齐全
const required = ['mockUsers', 'mockPasswords', 'mockBooks', 'mockBorrowRecords', 'mockFamilies', 'mockModules'];
const missing = required.filter((name) => !js.includes(`export const ${name}`));
if (missing.length) {
  console.error(`❌ 缺少导出: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`✅ 导出校验通过: ${required.join(', ')}`);
