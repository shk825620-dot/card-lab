/**
 * 模板 / 配色 / 画布尺寸的定义与解析。
 *
 * 本模块为纯数据 + 纯函数：不接触 DOM，因此可以直接被 Node 测试。
 * 新增一套模板 = 在 TEMPLATES 里加一个 token 对象 + 在 THEMES 里加一组配色
 * + 在 styles/templates.css 里加一段 [data-template="..."] 规则，不需要改任何逻辑。
 */

export const TEMPLATES = [
  {
    id: 'glass',
    label: '玻璃拟态',
    baseFontSize: 32,
    // token 一律以 rem 锚定，卡片根节点的 font-size 由 fontScale 推导，
    // 于是"字号滑杆"会把留白、圆角、阴影一起等比放大，版面比例不会走形。
    tokens: {
      eyebrow: 'CARD LAB',
      bg: 'linear-gradient(145deg, #1b2140 0%, #2b2350 55%, #3a2a52 100%)',
      radius: '0.9rem',
      padding: '2.4rem',
      fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
      titleWeight: '700',
      titleTrack: '-0.02em',
      subWeight: '400',
      subTrack: '0.04em',
      align: 'left',
      shadow: 'inset 0 0.03rem 0 rgba(255,255,255,0.14), 0 1.4rem 3rem rgba(0,0,0,0.35)',
      accentWidth: '3.2rem',
      accentHeight: '0.28rem',
      subGap: '1.3rem',
      eyebrowGap: '1.6rem',
    },
  },
  {
    id: 'neon',
    label: '霓虹赛博',
    baseFontSize: 32,
    tokens: {
      eyebrow: '// SYSTEM ONLINE',
      bg: 'linear-gradient(160deg, #05050c 0%, #0a0418 60%, #12061f 100%)',
      radius: '0.45rem',
      padding: '2.2rem',
      fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
      titleWeight: '800',
      titleTrack: '0.01em',
      subWeight: '500',
      subTrack: '0.3em',
      align: 'left',
      shadow:
        'inset 0 0 0 0.03rem rgba(0,255,209,0.28), 0 0 2.4rem rgba(255,0,200,0.2), inset 0 0 3rem rgba(0,216,255,0.08)',
      accentWidth: '6.5rem',
      accentHeight: '0.15rem',
      subGap: '1.1rem',
      eyebrowGap: '1.8rem',
    },
  },
  {
    id: 'zen',
    label: '日系极简',
    baseFontSize: 34,
    tokens: {
      eyebrow: 'M E M O',
      bg: 'linear-gradient(180deg, #faf8f4 0%, #f2eee6 100%)',
      radius: '0.25rem',
      padding: '3rem',
      fontFamily: '"Noto Serif SC", "Songti SC", "SimSun", serif',
      titleWeight: '500',
      titleTrack: '0.06em',
      subWeight: '300',
      subTrack: '0.12em',
      align: 'left',
      shadow: 'inset 0 0 0 0.03rem rgba(0,0,0,0.06)',
      accentWidth: '2.4rem',
      accentHeight: '0.12rem',
      subGap: '1.5rem',
      eyebrowGap: '2.4rem',
    },
  },
  {
    id: 'magazine',
    label: '杂志排版',
    baseFontSize: 34,
    tokens: {
      eyebrow: 'ISSUE 01 — 2026',
      bg: '#ffffff',
      radius: '0rem',
      padding: '2.6rem',
      fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
      titleWeight: '900',
      titleTrack: '-0.04em',
      subWeight: '600',
      subTrack: '0.34em',
      align: 'left',
      shadow: 'inset 0 0 0 0.06rem rgba(0,0,0,0.92)',
      accentWidth: '100%',
      accentHeight: '0.4rem',
      subGap: '1rem',
      eyebrowGap: '1.4rem',
    },
  },
];

