/**
 * 把 modern-screenshot 的 UMD 构建下载并锁定到 vendor/。
 *
 * 为什么不放进 package.json 依赖：
 *   1) 首次 clone 的人不装任何依赖也能直接跑起来；
 *   2) 导出用的库必须和仓库里锁定的字节一致，避免版本漂移导致导出结果变化。
 *
 * 用法：node scripts/vendor-modern-screenshot.mjs
 * 想升级版本：node scripts/vendor-modern-screenshot.mjs 4.8.0
 */

import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PINNED_VERSION = '4.7.0';
const version = process.argv[2] ?? PINNED_VERSION;

const here = path.dirname(fileURLToPath(import.meta.url));
// 注意：仓库根目录就是网站根目录，所以 vendor/ 放在最外层，
// 不能放进会被当成构建输入的目录里。
const outDir = path.join(here, '..', 'vendor');
const outFile = path.join(outDir, 'modern-screenshot.umd.js');

/** 极简 tar 解析：够用来从 npm tarball 里取一个文件。 */
function extractFromTar(tarBuffer, wantedName) {
  let offset = 0;
  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    if (name === '') break;

    const sizeField = header.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim();
    const size = Number.parseInt(sizeField, 8) || 0;
    const dataStart = offset + 512;

    if (name === wantedName || name === `package/${wantedName}`) {
      return tarBuffer.subarray(dataStart, dataStart + size);
    }

    offset = dataStart + Math.ceil(size / 512) * 512;
  }
  return null;
}

const metaUrl = `https://registry.npmjs.org/modern-screenshot/${version}`;
const metaResponse = await fetch(metaUrl, { signal: AbortSignal.timeout(30000) });
if (!metaResponse.ok) {
  throw new Error(`取包信息失败：${metaUrl} -> HTTP ${metaResponse.status}`);
}
const meta = await metaResponse.json();

const tarballUrl = meta.dist?.tarball;
if (!tarballUrl) {
  throw new Error(`包信息里没有 tarball 地址：${metaUrl}`);
}

const tarballResponse = await fetch(tarballUrl, { signal: AbortSignal.timeout(60000) });
if (!tarballResponse.ok) {
  throw new Error(`下载 tarball 失败：${tarballUrl} -> HTTP ${tarballResponse.status}`);
}

const tarball = Buffer.from(await tarballResponse.arrayBuffer());
const tar = gunzipSync(tarball);

// 优先用 UMD，退回 CJS 构建（两者在浏览器里都会挂到 window 上）。
const candidates = ['dist/index.js', 'dist/index.cjs', 'dist/index.umd.js'];
let content = null;
let usedName = null;
for (const name of candidates) {
  const found = extractFromTar(tar, name);
  if (found && found.length > 0) {
    content = found;
    usedName = name;
    break;
  }
}

if (!content) {
  throw new Error(`tar 里找不到任何构建产物，试过：${candidates.join(', ')}`);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, content);

const sha256 = createHash('sha256').update(content).digest('hex');
const banner = [
  `// modern-screenshot v${version} — ${usedName}`,
  `// sha256: ${sha256}`,
  `// 来源: ${tarballUrl}`,
  `// 许可: MIT (见 https://github.com/qq15725/modern-screenshot)`,
  '',
].join('\n');

writeFileSync(outFile, banner + content.toString('utf8'));

console.log(`已写入 ${outFile}`);
console.log(`版本 ${version}  文件 ${usedName}  大小 ${(content.length / 1024).toFixed(1)} KB`);
console.log(`sha256(原始) ${sha256}`);
