<div align="center">

# 0730 · 实用技能应用研究

**「理论 + 实战 = 能上线的真东西。」**

> 一个多项目研究容器。每个项目是一个独立的设计 / 前端实战,
> 从「学到的理论」到「真实落地的页面 / 模块」走完全闭环。

</div>

---

## 这是什么库

这是一个用于探索「把设计 / 前端技能学到能用」的 **多项目研究容器**。

- **学 + 用 两层并行**:在每个项目内部,先学上游理论(Skill / 设计系统 / 文档),
  再用所学方法真实搭建可交付的页面 / 模块。
- **每个项目独立**:每个项目是一个子目录,可以单独打开、独立部署、独立二次开发。
- **持续累积**:随着项目越来越多,容器里沉淀下来的方法论与可复用资产也越来越厚。

---

## 在线访问（GitHub Pages）

部署在 GitHub Pages 上，**100% 静态**（无后端、无构建步骤）：

| 路径 | 内容 |
|---|---|
| [`/`](https://yydshly.github.io/0730_practical-skill-study/) | 仓库总入口（多项目索引） |
| [`/finesse-skill-study/examples-index.html`](https://yydshly.github.io/0730_practical-skill-study/finesse-skill-study/examples-index.html) | 项目 1 · 13 个范例索引 |
| [`/finesse-skill-study/capabilities.html`](https://yydshly.github.io/0730_practical-skill-study/finesse-skill-study/capabilities.html) | 项目 1 · 能力全景 + 决策树 |
| [`/finesse-skill-study/prompt-builder.html`](https://yydshly.github.io/0730_practical-skill-study/finesse-skill-study/prompt-builder.html) | 项目 1 · Prompt 自动拼装 |
| [`/finesse-skill-study/family-orchard/`](https://yydshly.github.io/0730_practical-skill-study/finesse-skill-study/family-orchard/) | 项目 1 子交付物 · 拾穗果园 |
| [`/mengto-skills-study/`](https://yydshly.github.io/0730_practical-skill-study/mengto-skills-study/) | 项目 2 研究总览 |
| [`/mengto-skills-study/demo-gallery.html`](https://yydshly.github.io/0730_practical-skill-study/mengto-skills-study/demo-gallery.html) | 项目 2 · Demo 展示（89 个可运行） |
| [`/mengto-skills-study/capability-map.html`](https://yydshly.github.io/0730_practical-skill-study/mengto-skills-study/capability-map.html) | 项目 2 · 能力地图（决策树） |
| [`/mengto-skills-study/scene-testing.html`](https://yydshly.github.io/0730_practical-skill-study/mengto-skills-study/scene-testing.html) | 项目 2 · 场景测试（4 技能验证） |
| [`/mengto-skills-study/workflow-demo.html`](https://yydshly.github.io/0730_practical-skill-study/mengto-skills-study/workflow-demo.html) | 项目 2 · 工作流实战（4 步闭环） |

> 部署开关：`Settings → Pages → Source: master · /(root)`（首次部署需仓库 owner 手动开启）

---

## 本地浏览

```bash
# 在仓库根目录起一个静态服务器（任意端口都可）
python -m http.server 8000

# 然后浏览器打开：
#   http://localhost:8000/                                    ← 仓库总入口
#   http://localhost:8000/finesse-skill-study/               ← 项目 1 入口
#   http://localhost:8000/finesse-skill-study/examples-index.html
#   http://localhost:8000/finesse-skill-study/family-orchard/
#   http://localhost:8000/mengto-skills-study/               ← 项目 2 入口
#   http://localhost:8000/mengto-skills-study/demo-gallery.html
#   http://localhost:8000/mengto-skills-study/capability-map.html
#   http://localhost:8000/mengto-skills-study/scene-testing.html
#   http://localhost:8000/mengto-skills-study/workflow-demo.html
```

> 项目 1 子交付物（family-orchard）使用了 ES module，必须走 HTTP 不能 `file://` 双击。项目 2 的 Demo 展示页内含"打开 Demo"链接，必须用 HTTP 服务打开。

---

## 仓库结构

```
.
├── README.md                       ← 你正在读的(外层)
├── .gitignore
│
├── finesse-skill-study/            ← 项目 1
│   ├── README.md                   ← 项目 1 入口
│   ├── examples-index.html         ← 研究工具:13 个范例的索引浏览器
│   ├── capabilities.html           ← 研究工具:能力全景 + 决策树
│   ├── prompt-builder.html         ← 研究工具:Prompt 自动拼装器
│   └── family-orchard/             ← 项目 1 的子交付物
│       ├── README.md
│       ├── index.html
│       └── _assets/img/            ← 10 张 Pollinations AI 摄影
│
└── mengto-skills-study/            ← 项目 2 · MengTo/Skills 研究
    ├── README.md                   ← 项目 2 入口
    ├── index.html                  ← 研究总览
    ├── demo-gallery.html           ← Layer 1 · 118 技能 Demo 展示(89 有 Demo)
    ├── capability-map.html         ← Layer 2 · 能力决策树
    ├── scene-testing.html          ← Layer 3 · 4 技能真实场景验证
    ├── workflow-demo.html          ← Layer 3 · 招牌 4 步工作流演示
    ├── SKILL-MATRIX.md            ← 118 技能完整索引
    └── agent-skills/               ← 118 个技能的源代码(SKILL.md + demo)
```

**当前 2 个项目,4 个研究工具 HTML,1 个可交付页面。** 未来每个新项目按 `项目名/` 单目录形式加入。

---

## 项目索引

| # | 项目 | 一句话 | 状态 |
|---|---|---|---|
| 1 | [finesse-skill-study](./finesse-skill-study/) | 学习 UI 设计 Skill 并实战一个家庭果园品牌页 | 已完成 v0 → v9 |
| 2 | [mengto-skills-study](./mengto-skills-study/) | 深度研究 MengTo/Skills 库（118 个 AI 设计技能） | 研究中 |

> **项目 2 研究三层**：
> - **Layer 1**：[Demo 展示](./mengto-skills-study/demo-gallery.html) — 118 技能 89 个 Demo 可视浏览
> - **Layer 2**：[能力地图](./mengto-skills-study/capability-map.html) — "需要 X → 用哪个 Y"决策树
> - **Layer 3**：[场景测试](./mengto-skills-study/scene-testing.html) + [工作流实战](./mengto-skills-study/workflow-demo.html) — 4 技能真实验证 + 招牌 4 步闭环演示
| - | [项目 1 · examples-index](./finesse-skill-study/examples-index.html) | 13 个范例索引浏览器 | ✓ |
| - | [项目 1 · capabilities](./finesse-skill-study/capabilities.html) | 能力全景 + 决策树 | ✓ |
| - | [项目 1 · prompt-builder](./finesse-skill-study/prompt-builder.html) | Prompt 自动拼装器 | ✓ |
| - | [项目 1 · 子交付物 · 拾穗果园](./finesse-skill-study/family-orchard/) | 家庭果园品牌官网（已模块化为 15 CSS + 9 JS） | ✓ |
| 2 | [项目 2 · MengTo/Skills 研究](./mengto-skills-study/) | 118 个 AI Agent 设计技能深度研究 | 研究中 |
| - | [项目 2 · Demo 展示](./mengto-skills-study/demo-gallery.html) | 118 技能 89 个 Demo 可视浏览 | ✓ |
| - | [项目 2 · 能力地图](./mengto-skills-study/capability-map.html) | 118 技能"需要 X → 用哪个 Y"决策树 | ✓ |
| - | [项目 2 · 场景测试](./mengto-skills-study/scene-testing.html) | Layer 3 · 4 个技能真实场景验证 | ✓ |
| - | [项目 2 · 工作流实战](./mengto-skills-study/workflow-demo.html) | 招牌 4 步闭环完整演示 | ✓ |
| - | [项目 2 · 技能矩阵](./mengto-skills-study/SKILL-MATRIX.md) | 全部 118 个技能的分类索引 | 建设中 |

(更多项目待加入。)

---

## 加新项目的约定

每个新项目在仓库根目录建一个 `项目名/` 子目录:

```
项目名/
├── README.md                   ← 项目入口(描述这个项目是啥 / 做啥 / 怎么用)
├── index.html(或其他主入口)    ← 交付物
└── _assets/                    ← 资源(可选)
```

- **项目内部完全自治**:自己定 README 结构、自己定章节、自己定内部约定。
- **项目之间互不依赖**:不交叉引用,不要求共用资源,不强求风格统一。
- **方法论留在项目内**:每个项目的迭代日志、Roadmap、设计决策由项目自己的 README 承载。
- **外层只管索引 + 约定**:本 README 只列出项目列表和加项目的通用规则,不进入项目内部细节。

---

## 致谢

- 上游 Skill: **[finesse-skill](https://github.com/mouse-lin/finesse-skill)** @ mouse-lin —— MIT
- AI 图像生成: **[Pollinations.ai](https://pollinations.ai)**(免费,免 key)
- 编辑工具链: Claude Code · Pollinations.ai · OpenStreetMap

---

## 许可证

本仓库采用 MIT 许可证。详见 `./finesse-skill-study/LICENSE`。