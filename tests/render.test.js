import test from 'node:test';
import assert from 'node:assert/strict';

import { densityFor } from '../src/render.js';
import { resolveSize } from '../src/theme.js';

const SQUARE = resolveSize('square');
const STORY = resolveSize('story');

test('短文本使用正常密度', () => {
  assert.equal(densityFor('你好', SQUARE), null);
  assert.equal(densityFor('a'.repeat(70), SQUARE), null);
});

test('中等长度文本收紧为 compact', () => {
  assert.equal(densityFor('a'.repeat(71), SQUARE), 'compact');
  assert.equal(densityFor('a'.repeat(160), SQUARE), 'compact');
});

test('超长文本进一步收紧为 tiny', () => {
  assert.equal(densityFor('a'.repeat(161), SQUARE), 'tiny');
});

test('长画布能容纳更多文字才降级', () => {
  // 9:16 长图的容量系数是 1.6，所以 160 字仍是 compact
  assert.equal(densityFor('a'.repeat(160), STORY), 'compact');
  assert.equal(densityFor('a'.repeat(100), STORY), null);
});

test('非字符串输入按 0 长度处理', () => {
  assert.equal(densityFor(undefined, SQUARE), null);
  assert.equal(densityFor(null, SQUARE), null);
  assert.equal(densityFor(12345, SQUARE), null);
});
