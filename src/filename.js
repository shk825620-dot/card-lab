/**
 * 导出文件名生成（纯函数）。
 *
 * 文件名会带上日期时间，这样连续导出多张不会互相覆盖；
 * 同时会清掉 Windows / macOS 不允许的字符，避免下载失败。
 */

import { resolveSize } from './theme.js';

const ILLEGAL_CHARS = /[\\/:*?"<>|]/g;
const HORIZONTAL_WHITESPACE = /[ \t\f\v\u00a0\u3000]+/g;
const ALL_WHITESPACE = /\s+/g;
const EDGE_DOTS = /^[.\s]+|[.\s]+$/g;

const MAX_TEXT_PART = 40;

/** 把一段文字清洗成可以放进文件名的片段；清洗后可能为空字符串。 */
export function sanitizeForFileName(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(ILLEGAL_CHARS, '-')
    .replace(HORIZONTAL_WHITESPACE, '-')
    .replace(ALL_WHITESPACE, '-')
    .replace(/-{2,}/g, '-')
    .replace(EDGE_DOTS, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_TEXT_PART);
}

function pad(value, length = 2) {
  return String(value).padStart(length, '0');
}

function stamp(date) {
  const at = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}-${pad(at.getHours())}${pad(
    at.getMinutes(),
  )}`;
}

/**
 * 生成形如 `card-lab-2026-10-03-1612-square.png` 的文件名。
 * 文字清洗后为空时使用 `card` 占位；未知尺寸 id 回退到 square。
 */
export function buildFileName(text, sizeId, at = new Date()) {
  const textPart = sanitizeForFileName(text) || 'card';
  const size = resolveSize(sizeId);
  return `card-lab-${stamp(at)}-${textPart}-${size.id}.png`;
}