export const THEMES = {
  glass: [
    {
      id: 'dusk',
      label: '暮色',
      swatch: '#2b2350',
      tokens: {
        bg: 'linear-gradient(145deg, #1b2140 0%, #2b2350 55%, #3a2a52 100%)',
        fg: '#f4f2ff',
        muted: 'rgba(244,242,255,0.68)',
        accent: '#8b7bff',
        surface: 'rgba(255,255,255,0.08)',
      },
    },
    {
      id: 'ocean',
      label: '深海',
      swatch: '#12304d',
      tokens: {
        bg: 'linear-gradient(145deg, #0d2438 0%, #12304d 55%, #16465c 100%)',
        fg: '#eaf6ff',
        muted: 'rgba(234,246,255,0.66)',
        accent: '#57c7ff',
        surface: 'rgba(255,255,255,0.08)',
      },
    },
    {
      id: 'amber',
      label: '琥珀',
      swatch: '#4a2c15',
      tokens: {
        bg: 'linear-gradient(145deg, #33200f 0%, #4a2c15 55%, #6b3d18 100%)',
        fg: '#fff4e6',
        muted: 'rgba(255,244,230,0.66)',
        accent: '#ffb347',
        surface: 'rgba(255,255,255,0.09)',
      },
    },
    {
      id: 'moss',
      label: '苔绿',
      swatch: '#17301f',
      tokens: {
        bg: 'linear-gradient(145deg, #0f2116 0%, #17301f 55%, #234a2d 100%)',
        fg: '#eefaf0',
        muted: 'rgba(238,250,240,0.66)',
        accent: '#5fdc8a',
        surface: 'rgba(255,255,255,0.08)',
      },
    },
  ],
  neon: [
    {
      id: 'matrix',
      label: '矩阵绿',
      swatch: '#0affc4',
      tokens: {
        bg: 'linear-gradient(160deg, #04060a 0%, #04140f 60%, #061d16 100%)',
        fg: '#d8ffe9',
        muted: 'rgba(216,255,233,0.6)',
        accent: '#0affc4',
        surface: 'rgba(10,255,196,0.08)',
      },
    },
    {
      id: 'magenta',
      label: '品红',
      swatch: '#ff2fb0',
      tokens: {
        bg: 'linear-gradient(160deg, #0a0410 0%, #150423 60%, #20062e 100%)',
        fg: '#ffe6fb',
        muted: 'rgba(255,230,251,0.6)',
        accent: '#ff2fb0',
        surface: 'rgba(255,47,176,0.1)',
      },
    },
    {
      id: 'cyber',
      label: '赛博蓝',
      swatch: '#00d8ff',
      tokens: {
        bg: 'linear-gradient(160deg, #03060f 0%, #051227 60%, #071c3a 100%)',
        fg: '#e2f4ff',
        muted: 'rgba(226,244,255,0.6)',
        accent: '#00d8ff',
        surface: 'rgba(0,216,255,0.1)',
      },
    },
  ],
  zen: [
    {
      id: 'mist',
      label: '薄雾',
      swatch: '#f2eee6',
      tokens: {
        bg: 'linear-gradient(180deg, #faf8f4 0%, #f2eee6 100%)',
        fg: '#2f2b26',
        muted: 'rgba(47,43,38,0.55)',
        accent: '#b08968',
        surface: 'rgba(255,255,255,0.6)',
      },
    },
    {
      id: 'ink',
      label: '墨',
      swatch: '#e9e6e0',
      tokens: {
        bg: 'linear-gradient(180deg, #f0eeea 0%, #e4e0d9 100%)',
        fg: '#1c1a17',
        muted: 'rgba(28,26,23,0.55)',
        accent: '#3d3a35',
        surface: 'rgba(255,255,255,0.55)',
      },
    },
    {
      id: 'sakura',
      label: '樱',
      swatch: '#f7e9ec',
      tokens: {
        bg: 'linear-gradient(180deg, #fdf5f6 0%, #f7e9ec 100%)',
        fg: '#3a2a2e',
        muted: 'rgba(58,42,46,0.55)',
        accent: '#d97a8c',
        surface: 'rgba(255,255,255,0.6)',
      },
    },
  ],
  magazine: [
    {
      id: 'editorial',
      label: '经典黑白',
      swatch: '#111111',
      tokens: {
        bg: '#ffffff',
        fg: '#111111',
        muted: 'rgba(17,17,17,0.55)',
        accent: '#e8391f',
        surface: '#f4f4f4',
      },
    },
    {
      id: 'blueprint',
      label: '蓝图',
      swatch: '#123a8c',
      tokens: {
        bg: '#f5f8ff',
        fg: '#0d1f4c',
        muted: 'rgba(13,31,76,0.55)',
        accent: '#2456d8',
        surface: '#e7eeff',
      },
    },
    {
      id: 'retro',
      label: '复古纸',
      swatch: '#8a5a2b',
      tokens: {
        bg: '#fdf8ef',
        fg: '#3d2b1f',
        muted: 'rgba(61,43,31,0.55)',
        accent: '#c1741e',
        surface: '#f4ead8',
      },
    },
  ],
};

