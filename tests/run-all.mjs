import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// 沙箱里 `node --test` 会因为 spawn EPERM 失败，
// 所以这里逐个直接执行测试文件（node:test 在被直接执行时同样会报告结果）。
const here = path.dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here)
  .filter((name) => name.endsWith('.test.js'))
  .sort();

if (files.length === 0) {
  console.error('没有找到任何 *.test.js 文件');
  process.exit(1);
}

let failed = 0;
for (const file of files) {
  const full = path.join(here, file);
  console.log(`\n=== ${file} ===`);
  const result = spawnSync(process.execPath, [full], { stdio: 'inherit' });
  if (result.status !== 0) {
    failed += 1;
  }
}

console.log(`\n${files.length - failed}/${files.length} 个测试文件通过`);
process.exit(failed === 0 ? 0 : 1);
