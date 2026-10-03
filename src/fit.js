/**
 * 预览区自适应缩放计算（纯函数）。
 *
 * 卡片的逻辑尺寸始终不变（例如 1080×1080），预览只是把它等比缩放到容器里。
 * 这样"看到的"和"导出的"完全一致，导出时只要按 pixelRatio 还原即可。
 */

/** 容器尺寸为 0 或输入非法时的最小安全缩放，避免出现 0 或负数。 */
export const MIN_SCALE = 0.05;

function positive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * @param {{ containerW?: number, containerH?: number, cardW?: number, cardH?: number, padding?: number }} input
 * @returns {{ scale: number, displayW: number, displayH: number }}
 */
export function computeFit(input = {}) {
  const cardW = positive(input.cardW) ? input.cardW : 0;
  const cardH = positive(input.cardH) ? input.cardH : 0;
  const containerW = positive(input.containerW) ? input.containerW : 0;
  const containerH = positive(input.containerH) ? input.containerH : 0;

  if (cardW <= 0 || cardH <= 0) {
    return { scale: MIN_SCALE, displayW: cardW * MIN_SCALE, displayH: cardH * MIN_SCALE };
  }

  // 容器比留白还小时，留白失去意义，退回到不留白，避免出现负的可用空间。
  const requestedPadding = Number.isFinite(input.padding) && input.padding > 0 ? input.padding : 0;
  const fitsPadding =
    requestedPadding === 0 || containerW > requestedPadding * 2 || containerH > requestedPadding * 2;
  const padding = fitsPadding ? requestedPadding : 0;

  const usableW = Math.max(containerW - padding * 2, 0);
  const usableH = Math.max(containerH - padding * 2, 0);

  if (usableW <= 0 || usableH <= 0) {
    return { scale: MIN_SCALE, displayW: cardW * MIN_SCALE, displayH: cardH * MIN_SCALE };
  }

  const raw = Math.min(usableW / cardW, usableH / cardH);
  // 容器极窄时把缩放抬到 MIN_SCALE，宁可溢出也不要让卡片缩成一个点。
  const scale = Number.isFinite(raw) && raw > MIN_SCALE ? raw : MIN_SCALE;

  return {
    scale,
    displayW: cardW * scale,
    displayH: cardH * scale,
  };
}
