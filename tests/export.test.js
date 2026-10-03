import test from 'node:test';
import assert from 'node:assert/strict';

import { readLogicalSize, exportBox } from '../src/export.js';
import { resolveSize } from '../src/theme.js';

// export.js 里的 exportCard 依赖真实的 DOM 与 modern-screenshot，
// 这里只覆盖不碰浏览器的纯逻辑：从卡片上读回逻辑尺寸。
// 这些尺寸由 render.js 写成内联样式，是"预览所见 = 导出所得"的关键契约。

function fakeCard(width, height) {
  return { style: { width, height } };
}

test('从内联样式读回逻辑尺寸', () => {
  assert.deepEqual(readLogicalSize(fakeCard('1080px', '1440px')), { w: 1080, h: 1440 });
});

test('没有设置尺寸时返回 0，让调用方报错而不是导出空图', () => {
  assert.deepEqual(readLogicalSize(fakeCard('', '')), { w: 0, h: 0 });
  assert.deepEqual(readLogicalSize(fakeCard('auto', 'auto')), { w: 0, h: 0 });
});

test('小数尺寸也能解析', () => {
  assert.deepEqual(readLogicalSize(fakeCard('1920.5px', '1080.25px')), { w: 1920.5, h: 1080.25 });
});

test('横版画布撑宽度，高度按比例', () => {
  const box = exportBox({ w: 1920, h: 1080 });
  assert.deepEqual(box, { width: 1920, height: 1080 });
});

test('竖版画布撑高度，宽度按比例', () => {
  assert.deepEqual(exportBox({ w: 1080, h: 1440 }), { width: 1080, height: 1440 });
  assert.deepEqual(exportBox({ w: 1080, h: 1920 }), { width: 1080, height: 1920 });
});

test('方形画布撑高度', () => {
  assert.deepEqual(exportBox({ w: 1080, h: 1080 }), { width: 1080, height: 1080 });
});

test('每种内置画布都能得到与逻辑尺寸一致的外框', () => {
  for (const size of ['square', 'portrait', 'story', 'wide']) {
    const resolved = resolveSize(size);
    const box = exportBox({ w: resolved.w, h: resolved.h });
    assert.equal(box.width, resolved.w, `${size} 外框宽度不对`);
    assert.equal(box.height, resolved.h, `${size} 外框高度不对`);
  }
});
