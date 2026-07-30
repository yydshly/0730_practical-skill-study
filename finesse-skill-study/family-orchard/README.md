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
