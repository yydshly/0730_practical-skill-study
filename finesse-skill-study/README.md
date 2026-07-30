<div align="center">

# 0730 · 实用技能应用研究

**「理论设计 Skill + 实战打磨 = 能上线的真东西。」**

> 一个把设计/前端技能学到能用为目的的研究库。
> 每个项目从「学到的理论」到「真实落地的页面 / 模块」走完全闭环。

</div>

---

## 这是什么库

研究库 = **学 + 用** 两层并行：

- **学**：克隆上游设计 Skill（[`finesse-ui`](https://github.com/mouse-lin/finesse-skill)）到本地，研读它的 13 个范例 HTML、20 个 references、动词命令。
- **用**：用所学方法真实搭建 1+ 个独立的可交付页面，并记录过程中对方法的调整、补充、改进。

每一个交付物（我们称为**项目 Project**）都以自洽的目录形式存在，可以单独打开、独立部署、独立二次开发。

---

## 仓库结构

```
.
├── README.md                        ← 你正在读的（外层）
├── AGENTS.md / USAGE.md             ← 上游 Skill 自带的文档,保留
│
├── .trae/skills/finesse-ui/         ← 上游 Skill 库(vendor,只读)
├── skills/finesse-ui/                ← 同上的本地工作副本
│
├── examples-index.html              ← 13 个范例的索引浏览器(我们的研究工具)
├── capabilities.html                ← 能力全景 + 决策树 + 12 节演示
├── prompt-builder.html              ← 表单式 AI 复刻指令拼装器
│
└── family-orchard/                  ← 项目 1 / 拾穗果园品牌官网
    ├── README.md
    ├── index.html
    └── _assets/img/                  ← 10 张 Pollinations AI 摄影
```

**3 个研究工具 HTML + 1 个交付项目**。未来每个新项目都按 `项目名/` 单目录形式加入。

---

## 已完成 (v0 → v9)

| 版本 | 内容 | 关联产物 |
|---|---|---|
| **v0** | 读懂上游 Skill:研读 13 个范例 HTML + 20 篇 references,起草 Quiet Luxury + Forest palette 规格 | `examples-index.html` |
| **v1** | 把 13 个范例做成可浏览的索引,每张卡含 AI 复刻 Prompt / 真实色板 / 布局参数 / 核心代码 4 个标签 | `examples-index.html` |
| **v2** | 实现能力全景页:三拨盘 + 5 hero engine + 10 persona + 8 chart 现场演示 + 12 节"这节解决什么问题"提示 | `capabilities.html` |
| **v3** | 拼 Prompt 工具:10 步表单实时拼出可粘贴到 Claude/Codex 的指令 | `prompt-builder.html` |
| **v4** | 把 3 个工具页串成一个导航互通的工作流 | `examples-index` + `capabilities` + `prompt-builder` 共用 topnav |
| **v5** | **项目 1** 立项:用户做苹果/梨/桃等家庭果园品牌页,使用 Quiet Luxury + Forest palette | — |
| **v6** | Hero 重做:5 层 cinematic(底图 + dawn glow + vignette + grain + mouse-follow spot);用 Pollinations API 生成真摄影图 | `family-orchard/index.html` |
| **v7** | 8 张水果图全部用 AI 生成,色温统一 CSS filter,8 张 hotspot 加到 3 个(糖度 / 海拔 / 采收日) | `family-orchard/index.html` |
| **v8** | 本周采摘 / 信任卡片 / FAQ / 微信卡 / 来访地图 / 摄影指南 / 工艺日志(顶部 changelog 时间线) | `family-orchard/index.html` |
| **v9** | "工艺日志"嵌入到工具页 workflow,记录每一轮迭代过程 | 三页共用 |

每个版本的细节可在 `family-orchard/index.html` 顶部的"工艺日志"面板里查到。

---

## 待做 (Roadmap · 阶段 A → B → C)

> 优先级: **架构 → 技术深度 → SEO + a11y**。先稳固地基,再追求质量基线。

### 阶段 A · 模块化重构(下一站)

把 `family-orchard/index.html` 从单文件 2574 行拆成多文件,便于:

- 加 page(blog / calendar / EN 版)时不爆炸
- 各 section 可单独删除/替换/分发
- 长期维护成本 ↓

目标结构:
```
family-orchard/
├── index.html         ← 极薄,只挂 #app
└── _assets/
    ├── css/
    │   ├── tokens.css       ← :root 变量与 reset
    │   ├── nav.css          ← 顶 + 抽屉
    │   ├── hero.css
    │   ├── journal.css
    │   ├── fruits.css / harvest.css / story.css
    │   ├── trust.css / visit.css / wechat.css / faq.css
    │   └── print.css        ← 打印样式
    └── js/
        ├── main.js          ← 入口
        ├── theme.js / nav.js / hero.js / journal.js
        ├── forms.js / faq.js
        └── utils.js         ← IOC + raf + prefers-motion
```

### 阶段 B · 技术能力验证

| 项 | 验证什么 |
|---|---|
| **B1 · WebP + `<picture>` + srcset** | 响应式图像架构 + 验证体积下降 50% |
| **B2 · PWA**(manifest + service worker)| 装机可行性 + 离线 fallback |
| **B3 · 主题切换覆盖 inline** | 深色模式下 SVG / map iframe / 表单一齐切干净 |
| **B4 · Lighthouse ≥ 90** | Performance / Accessibility / Best Practices / SEO 四维全部 ≥ 90 |
| **B5 · 跨浏览器矩阵** | Chrome / Firefox / Edge / Safari 16+ 桌面 + 移动 |

### 阶段 C · SEO + a11y

| 项 | 验证什么 |
|---|---|
| **C1 · Schema.org + OG/Twitter Card** | 百度/Google 知识图谱 + 朋友圈分享缩略图 |
| **C2 · 完整 a11y 审计** | axe-core 0 violations / Lighthouse Accessibility ≥ 95 / 键盘可达 + 屏阅友好 |
| **C3 · @media print** | 打印 PDF ≤ 8 页,联系方式 + FAQ 完整可读 |
| **C4 · 性能 budget** | 设硬上限(HTML<50KB · JS<60KB · CSS<30KB · LCP<2s),CI 自动监控 |

**完成阶段 A + B + C 后**,这个研究库就有了:可复用的架构 + 已验证的技术能力 + 已达标的质量基线,后面加任何新项目都站在这个底座上。

---

## 维护约定

- **加新项目**:在根目录建 `项目名/` 子目录,内含自己的 `README.md` + `index.html` + `_assets/`,不必改其它文件
- **加新研究工具**:可以直接放根目录,工具页之间用 `xx-nav.html` 互链
- **改上游 Skill**:不动 `.trae/skills/finesse-ui/`(vendor),如要修改,在 `skills/finesse-ui/` 内 fork
- **OPTIMIZATION.md**(在工作区根,被 .gitignore 忽略):个人待办 / 不进库的

---

## 致谢

- 上游 Skill: **[finesse-skill](https://github.com/mouse-lin/finesse-skill)** @ mouse-lin —— MIT
- AI 图像生成: **[Pollinations.ai](https://pollinations.ai)**(免费,免 key)
- 编者工具链: Claude Code · Pollinations.ai · OpenStreetMap

---

## 项目索引

- [项目 1 · 拾穗果园品牌官网](./family-orchard/) — 已完成 v0 → v9
- [研究工具 · examples-index](./examples-index.html) — 13 个范例索引
- [研究工具 · capabilities](./capabilities.html) — 能力全景 + 决策树
- [研究工具 · prompt-builder](./prompt-builder.html) — Prompt 自动拼装
