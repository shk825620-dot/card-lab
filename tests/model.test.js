import test from 'node:test';
import assert from 'node:assert/strict';

import { createState, validateState, DEFAULT_TEXT } from '../src/model.js';
import { resolveTemplate, resolveTheme } from '../src/theme.js';

test('createState 返回完整默认状态', () => {
  const state = createState();
  assert.equal(state.text, DEFAULT_TEXT);
  assert.equal(state.subtext, '');
  assert.equal(state.template, 'glass');
  assert.equal(state.theme, 'dusk');
  assert.equal(state.size, 'square');
  assert.equal(state.fontScale, 1);
  assert.equal(state.pixelRatio, 2);
});

test('createState 接受覆盖且不修改传入对象', () => {
  const overrides = { text: '卧槽这个怎么做到的', template: 'neon' };
  const state = createState(overrides);
  assert.equal(state.text, '卧槽这个怎么做到的');
  assert.equal(state.template, 'neon');
  assert.deepEqual(overrides, { text: '卧槽这个怎么做到的', template: 'neon' });
});

test('createState 对数值型字段做钳制', () => {
  const state = createState({
    size: 'nope',
    fontScale: 99,
    pixelRatio: 0,
  });
  assert.equal(state.size, 'square', '未知画布尺寸应回退到 square');
  assert.equal(state.fontScale, 2, 'fontScale 应被钳制到上限');
  assert.equal(state.pixelRatio, 1, 'pixelRatio 应被钳制到下限');
});

test('createState 保留未知的 template/theme 字符串，交给 resolve* 回退', () => {
  // 保留原值是为了将来加回模板时用户的选择不丢，渲染层一律经 resolveTemplate/resolveTheme。
  const state = createState({ template: 'nope', theme: 'nope' });
  assert.equal(state.template, 'nope');
  assert.equal(state.theme, 'nope');
  assert.equal(resolveTemplate(state.template).id, 'glass');
  assert.equal(resolveTheme(state.template, state.theme).id, 'dusk');
});

test('validateState 拒绝空文字', () => {
  const result = validateState(createState({ text: '   ' }));
  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /文字/);
});

test('validateState 接受正常文字并裁剪首尾空白', () => {
  const state = createState({ text: '  你好  ' });
  assert.equal(state.text.trim(), '你好');
  assert.deepEqual(validateState(state), { ok: true, errors: [] });
});

test('validateState 拒绝超过 2000 字的内容', () => {
  const result = validateState(createState({ text: 'a'.repeat(2001) }));
  assert.equal(result.ok, false);
  assert.match(result.errors[0], /2000/);
});

test('validateState 拒绝未知画布尺寸', () => {
  const result = validateState({ ...createState(), size: 'gigantic' });
  assert.equal(result.ok, false);
  assert.match(result.errors[0], /画布尺寸/);
});

test('validateState 拒绝超出范围的 fontScale', () => {
  assert.equal(validateState({ ...createState(), fontScale: 12 }).ok, false);
  assert.equal(validateState({ ...createState(), fontScale: 0 }).ok, false);
});

test('validateState 拒绝非法 pixelRatio', () => {
  assert.equal(validateState({ ...createState(), pixelRatio: 0 }).ok, false);
  assert.equal(validateState({ ...createState(), pixelRatio: 9 }).ok, false);
});
