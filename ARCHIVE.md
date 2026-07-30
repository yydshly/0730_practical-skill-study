# 0730 · 本次会话归档

> **里程碑 tag**: `v0.11` · Project 2 启动
> **归档时间**: 2026-07-30
> **归档内容**: Project 2 启动（MengTo/Skills 深度研究）

---

## TL;DR

把仓库从"本地逻辑混乱"状态重置为"远端为准 + 完整 Phase A + 部署可访问"的干净状态。

- 重新以远端为基线，丢弃本地冗余内容
- 完成 Roadmap A（模块化重构）+ Roadmap B/C（已记入 README 待办）
- 4 个页面 nav 闭环互通
- GitHub Pages 已上线（https://yydshly.github.io/0730_practical-skill-study/）

---

## 提交时间线

```
8606b8c feat: add Project 2 MengTo/Skills research  ← Project 2 启动
58c2784 fix: 加 .nojekyll 关闭 Jekyll          ← 部署修复
416d71e feat: Phase A 模块化重构 + nav + Pages  ← 主工作
00e0aa5 docs: 三层 README 重构                  ← 早段
7d1c10a docs: outer README                       ← 远端初始
d44b8e7 feat(finesse-skill-study): initial       ← 远端初始
```

---

## 工作清单

### 1. 仓库清理

- **问题**：本地 `finesse-skill-study/` 目录冗余（多份 README、占位文件）
- **做法**：以 GitHub `yydshly/0730_practical-skill-study` 为准，丢弃本地内容
- **代价**：v9 之前的所有本地工作（含 5 层 cinematic hero / 信任卡片 / 微信卡等）丢失，远端为准

### 2. README 三层结构

| 层 | 文件 | 行数 | 职责 |
|---|---|---|---|
| 仓库根 | `README.md` | 127 | 多项目研究容器入口 |
| 项目 1 | `finesse-skill-study/README.md` | 164 | UI 设计 Skill 项目入口 + HTML 入口表 |
| 子交付物 | `finesse-skill-study/family-orchard/README.md` | 102 | 交付物说明 + 5 节 + 后续打磨清单 |

### 3. Phase A · 模块化重构（Roadmap A 完成）

**family-orchard/index.html: 2574 行 → 1100 行（-57%）**

```
family-orchard/
├── index.html                  ← 1100 行薄壳
└── _assets/
    ├── css/  (15 个文件, 共 1223 行)
    │   ├── tokens.css         设计令牌 + dark theme + 字体变量
    │   ├── base.css           共用排版 + 工具类
    │   ├── nav.css            sticky nav + hamburger + drawer
    │   ├── hero.css           §1 5 层 cinematic
    │   ├── journal.css        工艺日志时间线
    │   ├── fruits.css         §2 果品 grid
    │   ├── story.css          §3 故事 + 12 月时间轴
    │   ├── harvest.css        §3.5 + 信任卡
    │   ├── cta.css            §4 表单 + .form-banner
    │   ├── visit.css          §6 来访地图
    │   ├── wechat.css         §7 QR 卡
    │   ├── faq.css            §8 折叠
    │   ├── footer.css         页脚
    │   ├── reveal.css         scroll-reveal + 响应式 + reduced-motion
    │   └── print.css          @media print 占位
    └── js/   (10 个文件, 共 385 行)
        ├── main.js           ES module 入口
        ├── theme.js          主题切换 + localStorage
        ├── nav.js            抽屉菜单 + #drawerTheme 委托
        ├── hero.js           鼠标聚光圈
        ├── hero-rotation.js  3 图轮播 + 控制
        ├── journal.js        changelog 数据 + 切换
        ├── forms.js          表单验证 + 提交
        ├── faq.js           FAQ 折叠
        ├── reveal.js         IntersectionObserver
        ├── photo-guide.js    摄影指南展开
        └── to-top.js         回顶按钮
```

### 4. Phase A 期间修复的 bug

| Bug | 位置 | 修法 |
|---|---|---|
| `var(--font-mono/serif/sans)` 引用但未定义 | tokens.css | 补全 3 个字体变量定义 |
| `var(--ink-faint)` / `var(--accent-soft)` 引用但未定义 | tokens.css | 补全 2 个变量定义 |
| `.layer-cover` 死 selector | reveal.css | 从 `prefers-reduced-motion` 块删除 |
| CSS `url()` 路径错位 | hero.css | `url('_assets/img/...')` → `url('../img/...')`（CSS 文件相对） |
| HTML `url()` 路径错位 | index.html | `url('../img/...')` → `url('_assets/img/...')`（HTML 文件相对） |
| Ken Burns translate 露 fallback 边 | hero.css | `.layer-photo { inset: -4% }`（扩 4% 缓冲） |
| Crossfade 黑屏 1.2s | hero-rotation.js | `remove + add is-active` 同步执行（CSS transition 并行） |

### 5. Hero 视觉调整

