/**
 * PNG 导出。
 *
 * 用 vendored 的 modern-screenshot（DOM -> SVG foreignObject -> canvas -> PNG）。
 * 该路径不支持 backdrop-filter，所以模板样式里已经全程避开它（见 templates.css）。
 *
 * 这里刻意不改动卡片的实时样式数组：导出只覆盖 width，并在结束后恢复，
 * 否则会触发 ResizeObserver -> 重新缩放 -> 再次导出的死循环。
 */

const DEFAULT_VENDOR_PATH = 'vendor/modern-screenshot.umd.js';
const SCRIPT_ID = 'modern-screenshot-vendor';

/** 依据当前模块地址推断站点根路径，兼容 GitHub Pages 的子路径部署。 */
function resolveVendorPath() {
  try {
    const here = import.meta.url;
    const index = here.lastIndexOf('/src/');
    if (index >= 0) return `${here.slice(0, index)}/${DEFAULT_VENDOR_PATH}`;
    return new URL(DEFAULT_VENDOR_PATH, here).href;
  } catch {
    return DEFAULT_VENDOR_PATH;
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      if (existing.dataset.loaded === '1') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`加载失败：${src}`)), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = src;
    script.async = true;
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = '1';
        resolve();
      },
      { once: true },
    );
    script.addEventListener('error', () => reject(new Error(`加载失败：${src}`)), { once: true });
    document.head.append(script);
  });
}

async function loadLib() {
  if (globalThis.modernScreenshot?.domToBlob) {
    return globalThis.modernScreenshot;
  }
  await loadScript(resolveVendorPath());
  const lib = globalThis.modernScreenshot;
  if (!lib?.domToBlob) {
    throw new Error('导出组件没有正确加载，请刷新页面重试');
  }
  return lib;
}

/** 从卡片上读回逻辑尺寸（render.js 会把它们写成内联样式）。 */
export function readLogicalSize(cardEl) {
  const w = Number.parseFloat(cardEl.style.width) || 0;
  const h = Number.parseFloat(cardEl.style.height) || 0;
  return { w, h };
}

/**
 * 导出前要撑到多大。
 *
 * 卡片是 flex 纵向布局，两个方向都会被内容撑开（只会 ≥ 逻辑尺寸），
 * 所以这里把主轴撑满：竖版撑高度，横版撑宽度，这样版面留白比例正常。
 * 不这么做的话，竖版画布在宽屏上会按宽度撑开，高度超出画布被截断。
 */
export function exportBox(size) {
  const ratio = size.w / size.h;
  // 横版撑宽度，竖版撑高度
  return ratio > 1.2
    ? { width: size.w, height: Math.round(size.w / ratio) }
    : { width: Math.round(size.h * ratio), height: size.h };
}

/**
 * 导出卡片为 PNG Blob。
 *
 * @param {HTMLElement} cardEl
 * @param {{ pixelRatio?: number }} options
 * @returns {Promise<Blob>}
 */
export async function exportCard(cardEl, options = {}) {
  if (!cardEl) {
    throw new Error('找不到卡片元素，无法导出');
  }

  const { w, h } = readLogicalSize(cardEl);
  if (w <= 0 || h <= 0) {
    throw new Error('卡片尺寸异常，请刷新页面重试');
  }

  const pixelRatio = Number.isFinite(options.pixelRatio) && options.pixelRatio > 0 ? options.pixelRatio : 2;
  const lib = await loadLib();
  const box = exportBox({ w, h });

  const previousWidth = cardEl.style.width;
  const previousHeight = cardEl.style.height;

  try {
    // 字号未就绪时截图会拿到回退字体，所以必须先等字体加载完。
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    cardEl.style.width = `${box.width}px`;
    cardEl.style.height = `${box.height}px`;

    const blob = await lib.domToBlob(cardEl, {
      pixelRatio,
      width: box.width,
      height: box.height,
      type: 'image/png',
      backgroundColor: null,
    });

    if (!blob || blob.size === 0) {
      throw new Error('导出结果是空图片，请重试');
    }
    return blob;
  } finally {
    cardEl.style.width = previousWidth;
    cardEl.style.height = previousHeight;
  }
}

/** 触发浏览器下载。 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  // Safari 需要延后一点才能安全释放
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