export const SIZES = [
  { id: 'square', label: '方图 1:1', w: 1080, h: 1080 },
  { id: 'portrait', label: '竖图 3:4', w: 1080, h: 1440 },
  { id: 'story', label: '长图 9:16', w: 1080, h: 1920 },
  { id: 'wide', label: '横图 16:9', w: 1920, h: 1080 },
];

const TEMPLATE_BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));
const SIZE_BY_ID = new Map(SIZES.map((s) => [s.id, s]));

/** 未知或缺失的模板 id 一律回退到第一套模板。 */
export function resolveTemplate(id) {
  return TEMPLATE_BY_ID.get(id) ?? TEMPLATES[0];
}

/** 未知模板或未知配色都做回退，保证永远返回一个可用配色。 */
export function resolveTheme(templateId, themeId) {
  const template = resolveTemplate(templateId);
  const list = THEMES[template.id] ?? [];
  return list.find((t) => t.id === themeId) ?? list[0];
}

/** 未知画布尺寸回退到 square。 */
export function resolveSize(id) {
  return SIZE_BY_ID.get(id) ?? SIZES[0];
}

/**
 * 只有这些 token 会随字号滑杆缩放：尺寸、留白、阴影这类"版面"属性。
 * 颜色、渐变、字体、字重等一律原样输出——如果去缩放
 * `rgba(255,255,255,0.14)` 里的数字，白色会被改成灰色，这是个真实的坑。
 */
const SCALABLE_TOKENS = new Set([
  'radius',
  'padding',
  'gap',
  'shadow',
  'titleSize',
  'subSize',
  'accentWidth',
  'accentHeight',
  'subGap',
  'eyebrowGap',
  'ruleGap',
]);

function scaleToken(value, factor) {
  if (typeof value !== 'string' || value === '') return null;
  return value.replace(/-?\d*\.?\d+/g, (num) => {
    const parsed = Number.parseFloat(num);
    if (!Number.isFinite(parsed)) return num;
    return String(Number.parseFloat((parsed * factor).toFixed(4)));
  });
}

/**
 * 把模板 token 与配色 token 合并成一组 CSS 自定义属性。
 * 版面类 token 会按 fontScale 等比缩放，颜色和渐变原样输出。
 */
export function buildCssVars(template, theme, fontScale = 1) {
  const vars = {};
  const factor = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  const sources = [template?.tokens, theme?.tokens];

  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const [key, raw] of Object.entries(source)) {
      if (raw === null || raw === undefined || raw === '') continue;
      const text = String(raw);
      const scaled =
        factor !== 1 && SCALABLE_TOKENS.has(key) ? scaleToken(text, factor) ?? text : text;
      vars[`--cl-${key}`] = scaled;

      // 从 surface 派生一块更淡的叠层色，供发光/纸纹使用。
      // 之所以在 JS 里派生而不写 CSS color-mix()：color-mix 在 <foreignObject>
      // 光栅化时不一定被支持，会静默丢色，导出结果和预览对不上。
      if (key === 'surface') {
        vars['--cl-surfaceSoft'] = alphaOf(text, 0.5);
      }
    }
  }

  return vars;
}

/** 把 `rgba(r,g,b,a)` 的透明度乘以 k；不是 rgba 形式时原样返回。 */
function alphaOf(color, k) {
  const match = /^rgba\(\s*([^)]+)\)$/i.exec(color);
  if (!match) return color;
  const parts = match[1].split(',').map((piece) => piece.trim());
  if (parts.length !== 4) return color;
  const alpha = Number.parseFloat(parts[3]);
  if (!Number.isFinite(alpha)) return color;
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${Number.parseFloat((alpha * k).toFixed(4))})`;
}