| 调整 | 原 | 改 | 效果 |
|---|---|---|---|
| fallback 背景 | `#1a1812` 几乎纯黑 | `#5a4f43` 暖褐 | 照片加载失败也能看见 |
| dawn 顶部 | `rgba(244,213,179,0.32)` | `rgba(255,230,195,0.42)` | 暖光更亮 |
| vignette 暗角 | 80%×65% 椭圆, 35% 起 0.55 | 110%×100% 椭圆, 70% 起 0.18 | 暗角范围缩、强度减半 |
| grain 颗粒 | 0.07 | 0.05 | 更细 |
| 整体亮度 | `brightness(1)` | `brightness(0.92) saturate(0.96)` | 暖色舒适，不"过曝" |

### 6. Hero 轮播（新增）

- 3 张图轮播：`hero.jpg`（晨光果园）/ `hero-2.jpg`（苹果挂枝头）/ `hero-3.jpg`（收获场景）
- 每张停留 5 秒，1.2 秒 → 0.8 秒 交叉淡入淡出
- Ken Burns 8 秒缓推（scale 1.06 → 1.0 + translate）
- 手动控制：左 ‹ / 右 › 箭头 + 底部 3 个圆点（胶囊形）
- 鼠标悬停暂停 / 标签页不可见暂停
- 预加载避免切换白闪

### 7. 4 页 nav 互通

```
examples-index  ←→  capabilities  ←→  prompt-builder  ←→  family-orchard
       ↕                                                            ↕
       └────────────────── 研究库（已闭环）─────────────────────────┘
```

- 3 个工具页 nav-links 加 `→ 拾穗果园样例`（accent 色加粗）
- family-orchard nav-links + drawer 加 `← 研究工具` 返回

### 8. GitHub Pages 部署

| 项 | 状态 |
|---|---|
| 仓库 owner 开 Pages 开关 | ✅ |
| 部署 URL | https://yydshly.github.io/0730_practical-skill-study/ |
| `.nojekyll`（关闭 Jekyll 处理下划线目录） | ✅ |
| 12 个 URL 验证（5 页 + 7 子资源） | ✅ 全 200 |

---

## 文件总览（Phase A 后）

| 路径 | 状态 |
|---|---|
| `0730_practical-skill-study/README.md` | 127 行，仓库总入口 |
| `0730_practical-skill-study/index.html` | 多项目总入口（GH Pages 根） |
| `0730_practical-skill-study/.nojekyll` | 空文件，关闭 Jekyll |
| `0730_practical-skill-study/ARCHIVE.md` | 本文件 |
| `finesse-skill-study/README.md` | 164 行，项目 1 入口 |
| `finesse-skill-study/examples-index.html` | 工具 1：13 个范例索引 |
| `finesse-skill-study/capabilities.html` | 工具 2：能力全景 + 决策树 |
| `finesse-skill-study/prompt-builder.html` | 工具 3：Prompt 自动拼装 |
| `finesse-skill-study/family-orchard/` | 子交付物 |
| ├ `README.md` | 102 行 |
| ├ `index.html` | 1100 行薄壳 |
| └ `_assets/css/` + `_assets/js/` + `_assets/img/` | 25 模块 + 10 张图 |

---

## 后续打磨（Roadmap 整体状态）

### Phase A · 模块化重构 ✅ 已完成

### Phase B · 技术能力验证（待做）

- B1: WebP + `<picture>` + srcset — 10 张图 → 减 ~50-60% 体积
- B2: PWA — manifest + service worker
- B3: 主题切换覆盖深度 — SVG / map iframe / 表单一齐切
- B4: Lighthouse ≥ 90 — 4 维度
- B5: 跨浏览器矩阵

### Phase C · SEO + a11y（待做）

- C1: Schema.org + OG/Twitter Card
- C2: 完整 a11y 审计
- C3: `@media print`
- C4: 性能 budget

### Quality Roadmap（family-orchard 内，独立待办）

- 触屏滑动 hero
- `prefers-reduced-motion` 适配
- `<link rel="preload">` 首屏 hero 图
- favicon + apple-touch-icon
- WebP + responsive images
- OG / Twitter / Schema.org meta
- PWA 起步
- 性能预算
- axe-core a11y 审计
- Lighthouse 跑分 ≥ 90

