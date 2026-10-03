import test from 'node:test';
import assert from 'node:assert/strict';

import { renderCard } from '../src/render.js';
import { createState } from '../src/model.js';

// render.js 只需要极少的 DOM 能力：createElement / textContent / dataset / style。
// 手写一个最小桩，就能在 Node 里验证渲染结果，而不是靠"打开浏览器看看"。
// 浏览器专属的部分（缩放、导出）另由 fit.test.js 与人工验收覆盖。

function stubStyle() {
  return {
    _props: new Map(),
    setProperty(name, value) {
      this._props.set(name, value);
    },
  };
}

function stubElement(tagName) {
  const node = {
    tagName: String(tagName).toUpperCase(),
    children: [],
    className: '',
    textContent: '',
    dataset: {},
    style: stubStyle(),
    append(...items) {
      node.children.push(...items);
      return node;
    },
    replaceChildren(...items) {
      node.children = items;
      return node;
    },
  };
  return node;
}

globalThis.document = { createElement: stubElement };

function find(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.children) {
    const hit = find(child, predicate);
    if (hit) return hit;
  }
  return null;
}

function collect(node, out = []) {
  out.push(node);
  for (const child of node.children) collect(child, out);
  return out;
}

test('渲染出卡片结构并把文字写进 title', () => {
  const card = stubElement('div');
  const result = renderCard(card, createState({ text: '卧槽这个怎么做到的', subtext: 'card-lab' }));

  assert.equal(result.ok, true);
  assert.equal(card.dataset.template, 'glass');
  assert.equal(card.dataset.size, 'square');

  const title = find(card, (n) => n.className === 'card__title');
  assert.ok(title, '应该渲染出 .card__title');
  assert.equal(title.textContent, '卧槽这个怎么做到的');

  const subtext = find(card, (n) => n.className === 'card__subtext');
  assert.ok(subtext, '有副标题时应该渲染 .card__subtext');
  assert.equal(subtext.textContent, 'card-lab');
});

test('副标题为空时不渲染副标题节点', () => {
  const card = stubElement('div');
  renderCard(card, createState({ subtext: '   ' }));
  assert.equal(find(card, (n) => n.className === 'card__subtext'), null);
});

test('用户文字里的 HTML 只会被当成纯文本', () => {
  const card = stubElement('div');
  const nasty = '<img src=x onerror="alert(1)">';
  renderCard(card, createState({ text: nasty }));

  const title = find(card, (n) => n.className === 'card__title');
  assert.equal(title.textContent, nasty);
  // 整棵 DOM 里不应该出现 img 节点
  assert.equal(collect(card).filter((n) => n.tagName === 'IMG').length, 0);
});

test('每套模板都能渲染，并带上自己的装饰层', () => {
  for (const template of ['glass', 'neon', 'zen', 'magazine']) {
    const card = stubElement('div');
    const result = renderCard(card, createState({ text: '测试', template }));
    assert.equal(result.ok, true, `${template} 渲染失败`);
    assert.equal(card.dataset.template, template);
    assert.ok(find(card, (n) => n.className === 'card__title'), `${template} 缺 title`);
    assert.ok(find(card, (n) => n.className === 'card__rule'), `${template} 缺 rule`);
  }
});

test('玻璃模板有 surface + grain，霓虹和日系只有 grain，杂志都没有', () => {
  const expect = { glass: ['surface', 'grain'], neon: ['grain'], zen: ['grain'], magazine: [] };
  for (const [template, kinds] of Object.entries(expect)) {
    const card = stubElement('div');
    renderCard(card, createState({ text: '测试', template }));
    for (const kind of kinds) {
      assert.ok(find(card, (n) => n.className === `card__${kind}`), `${template} 缺 card__${kind}`);
    }
    if (kinds.length === 0) {
      assert.equal(find(card, (n) => n.className === 'card__grain'), null);
      assert.equal(find(card, (n) => n.className === 'card__surface'), null);
    }
  }
});

test('逻辑尺寸写进内联样式，且与所选画布一致', () => {
  const cases = [
    ['square', 1080, 1080],
    ['portrait', 1080, 1440],
    ['story', 1080, 1920],
    ['wide', 1920, 1080],
  ];
  for (const [sizeId, w, h] of cases) {
    const card = stubElement('div');
    renderCard(card, createState({ text: '尺寸', size: sizeId }));
    assert.equal(card.style.width, `${w}px`, `${sizeId} 宽度不对`);
    assert.equal(card.style.height, `${h}px`, `${sizeId} 高度不对`);
    assert.equal(card.style._props.get('--cl-cardW'), `${w}px`);
    assert.equal(card.style._props.get('--cl-cardH'), `${h}px`);
  }
});

test('字号倍率同时作用于卡片基准字号与内联 token', () => {
  const small = stubElement('div');
  renderCard(small, createState({ text: '字号', fontScale: 1 }));
  const big = stubElement('div');
  renderCard(big, createState({ text: '字号', fontScale: 2 }));

  assert.equal(small.style.fontSize, '32px');
  assert.equal(big.style.fontSize, '64px');
  assert.equal(
    Number.parseFloat(big.style._props.get('--cl-radius')),
    Number.parseFloat(small.style._props.get('--cl-radius')) * 2,
  );
});

test('超长文字会加上 data-density 收紧排版', () => {
  const long = stubElement('div');
  renderCard(long, createState({ text: 'a'.repeat(100) }));
  assert.equal(long.dataset.density, 'compact');

  const tooLong = stubElement('div');
  renderCard(tooLong, createState({ text: 'a'.repeat(200) }));
  assert.equal(tooLong.dataset.density, 'tiny');

  const normal = stubElement('div');
  renderCard(normal, createState({ text: '短' }));
  assert.equal(normal.dataset.density, undefined);
});

test('重复渲染不会累积旧节点', () => {
  const card = stubElement('div');
  renderCard(card, createState({ text: '第一次' }));
  const firstCount = card.children.length;
  renderCard(card, createState({ text: '第二次' }));
  assert.equal(card.children.length, firstCount);

  const titles = collect(card).filter((n) => n.className === 'card__title');
  assert.equal(titles.length, 1);
  assert.equal(titles[0].textContent, '第二次');
});

test('cardEl 为空时安全返回，不抛异常', () => {
  const result = renderCard(null, createState());
  assert.equal(result.ok, false);
  assert.equal(result.template, null);
});
