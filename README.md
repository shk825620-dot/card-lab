# card-lab · 卡片工坊

**输入一句话，实时生成一张好看的卡片，一键导出高清 PNG。**

纯前端 · 零后端 · 不上传任何数据 · 手机浏览器打开就能用。

[![在线体验](https://img.shields.io/badge/在线体验-card--lab-7c6cff)](https://shk825620-dot.github.io/card-lab/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

<!--
  TODO(作者自己动手)：录一段 10~15 秒的 GIF 放在这里。
  录屏内容建议：打字 -> 切模板 -> 点导出 -> 图片保存下来。
  这一段是整份 README 最重要的一行，README 的转化率一半靠它。
  录好后把文件放到 public/demo/demo.gif，然后把下面这行的注释去掉。
-->

<!-- ![演示](public/demo/demo.gif) -->

## 它解决什么问题

想发一条朋友圈、做一张班级通知配图、给文章配个头图的时候，打开 PS 太重、找模板网站要么要登录要么加水印。
card-lab 打开就能用：把字敲进去，挑个模板，点导出，一张 1080p 的图就下来了。**全程在浏览器里跑，你的文字不会发到任何服务器。**

## 功能

| | |
|---|---|
| **4 套模板** | 玻璃拟态、霓虹赛博、日系极简、杂志排版 |
| **多套配色** | 每套模板自带 3–4 种预设配色 |
| **4 种画布** | 方图 1:1、竖图 3:4、长图 9:16、横图 16:9 |
| **字号调节** | 50%–200%，留白、圆角、阴影会跟着一起等比缩放 |
| **导出 PNG** | 默认 2 倍像素密度，1080×1080 的画布导出 2160×2160 |
| **长文保护** | 文字太多时自动收紧排版，不会溢出画布 |
| **记住设置** | 刷新后模板、配色、画布、内容都还在（存在浏览器本地） |

## 本地运行

这个项目**不需要安装任何依赖**就能跑起来：

```bash
node server.mjs
# 打开 http://127.0.0.1:5178/
```

想换个端口：`node server.mjs 8080`。

<details>
<summary>可选：用 Vite 起开发服务器</summary>

```bash
npm install
npm run dev
```

Vite 只提供本地开发体验（模块热更新）。**线上部署不经过它**，所以你可以完全不装它。
</details>

## 跑测试

```bash
node tests/run-all.mjs
```

测试用 Node 内置的 `node:test`，同样**不需要安装任何依赖**。也可以单独跑：

```bash
node tests/theme.test.js
```

覆盖范围：状态模型与校验、模板/配色/画布的解析与回退、预览缩放边界、文件名生成、导出外框计算，以及用最小 DOM 桩验证卡片渲染（含"用户输入不会变成 HTML"这条安全断言）。

## 项目结构

```
card-lab/
├── index.html                单页应用
├── server.mjs                零依赖本地服务器（根目录 + public/ 映射到网站根）
├── src/
│   ├── main.js               装配层：控件事件 -> store -> 渲染 / 导出
│   ├── store.js              单一状态源 + 订阅
│   ├── model.js              [纯] 状态模型与校验
│   ├── theme.js              [纯] 模板 / 配色 / 画布定义与解析
│   ├── fit.js                [纯] 预览缩放计算
│   ├── filename.js           [纯] 导出文件名生成
│   ├── render.js             卡片 DOM 渲染
│   └── export.js             PNG 导出
├── public/
│   ├── styles/               设计令牌 + 4 套模板样式 + 应用样式
│   ├── vendor/               锁定的导出库（见下）
│   └── demo/                 演示素材
├── tests/                    node:test 单元测试
├── scripts/                  维护脚本
└── docs/superpowers/         规格与实施计划
```

## 为什么把导出库放在 public/vendor

导出用 [modern-screenshot](https://github.com/qq15725/modern-screenshot)（MIT），但它**没有进 package.json**，而是把构建产物直接提交到仓库里：

- 第一次 clone 的人不装依赖也能立刻用；
- 锁死字节，不会某天因为升级依赖导致导出结果悄悄变化。

| | |
|---|---|
| 版本 | `4.7.0` |
| 文件 | `public/vendor/modern-screenshot.umd.js` |
| 原始产物 sha256 | `bb36665889124a0b6e15f16045265737449c3bdcf2712cdb08af3cfa01563e2b` |

想升级版本：`node scripts/vendor-modern-screenshot.mjs 4.8.0`，然后把上表的哈希一起改掉。

## 设计上的几个硬约束

这些不是洁癖，每一条都是踩过的坑：

1. **全程禁用 `backdrop-filter`。** 导出走的是 `DOM → SVG <foreignObject> → canvas` 这条路径，`backdrop-filter` 在这一步会静默丢失。所以"玻璃"效果是用半透明叠层 + 内高光近似出来的，不是真毛玻璃——**换来的是导出图和预览图长得一样**。
2. **不用 `color-mix()`。** 同样的原因，在 `<foreignObject>` 光栅化时不一定被支持。需要派生颜色时在 JS 里算好再写进内联样式。
3. **卡片内部一律用 `rem`。** 卡片根节点的 `font-size` 由字号倍率推导，于是"放大字号"会把留白和圆角一起等比放大，版面比例不会走形。
4. **预览用 `transform: scale()`，不改卡片的逻辑尺寸。** 所见即所得的前提是"预览时卡片就是 1080×1080"，只是视觉上被缩小了。
5. **卡片内容只用 `textContent` 写入。** 用户输入 `<img onerror=...>` 也只会显示成文字。测试里有一条专门的断言守着这点。
6. **缩放只改内层，不改被 `ResizeObserver` 观测的元素。** 否则"改尺寸 -> 触发回调 -> 又改尺寸"会形成死循环。

## 已知问题

- **在受限沙箱里 `vite build` 可能失败**（`spawn EPERM`）：Vite 在 Windows 上会调 `exec('net use')` 判断网络盘，某些禁用了子进程管道调用的环境会拒绝。**这不是项目的问题**，线上部署不依赖 Vite，用 `node server.mjs` 本地预览即可。
- **中文字体依赖系统字体。** 现在用的是 `Noto Sans SC / PingFang SC / Microsoft YaHei` 这条回退链，不同设备导出的字形会有细微差别。想做完全一致需要自托管字体文件，会明显增大仓库体积，暂不做。
- **导出图里的颜色和屏幕上看可能有极小差异**，这是 canvas 光栅化与屏幕渲染的正常区别。

## Roadmap

- [ ] 导出倍率开关（1x / 2x / 3x）与 JPG 格式
- [ ] 多段分页导出（超长文字的完整版）
- [ ] 自定义配色并保存为"我的主题"
- [ ] 英文界面

## 许可证

[MIT](LICENSE)
