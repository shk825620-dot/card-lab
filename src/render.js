/**
 * 卡片 DOM 渲染（纯构建，不做缩放测量）。
 *
 * 全部用户文字一律用 textContent 写入，禁止 innerHTML —— 否则用户输入
 * `<img onerror=...>` 之类的字符串会直接变成可执行代码。
 */

import { resolveTemplate, resolveTheme, resolveSize, buildCssVars } from './theme.js';

export const CARD_ID = 'card';

/** 内容越长，排版越收紧。返回 null 表示正常密度。 */
export function densityFor(text, size) {
  const length = typeof text === 'string' ? text.length : 0;
  const capacity = size.h >= 1920 ? 1.6 : size.h >= 1440 ? 1.25 : 1;
  if (length > 160 * capacity) return 'tiny';
  if (length > 70 * capacity) return 'compact';
  return null;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

/**
 * 把卡片内容渲染到已存在的 #card 元素上。
 *
 * @param {HTMLElement} cardEl
 * @param {object} state
 * @returns {{ ok: boolean, template: object, theme: object, size: object, density: string|null }}
 */
export function renderCard(cardEl, state) {
  if (!cardEl) {
    return { ok: false, template: null, theme: null, size: null, density: null };
  }

  const template = resolveTemplate(state.template);
  const theme = resolveTheme(state.template, state.theme);
  const size = resolveSize(state.size);
  const density = densityFor(state.text, size);

  // 逻辑尺寸只通过 CSS 变量暴露，真正的像素尺寸由预览层用 transform 缩放，
  // 导出时再按原尺寸还原，做到"所见即所得"。
  cardEl.style.setProperty('--cl-cardW', `${size.w}px`);
  cardEl.style.setProperty('--cl-cardH', `${size.h}px`);
  cardEl.style.width = `${size.w}px`;
  cardEl.style.height = `${size.h}px`;
  cardEl.style.fontSize = `${template.baseFontSize * state.fontScale}px`;

  for (const [name, value] of Object.entries(buildCssVars(template, theme, state.fontScale))) {
    cardEl.style.setProperty(name, value);
  }

  cardEl.dataset.template = template.id;
  cardEl.dataset.size = size.id;
  if (density) {
    cardEl.dataset.density = density;
  } else {
    delete cardEl.dataset.density;
  }

  const subtext = typeof state.subtext === 'string' ? state.subtext.trim() : '';

  const body = element('div', 'card__body');
  const eyebrow = element('span', 'card__eyebrow', template.tokens.eyebrow);
  const title = element('h1', 'card__title', state.text);
  body.append(eyebrow, title);
  if (subtext) {
    body.append(element('p', 'card__subtext', subtext));
  }

  const footer = element('div', 'card__footer');
  footer.append(element('span', 'card__rule'), element('span', 'card__mark', 'card-lab'));

  const children = [];
  if (template.id === 'glass') {
    children.push(element('div', 'card__grain'), element('div', 'card__surface'));
  } else if (template.id === 'neon' || template.id === 'zen') {
    children.push(element('div', 'card__grain'));
  }
  children.push(body, footer);

  cardEl.replaceChildren(...children);

  return { ok: true, template, theme, size, density };
}