详见 [finesse-skill-study/family-orchard/README.md · 后续打磨](./finesse-skill-study/family-orchard/README.md#后续打磨quality-roadmap)

---

## Project 2 · MengTo/Skills 研究（进行中）

**上游**: [MengTo/Skills](https://github.com/MengTo/Skills) · 3.9k Stars · MIT

### 研究内容

| 文件 | 内容 |
|---|---|
| `mengto-skills-study/index.html` | 研究总览页面（分类展示 + Demo 预览 + 工作流图解） |
| `mengto-skills-study/README.md` | 完整研究文档（哲学 / 分类 / 格式 / 契约） |
| `mengto-skills-study/SKILL-MATRIX.md` | 118 个技能完整索引（分类 × Demo 链接） |

### 技能规模

- **118** Skills 总数
- **89** Demo 示例（可直接浏览器运行）
- **5** 分类：Codex Workflows (17) / Web Design (79) / Game Dev (19) / UI (1) / Media (2)

### 核心发现

1. **SKILL.md = 触发器 + 工作流**：frontmatter `description` 是 AI 路由的触发条件，Workflow 是执行手册
2. **4 步招牌闭环**：video→superprompt → html→interactions → full-page-capture → daily-inspiration
3. **垂直切片哲学**：游戏开发用垂直切片（Movement → Combat → Enemy → Reward），每个切片可独立验证
4. **Demo 即证明**：每个技能附 `demo/index.html`，1280×720 截图 + 可运行代码
5. **Quality Bar 可测试**：质量标准具体可验证（"prompt 长度足够不看原视频重建动画"）

### Layer 3 · 真实场景测试（已完成）

**文件**: `scene-testing.html`

测试了 4 个代表技能，覆盖 3 类技能形态：

| 技能 | 类型 | 结果 | 核心发现 |
|---|---|---|---|
| `beautiful-shadows` | 工具型 | ✅ 直接可用 | box-shadow 值零摩擦复制，质感远超 Tailwind 默认 shadow |
| `animation-on-scroll` | 工具型 | ✅ 直接可用 | 零依赖 + Tailwind 兼容，但 stagger 方案 SKILL 未说明 |
| `design-action-combat` | 原则型 | ✅ 原则清晰 | 7 状态枚举可落地，需游戏开发经验配合 |
| `video-to-superprompt` | 工作流型 | ⚠️ 需平台 | 6 步 SOP 完整，依赖 ffmpeg/平台工具 |

**三类技能形态的价值排序**：
1. **工具型**（beautiful-shadows）— AI 使用时零摩擦，直接产出可用代码
2. **原则型**（design-action-combat）— 给出设计约束，适合高阶 Agent
3. **工作流型**（video-to-superprompt）— 提供 SOP + Quality Bar，可测试

**对自己 Skill 库的启发**：
- Pitfalls（避免指南）最实用，每个 Skill 都应加
- Stagger 方案需要明确说明，不能让使用者自己摸索
- 设计原则型 Skill 需要更多上下文和示例

### 招牌工作流实战（已完成）

**文件**: `workflow-demo.html`

用上游真实素材（`contract-flight.mp4` + `scroll-world-storytelling` Demo）跑通 4 步闭环：

| 步骤 | 技能 | 本地可跑 | 验证结果 |
|---|---|---|---|
| ① | `video-to-superprompt` | ⚠️ 部分 | ffprobe 实测元数据 ✅，AI superprompt 需模型 |
| ② | `html-to-interaction-prompts` | ✅ 完全 | 源码分析 + 截图 + 3 个可复用 Prompt，全流程可跑 |
| ③ | `stitched-full-page-capture` | ⚠️ 需工具 | Demo 可内嵌预览，长图拼接需 Puppeteer |
| ④ | `build-daily-inspiration-sites` | ❌ 需平台 | 只能验证合约规范，私有部署需 Codex Sites API |

**最有价值的发现**：`html-to-interaction-prompts` 是单步价值最高的——无需外部工具，读 HTML → 写 Prompt → 捕获截图，零摩擦可跑通。

### 后续研究（待做）

- 逐个分类深度分析（Web Design 79 个技能逐个研究）
- 与 Finesse Skill 对比研究
- 构建我们自己的 AI Agent Design Skills 库

---

## 已验证

- ✅ 所有 12 个 GH Pages URL HTTP 200
- ✅ ES module 在 HTTPS 下 MIME 正确（CORS 不拦）
- ✅ Hero 轮播 crossfade 无黑屏
- ✅ 4 页 nav 互通闭环
- ✅ 浅/深主题切换 + localStorage 持久化
- ✅ 表单提交 + success banner
- ✅ FAQ 折叠
- ✅ 工艺日志 changelog 时间线
- ✅ 来访地图（OpenStreetMap iframe）
- ✅ 微信 QR 卡
- ✅ 摄影指南展开/收起
- ✅ 回顶按钮（滚动 70% 后出现）
- ✅ 抽屉菜单（≤920px 移动端）
- ✅ scroll reveal 动画
- ✅ reduced-motion 友好（CSS）

---

## 已知遗留

- GitHub Pages 用的是 **legacy build**（build_type: "legacy"），未来若切到 GitHub Actions 构建可能要重新配置
- Hero "ken-burns 推进" 在某些窄屏 / 高 DPI 上效果略减弱（CSS transform 子像素渲染）
- README.md 的 Roadmap A/B/C 表里 A 已做完但表里没标记（保持原样方便对照历史）
- Phase B/C 全部待做（见上）