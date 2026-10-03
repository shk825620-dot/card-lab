/**
 * 零依赖本地预览服务器。
 *
 * 存在的意义：这个项目不装任何依赖也应该能直接跑起来。
 *   1) 不依赖 vite（某些受限环境里 vite 的 Windows 分支会调 exec('net use') 而失败）；
 *   2) 静态映射和线上完全一致：**仓库根目录就是网站根目录**，
 *      所以本地看到的路径和 GitHub Pages 上的一模一样，不会出现"本地对、线上 404"。
 *   3) 路径穿越会被拒绝，且不会把 node_modules 和开发配置暴露出去。
 *
 * 用法：node server.mjs [端口]
 */

import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here);
const PORT = Number.parseInt(process.argv[2] ?? process.env.PORT ?? '5178', 10);
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 找不到这个文件');
}

function isInside(parent, child) {
  return child === parent || child.startsWith(parent + path.sep);
}

/**
 * 把请求路径解析成磁盘上的绝对路径，并按线上同样的规则判断可见性。
 * 返回 null 表示这个路径不存在或不允许访问。
 */
function resolveTarget(pathname) {
  const relative = pathname.replace(/^\/+/, '');
  if (relative === '') {
    return path.join(ROOT, 'index.html');
  }

  const target = path.resolve(ROOT, relative);
  if (!isInside(ROOT, target)) return null;

  // 线上 GitHub Pages 会把整个仓库都发布出去，这里保守一点：
  // 只挡住本机开发用的东西，其余按原路径提供，规则和线上保持一致。
  const topSegment = relative.split(/[\\/]/)[0].toLowerCase();
  if (topSegment === 'node_modules' || topSegment.startsWith('.')) return null;
  if (/\.(json|mjs|lock)$/i.test(relative)) return null;

  return isFile(target) ? target : null;
}

function isFile(target) {
  try {
    return statSync(target).isFile();
  } catch {
    return false;
  }
}

const server = createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${HOST}`).pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 请求地址无法解析');
    return;
  }

  if (pathname.includes('\0')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 拒绝访问');
    return;
  }

  const target = resolveTarget(pathname);
  if (!target) {
    notFound(res);
    return;
  }

  const stats = statSync(target);
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(target).toLowerCase()] ?? 'application/octet-stream',
    'Content-Length': stats.size,
    // 开发期禁用缓存，改了文件刷新就能看到
    'Cache-Control': 'no-store, must-revalidate',
  });
  createReadStream(target).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`card-lab 本地预览： http://${HOST}:${PORT}/`);
  console.log('按 Ctrl+C 停止');
});
