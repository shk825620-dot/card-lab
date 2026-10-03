import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TEMPLATES,
  THEMES,
  SIZES,
  resolveTemplate,
  resolveTheme,
  resolveSize,
  buildCssVars,
} from '../src/theme.js';

test('TEMPLATES 恰好包含 4 套模板', () => {
  assert.equal(TEMPLATES.length, 4);
  assert.deepEqual(
    TEMPLATES.map((t) => t.id).sort(),
    ['glass', 'magazine', 'neon', 'zen'],
  );
});

test('每套模板都有标签、token 和至少 3 种配色', () => {
  for (const template of TEMPLATES) {
    assert.ok(template.label && template.label.length > 0, `${template.id} 缺少 label`);
    assert.ok(template.tokens && template.tokens.bg, `${template.id} 缺少 tokens.bg`);
    const themes = THEMES[template.id];
    assert.ok(Array.isArray(themes) && themes.length >= 3, `${template.id} 配色不足 3 种`);
    for (const theme of themes) {
      assert.ok(theme.id && theme.label, `${template.id} 存在缺少 id/label 的配色`);
      assert.ok(theme.tokens && theme.tokens.accent, `${template.id}/${theme.id} 缺少 accent`);
    }
  }
});

test('SIZES 包含 square / portrait / story / wide 且宽高为正数', () => {
  assert.deepEqual(
    SIZES.map((s) => s.id).sort(),
    ['portrait', 'square', 'story', 'wide'],
  );
  for (const size of SIZES) {
    assert.ok(size.w > 0 && size.h > 0, `${size.id} 尺寸非法`);
    assert.ok(size.label, `${size.id} 缺少 label`);
  }
});

test('resolveTemplate 对未知 id 回退到第一套模板', () => {
  assert.equal(resolveTemplate('nope').id, TEMPLATES[0].id);
  assert.equal(resolveTemplate(undefined).id, TEMPLATES[0].id);
  assert.equal(resolveTemplate('neon').id, 'neon');
});

test('resolveTheme 对未知模板和未知配色都做回退', () => {
  assert.equal(resolveTheme('neon', 'nope').id, THEMES.neon[0].id);
  assert.equal(resolveTheme('nope', 'nope').id, THEMES[TEMPLATES[0].id][0].id);
  assert.equal(resolveTheme('neon', 'matrix').id, 'matrix');
});

test('resolveSize 对未知 id 回退到 square', () => {
  assert.equal(resolveSize('nope').id, 'square');
  assert.equal(resolveSize('story').h, 1920);
});

test('buildCssVars 合并模板与配色 token 并输出 --cl- 前缀', () => {
  const template = resolveTemplate('glass');
  const theme = resolveTheme('glass', 'dusk');
  const vars = buildCssVars(template, theme, 1);

  assert.equal(vars['--cl-bg'], theme.tokens.bg);
  assert.equal(vars['--cl-fg'], theme.tokens.fg);
  assert.equal(vars['--cl-accent'], theme.tokens.accent);
  assert.equal(vars['--cl-radius'], template.tokens.radius);
  assert.ok(vars['--cl-shadow'], 'shadow 应该被输出');

  for (const [key, value] of Object.entries(vars)) {
    assert.ok(key.startsWith('--cl-'), `${key} 缺少 --cl- 前缀`);
    assert.equal(typeof value, 'string');
    assert.ok(value.length > 0, `${key} 是空字符串`);
  }
});

test('buildCssVars 按 fontScale 缩放所有数字型 token', () => {
  const template = resolveTemplate('zen');
  const theme = resolveTheme('zen', 'mist');
  const base = buildCssVars(template, theme, 1);
  const big = buildCssVars(template, theme, 2);

  assert.equal(Number.parseFloat(big['--cl-radius']), Number.parseFloat(base['--cl-radius']) * 2);
  assert.notEqual(big['--cl-shadow'], base['--cl-shadow']);
  assert.equal(big['--cl-fg'], base['--cl-fg'], '颜色类 token 不应被缩放');
});

test('buildCssVars 对空输入不抛异常', () => {
  assert.deepEqual(buildCssVars({}, {}, 1), {});
  assert.deepEqual(buildCssVars(null, null, 1), {});
});
