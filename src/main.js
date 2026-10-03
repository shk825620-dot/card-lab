/**
 * 应用装配层：把 DOM 控件、store 与 render/export 接起来。
 *
 * 数据流是单向的：
 *   控件事件 -> store.patch() -> subscribe 回调 -> renderCard() + applyFit()
 * 视图不持有状态，也没有"手动同步某个控件"的代码路径。
 */

import { createStore } from './store.js';
import { renderCard } from './render.js';
import { computeFit } from './fit.js';
import { exportCard, downloadBlob, readLogicalSize } from './export.js';
import { buildFileName } from './filename.js';
import { TEMPLATES, THEMES, SIZES, resolveTemplate, resolveTheme, resolveSize } from './theme.js';
import { MAX_TEXT_LENGTH, createState } from './model.js';

const STORAGE_KEY = 'card-lab:state:v1';
const STAGE_PADDING = 24;

const dom = {
  text: document.getElementById('text-input'),
  subtext: document.getElementById('subtext-input'),
  textCount: document.getElementById('text-count'),
  templatePicker: document.getElementById('template-picker'),
  themePicker: document.getElementById('theme-picker'),
  sizePicker: document.getElementById('size-picker'),
  fontScale: document.getElementById('fontscale-input'),
  fontScaleValue: document.getElementById('fontscale-value'),
  exportBtn: document.getElementById('export-btn'),
  status: document.getElementById('status'),
  stage: document.getElementById('card-stage'),
  stageInner: document.getElementById('card-zoom'),
  card: document.getElementById('card'),
};

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * 把读到的状态修正成"自洽"的：模板必须存在，配色必须属于该模板。
 * 否则用户手动改过 localStorage、或以后删掉某套配色时，
 * 选择器会一个都不高亮，用户看到"没选中任何配色"的怪状态。
 */
function normalizeState(raw) {
  const state = createState(raw);
  const templateId = resolveTemplate(state.template).id;
  const themeId = resolveTheme(templateId, state.theme).id;
  return { ...state, template: templateId, theme: themeId };
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* 隐私模式下写不进去，忽略即可 */
  }
}

/**
 * 某个模板的首套配色渐变，用作选择器上的小预览块。
 * 用首套配色的 bg 而不是模板默认 bg，选择器上的颜色才和实际效果一致。
 */
function templateGradient(templateId) {
  const template = resolveTemplate(templateId);
  const theme = resolveTheme(templateId, undefined);
  return theme?.tokens?.bg ?? template.tokens.bg;
}

function setStatus(message, tone = '') {
  dom.status.textContent = message;
  if (tone) {
    dom.status.dataset.tone = tone;
  } else {
    delete dom.status.dataset.tone;
  }
}

function buildPicker(container, items, build) {
  const nodes = items.map((item) => build(item));
  container.replaceChildren(...nodes);
}

function buildTemplatePicker() {
  buildPicker(dom.templatePicker, TEMPLATES, (template) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.setAttribute('role', 'radio');
    button.dataset.value = template.id;

    const preview = document.createElement('span');
    preview.className = 'chip__preview';
    preview.style.backgroundImage = templateGradient(template.id);

    const label = document.createElement('span');
    label.textContent = template.label;

    button.append(preview, label);
    return button;
  });
}

function buildThemePicker() {
  const state = store.getState();
  const template = resolveTemplate(state.template);
  const themes = THEMES[template.id] ?? [];

  buildPicker(dom.themePicker, themes, (theme) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'swatch';
    button.setAttribute('role', 'radio');
    button.dataset.value = theme.id;
    button.title = `${theme.label}（${template.label}）`;
    button.setAttribute('aria-label', `${template.label} · ${theme.label}`);
    button.style.backgroundImage = theme.tokens.bg;
    button.style.backgroundColor = theme.tokens.accent;
    return button;
  });
}

function buildSizePicker() {
  buildPicker(dom.sizePicker, SIZES, (size) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip chip--size';
    button.setAttribute('role', 'radio');
    button.dataset.value = size.id;
    button.textContent = size.label;
    return button;
  });
}

/** 把 aria-checked 同步成当前状态，供 CSS 与读屏器使用。 */
function syncChecked(container, value) {
  for (const child of container.querySelectorAll('[data-value]')) {
    child.setAttribute('aria-checked', String(child.dataset.value === value));
  }
}

