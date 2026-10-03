/**
 * 卡片数据模型（纯函数）。
 *
 * 这里只负责"状态长什么样"和"状态是否合法"，
 * 不接触 DOM、不接触浏览器 API，所以可以直接在 Node 里跑测试。
 */

import { resolveSize, SIZES } from './theme.js';

const DEFAULT_TEXT = '在键盘上敲下的每个字，都值得一张好看的卡片';
export { DEFAULT_TEXT };
export const MAX_TEXT_LENGTH = 2000;
export const MIN_FONT_SCALE = 0.5;
export const MAX_FONT_SCALE = 2;
export const MIN_PIXEL_RATIO = 1;
export const MAX_PIXEL_RATIO = 3;

export const DEFAULTS = {
  text: DEFAULT_TEXT,
  subtext: '',
  template: 'glass',
  theme: 'dusk',
  size: 'square',
  fontScale: 1,
  pixelRatio: 2,
};

const SIZE_IDS = new Set(SIZES.map((size) => size.id));

function clamp(value, min, max, fallback) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

/**
 * 创建一个完整状态。缺失或非法的字段一律回退到默认值，
 * 因此 UI 永远不需要做空值判断。
 */
export function createState(overrides = {}) {
  const source = overrides && typeof overrides === 'object' ? overrides : {};
  const template = typeof source.template === 'string' ? source.template : DEFAULTS.template;

  return {
    text: typeof source.text === 'string' ? source.text : DEFAULTS.text,
    subtext: typeof source.subtext === 'string' ? source.subtext : DEFAULTS.subtext,
    template,
    // 配色是否属于该模板由 resolveTheme 回退，这里只保证是字符串。
    theme: typeof source.theme === 'string' ? source.theme : DEFAULTS.theme,
    size: SIZE_IDS.has(source.size) ? source.size : DEFAULTS.size,
    fontScale: clamp(source.fontScale, MIN_FONT_SCALE, MAX_FONT_SCALE, DEFAULTS.fontScale),
    pixelRatio: clamp(source.pixelRatio, MIN_PIXEL_RATIO, MAX_PIXEL_RATIO, DEFAULTS.pixelRatio),
  };
}

/**
 * 校验状态，返回可读的中文错误，供 #status 提示条直接显示。
 */
export function validateState(state) {
  const errors = [];
  const text = typeof state?.text === 'string' ? state.text.trim() : '';

  if (text.length === 0) {
    errors.push('请先输入文字，卡片才会有内容');
  } else if (text.length > MAX_TEXT_LENGTH) {
    errors.push(`文字最多 ${MAX_TEXT_LENGTH} 字，当前 ${text.length} 字`);
  }

  if (!SIZE_IDS.has(state?.size)) {
    errors.push(`未知的画布尺寸：${String(state?.size)}`);
  }

  const fontScale = state?.fontScale;
  if (
    typeof fontScale !== 'number' ||
    !Number.isFinite(fontScale) ||
    fontScale < MIN_FONT_SCALE ||
    fontScale > MAX_FONT_SCALE
  ) {
    errors.push(`字号倍率需要在 ${MIN_FONT_SCALE} 到 ${MAX_FONT_SCALE} 之间`);
  }

  const pixelRatio = state?.pixelRatio;
  if (
    typeof pixelRatio !== 'number' ||
    !Number.isFinite(pixelRatio) ||
    pixelRatio < MIN_PIXEL_RATIO ||
    pixelRatio > MAX_PIXEL_RATIO
  ) {
    errors.push(`导出倍率需要在 ${MIN_PIXEL_RATIO} 到 ${MAX_PIXEL_RATIO} 之间`);
  }

  return { ok: errors.length === 0, errors };
}

/** 取状态对应的逻辑尺寸（宽/高），未知 id 会自动回退。 */
export function stateSize(state) {
  return resolveSize(state?.size);
}
