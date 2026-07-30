# 拾穗果园 SHISUI ORCHARD · 家庭果园品牌页

按 `finesse-ui` skill 的 **Quiet Luxury Minimal** + **Forest palette** 规格生成的单 HTML 文件。

## 怎么打开

```
双击 index.html                ← 任何浏览器都能跑
或：
python -m http.server 8000     ← 进入目录后
http://localhost:8000          ← 用本地服务器访问（picsum 图片加载更稳）
```

## 文件结构

```
family-orchard/
└── index.html        ← 全部内嵌在单文件（HTML + CSS + 极少 JS）
```

无外部依赖：
- 字体走系统字体降级链（不上 Inter 等 reflex 默认）
- 图片用 `picsum.photos` 占位（picsum 是免费公开图床）
- 没用 GSAP / Three.js / 任何框架

## 5 节内容

| § | 内容 | 关键招式 |
|---|---|---|
| §1 | Hero — 农场名 + 一句话价值主张 | **双层鼠标遮罩**（CSS-only 招牌动作）|
| §2 | 四季果品 grid — 8 种水果 | 图片 + 2 个 hotspot 注解（糖度 / 海拔） |
| §3 | 农场故事 + 季节时间轴 | 4 节气的真实时间线 |
| §4 | 双入口 CTA（C 端礼盒 / B 端供货）| **真表单**（不是占位块，会拦截提交）|
| §5 | Footer — 联系方式 + 来访信息 | — |

## 互动特性

- **鼠标在 hero 上** → 暗调层揭示出明亮底层（双层 mask）
- **点击右上 "浅 / 深"** → 切换 data-theme，刷新页面保留
- **滚到 12%** 进入视口 → reveal 动效启动
- **submit 表单** → 1–2 秒 success 反馈（前端，无后端）
- **disabled 系统** → 自动尊重 freezes

## 自定义要改什么

打开 `index.html`，需要修改的都在 `<!-- 注释 -->` 附近：

| 你想改 | 在哪里 |
|---|---|
| 农场名（"拾穗果园"） | nav brand + hero-text |
| Hero 文案 | `<h1 class="hero-title">` 与 `<p class="hero-sub">` |
| 果品品种与数字 | `§2` 的 8 个 `<article class="fruit">` |
| 表单字段 | `§4` 两个 `<form class="cta-card">` |
| 联系信息 | `§5` footer |
| 主题色（绿/琥珀） | `:root` 与 `[data-theme="dark"]` 的 CSS 变量 |

## 故意避开的陷阱（finesse-ui 的反 slop 黑名单）

- ❌ 没有米色 + 黄铜 + 木纹的 reflex 默认
- ❌ 没有 box-shadow / border-radius 圆角按钮
- ❌ 没有紫蓝渐变 glow
- ❌ 没有 eyebrow 顶部小标签
- ❌ 没有假精确数字（"92% 满意度"之类）
- ❌ 没有 emoji 图标
- ❌ 没有 marketing buzzword（seamless / empower / game-changer）
- ❌ 没有 Inter / Fraunces / Instrument Serif 等 reflex 字体

## 下一步可做

- **真图片替换**：把所有 `picsum.photos/seed/xxx` 换成你家果园实拍图（同样尺寸 600×750 和 800×1000）
- **多语种**：复制 `<body>` 内容包一层 `<html lang="en">`，把文案替换
- **多页面**：当前是首页，要"关于我们"再复制一份结构替换内容
- **对接后端表单**：把 `submit` 事件里的 `setTimeout` 改成 `fetch('/api/...')`

---

## 后续打磨（Quality Roadmap）

> 当前为**规划、暂未实施**。按价值与投入分组。

### 快速可做（5-30 分钟一个）

- **触屏滑动 hero**：移动端左右划切图，移动 UX 立刻升级
- **`prefers-reduced-motion` 适配**：用户开了系统"减少动效"时，停掉自动轮播 + Ken Burns 推进动画，a11y 合规
- **`<link rel="preload">` 首屏 hero 图**：让首屏渲染前就开始下载 3 张图，减少切图白闪
- **favicon + apple-touch-icon**：浏览器标签页有图标（目前没有）

### 中等投入（半天到一天）

- **WebP + `<picture>` + srcset**：10 张图全转 WebP + 多分辨率响应式，体积降 50-60%，Lighthouse 性能分上去
- **OG / Twitter Card / `<meta description>` / Schema.org Product**：微信朋友圈分享有缩略图，搜索结果更丰富
- **PWA 起步**：`manifest.json` + 简单 service worker，可"安装到桌面"+ 离线 fallback
- **更新本 README**：反映当前模块化结构（15 CSS + 9 JS + main.js + 薄壳 HTML）+ 启动指南，目前还是单文件时代的描述

### 长期打磨

- **Lighthouse 跑分 ≥ 90**：性能 / a11y / 最佳实践 / SEO 四维全达标
- **axe-core a11y 审计 0 violation**：自动检测所有 a11y 问题
- **性能预算**：HTML<50KB · JS<60KB · CSS<30KB · LCP<2s，超阈值 CI 报警
- **`@media print` 打印样式**：PDF 打印 ≤ 8 页，联系方式 + FAQ 完整可读

完成以上后，本页就有了：可复用的架构 + 已验证的技术能力 + 已达标的质量基线，后面加任何新项目都站在这个底座上。
