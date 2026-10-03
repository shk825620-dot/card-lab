import test from 'node:test';
import assert from 'node:assert/strict';

import { computeFit, MIN_SCALE } from '../src/fit.js';

const CARD = { cardW: 1080, cardH: 1080, padding: 20 };

test('padding 在两侧各减一次，按可用宽度等比缩放', () => {
  const fit = computeFit({ ...CARD, containerW: 560, containerH: 800 });
  // 可用宽度 = 560 - 20*2 = 520
  assert.equal(fit.scale, 520 / 1080);
  assert.equal(fit.displayW, 520);
  assert.equal(fit.displayH, 520);
});

test('受高度限制时取较小的缩放比', () => {
  const fit = computeFit({ ...CARD, containerW: 560, containerH: 292 });
  // 可用高度 = 292 - 20*2 = 252
  assert.equal(fit.scale, 252 / 1080);
  assert.ok(fit.displayH <= 292);
  assert.ok(fit.displayW <= 560);
});

test('容器比留白还小时忽略留白，仍按容器宽度缩放', () => {
  // 容器 80px 小于 padding*2 = 80px，此时留白失去意义
  const fit = computeFit({ cardW: 1080, cardH: 1080, padding: 40, containerW: 80, containerH: 80 });
  assert.equal(fit.scale, 80 / 1080);
  assert.equal(fit.displayW, 80);
});

test('容器足够大时留白正常扣除', () => {
  const fit = computeFit({ cardW: 1080, cardH: 1080, padding: 40, containerW: 400, containerH: 400 });
  assert.equal(fit.scale, 320 / 1080);
  assert.equal(fit.displayW, 320);
});

test('极窄容器会被抬到 MIN_SCALE，避免卡片缩成看不见', () => {
  const fit = computeFit({ cardW: 1080, cardH: 1080, padding: 0, containerW: 10, containerH: 10 });
  assert.equal(fit.scale, MIN_SCALE);
  assert.equal(fit.displayW, 1080 * MIN_SCALE);
});

test('容器为 0 时返回最小安全缩放而不是 0', () => {
  const fit = computeFit({ ...CARD, containerW: 0, containerH: 0 });
  assert.equal(fit.scale, MIN_SCALE);
  assert.equal(fit.displayW, 1080 * MIN_SCALE);
  assert.equal(fit.displayH, 1080 * MIN_SCALE);
});

test('非法输入回退到最小安全缩放', () => {
  assert.equal(computeFit({}).scale, MIN_SCALE);
  assert.equal(computeFit({ cardW: NaN, cardH: 1080, containerW: 100, containerH: 100 }).scale, MIN_SCALE);
  assert.equal(computeFit({ cardW: 0, cardH: 0, containerW: 100, containerH: 100 }).scale, MIN_SCALE);
});

test('缩放结果永远为正且不超出可用区域', () => {
  const cases = [
    { containerW: 1, containerH: 99999 },
    { containerW: 99999, containerH: 1 },
    { containerW: 375, containerH: 667 },
    { containerW: 1440, containerH: 900 },
  ];
  for (const c of cases) {
    const fit = computeFit({ ...CARD, ...c });
    assert.ok(fit.scale > 0, `scale 必须为正: ${JSON.stringify(c)}`);
    // 可用区域小于最小安全尺寸时允许溢出，但不得小于最小安全尺寸。
    const allowedW = Math.max(c.containerW - 20 * 2, 1080 * MIN_SCALE);
    const allowedH = Math.max(c.containerH - 20 * 2, 1080 * MIN_SCALE);
    assert.ok(fit.displayW <= allowedW + 1e-9, `宽度溢出: ${JSON.stringify(c)} -> ${fit.displayW}`);
    assert.ok(fit.displayH <= allowedH + 1e-9, `高度溢出: ${JSON.stringify(c)} -> ${fit.displayH}`);
  }
});

test('scale 等于容器尺寸与逻辑尺寸之比', () => {
  const fit = computeFit({ cardW: 1920, cardH: 1080, padding: 0, containerW: 960, containerH: 1000 });
  assert.equal(fit.scale, 0.5);
  assert.equal(fit.displayW, 960);
  assert.equal(fit.displayH, 540);
});