/**
 * 按容器尺寸缩放预览。
 *
 * 只改内层的 CSS 变量 --scale 与自身尺寸，绝不修改被 ResizeObserver 观测的
 * .stage 的宽高——否则观测回调会改尺寸、改尺寸又触发回调，形成死循环。
 * scale 不参与布局，所以这里改尺寸不会再次触发观测。
 */
function applyFit() {
  const size = resolveSize(store.getState().size);
  const rect = dom.stage.getBoundingClientRect();
  const fit = computeFit({
    containerW: rect.width,
    containerH: rect.height,
    cardW: size.w,
    cardH: size.h,
    padding: STAGE_PADDING,
  });

  dom.stageInner.style.setProperty('--scale', String(fit.scale));
  dom.stageInner.style.width = `${fit.displayW}px`;
  dom.stageInner.style.height = `${fit.displayH}px`;
}

const store = createStore(normalizeState(loadSavedState()));

/* ---------- 首次构建 ---------- */

buildTemplatePicker();
buildThemePicker();
buildSizePicker();

dom.text.value = store.getState().text;
dom.subtext.value = store.getState().subtext;
dom.fontScale.value = String(Math.round(store.getState().fontScale * 100));

/* ---------- 订阅渲染 ---------- */

store.subscribe((state) => {
  const result = renderCard(dom.card, state);

  syncChecked(dom.templatePicker, state.template);
  syncChecked(dom.themePicker, state.theme);
  syncChecked(dom.sizePicker, state.size);

  dom.textCount.textContent = `${state.text.length} / ${MAX_TEXT_LENGTH}`;
  dom.fontScaleValue.textContent = `${Math.round(state.fontScale * 100)}%`;

  const errors = store.errors();
  dom.exportBtn.disabled = errors.length > 0;

  if (errors.length > 0) {
    setStatus(errors[0], 'error');
  } else {
    const hint = result.density ? '\n内容较多，排版已自动收紧。' : '';
    setStatus(`当前：${result.template.label} · ${result.theme.label} · ${result.size.label}${hint}`);
  }

  // 配色随模板变化，重建色块选择器
  if (dom.themePicker.dataset.template !== state.template) {
    dom.themePicker.dataset.template = state.template;
    buildThemePicker();
    syncChecked(dom.themePicker, state.theme);
  }

  saveState(state);
  applyFit();
});

/* ---------- 事件绑定 ---------- */

dom.text.addEventListener('input', () => store.patch({ text: dom.text.value }));

dom.subtext.addEventListener('input', () => store.patch({ subtext: dom.subtext.value }));

dom.fontScale.addEventListener('input', () => {
  store.patch({ fontScale: Number(dom.fontScale.value) / 100 });
});

function bindPicker(container, field) {
  container.addEventListener('click', (event) => {
    const button = event.target.closest('[data-value]');
    if (!button || !container.contains(button)) return;
    store.patch({ [field]: button.dataset.value });
  });
}

bindPicker(dom.templatePicker, 'template');
bindPicker(dom.themePicker, 'theme');
bindPicker(dom.sizePicker, 'size');

dom.exportBtn.addEventListener('click', async () => {
  const state = store.getState();
  const errors = store.errors();
  if (errors.length > 0) {
    setStatus(errors[0], 'error');
    return;
  }

  dom.exportBtn.disabled = true;
  setStatus('正在导出，请稍候…', 'busy');

  try {
    const blob = await exportCard(dom.card, { pixelRatio: state.pixelRatio });
    downloadBlob(blob, buildFileName(state.text, state.size));
    const { w, h } = readLogicalSize(dom.card);
    setStatus(
      `已导出 PNG（${Math.round(w * state.pixelRatio)} × ${Math.round(h * state.pixelRatio)} 像素）`,
      'success',
    );
  } catch (error) {
    setStatus(`导出失败：${error?.message ?? '未知错误'}`, 'error');
  } finally {
    dom.exportBtn.disabled = store.errors().length > 0;
  }
});

window.addEventListener('resize', applyFit);
window.addEventListener('orientationchange', applyFit);

if (typeof ResizeObserver === 'function') {
  new ResizeObserver(applyFit).observe(dom.stage);
}
