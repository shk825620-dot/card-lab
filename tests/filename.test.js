import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFileName, sanitizeForFileName } from '../src/filename.js';

const AT = new Date(2026, 9, 3, 16, 12, 45);

test('生成 card-lab-日期-时间-文字-尺寸.png', () => {
  assert.equal(buildFileName('随便', 'square', AT), 'card-lab-2026-10-03-1612-随便-square.png');
});

test('去掉首尾空白并截断到 40 字', () => {
  const name = buildFileName(`${'很长的文字'.repeat(20)}`, 'story', AT);
  assert.ok(name.startsWith('card-lab-2026-10-03-1612-很长的文字'));
  assert.ok(name.endsWith('-story.png'));
  const textPart = name.replace('card-lab-2026-10-03-1612-', '').replace('-story.png', '');
  assert.equal(textPart.length, 40);
});

test('文件名里的多行、斜杠与特殊字符被替换', () => {
  assert.equal(sanitizeForFileName('a/b\\c:d*e?f"g<h>i|j'), 'a-b-c-d-e-f-g-h-i-j');
  assert.equal(sanitizeForFileName('第一行\n第二行'), '第一行-第二行');
  assert.equal(sanitizeForFileName('   '), '');
  assert.equal(sanitizeForFileName('...'), '');
});

test('空文字时回退到 card 占位', () => {
  assert.equal(buildFileName('   ', 'wide', AT), 'card-lab-2026-10-03-1612-card-wide.png');
  assert.equal(buildFileName(undefined, 'square', AT), 'card-lab-2026-10-03-1612-card-square.png');
});

test('未知尺寸 id 回退到 square', () => {
  assert.equal(buildFileName('你好', 'gigantic', AT), 'card-lab-2026-10-03-1612-你好-square.png');
});

test('不传时间时使用当前时间', () => {
  const name = buildFileName('你好', 'square');
  assert.match(name, /^card-lab-\d{4}-\d{2}-\d{2}-\d{4}-你好-square\.png$/);
});

test('中文与 emoji 被保留', () => {
  assert.equal(buildFileName('你好 🎉', 'square', AT), 'card-lab-2026-10-03-1612-你好-🎉-square.png');
});
