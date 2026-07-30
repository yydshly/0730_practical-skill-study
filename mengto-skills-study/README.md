# Project 2 · MengTo/Skills 深度研究

> **上游仓库**: [MengTo/Skills](https://github.com/MengTo/Skills) · MIT License
> **研究目标**: 深度解析这个 AI Agent 设计技能库的架构设计、能力边界与实战价值
> **克隆版本**: `main`分支，2026-07-30

---

## TL;DR

**MengTo/Skills** 是一个**面向 AI 编码智能体的设计技能库**（3.9k Stars），把设计专业知识封装成 118 个 `SKILL.md` 工作流，让 Codex/Claude Code/Cursor/Lovable 等 AI 助手能够精准完成 UI 设计、游戏开发、动画实现等复杂任务。

---

## 仓库规模

| 指标 | 数值 |
|---|---|
| Stars | 3.9k |
| Forks | 470 |
| Skills 总数 | 118 |
| Codex 工作流 | 17 |
| Web Design 技能 | 79 |
| Game Development 技能 | 19 |
| UI 技能 | 1 |
| Media 技能 | 2 |
| Demo 示例 | 89 |
| 提交数 | 110 |

---

## 核心哲学

### 1) 提示词是资产
Good prompts = version them + build libraries

### 2) 规格优于感觉
Clear constraints + hierarchy = consistent output

### 3) 参考优于描述
Screenshots carry fonts, spacing, colors, layout rhythm

### 4) 技能即操作规程
Tell agents exactly when, what defaults, what pitfalls to avoid

---

## 五大分类详解

### Codex Workflows (17)

将设计工作流封装为 AI 可执行的重复操作：

| 技能 | 用途 |
|---|---|
| `video-to-superprompt` | 视频 → 超级重建提示词 |
| `html-to-interaction-prompts` | HTML 页面 → 可复用交互提示词组 |
| `stitched-full-page-capture` | 全页截图（含懒加载/WebGL/动画页） |
| `daily-ui-inspiration-capture` | 每日 UI 灵感捕获循环 |
| `browser-video-recording` | 浏览器录屏视频制作 |
| `optimize-web-animations` | 动画性能分析与优化 |
| `elevenlabs-tts` | ElevenLabs 语音合成 |
| `x-bookmark-quote-posts` | X 推文书签 → 引用帖草稿 |
| `audit-verify-explain-grade-5` | 审计 + 用五年级语言解释结果 |

### Web Design (79) ← 最大分类

#### 动画与滚动
- `gsap` / `gsap-scrolltrigger-storytelling` — GSAP 时间线、ScrollTrigger、stagger
- `cinematic-gsap-lenis-motion-system` — 电影感 GSAP + Lenis 滚动系统
- `animation-on-scroll` — IntersectionObserver 滚动动画
- `marquee-loop` — 无缝循环字幕
- `staggered-word-reveal` — 文字错落显示

#### WebGL / 3D / 交互背景
- `threejs` — Three.js 场景/相机/渲染/GLTF加载/性能
- `globe-gl` / `globe-particles` — 3D 地球可视化
- `matterjs` — 2D 物理引擎（碰撞、布料、粒子）
- `vantajs` — WebGL 动画背景
- `cobejs` — 轻量交互地球
- `unicorn-studio` — 嵌入式交互设计工具

#### CSS 特效
- `beautiful-shadows` — 精致阴影
- `progressive-blur` — 渐进模糊
- `css-border-gradient` — 渐变边框
- `css-alpha-masking` — Alpha 遮罩
- `gooey-blob-system` — 果冻 Blob 动画

#### 视觉风格（命名即审美）
- `dark-glass-clean-layout` · `blue-laser-clean-glass-layout` · `orange-clean-paper-saas`
- `skeuomorphic-ui` · `glass-dark-ui` · `dither-laser-dark-mode`
- `framed-tech-dark-border-gradient` · `tech-green-dark-mode-modern`

#### 布局系统
- `agency-grid-layout-minimal` · `framed-grid-layout` · `nested-container-frames`
- `editorial-tech` · `split-layout-technical` · `technical-wireframe-info-layout`

### Game Development (19)

Three.js 和浏览器游戏开发的完整技能矩阵：

| 技能 | 用途 |
|---|---|
| `build-isometric-arpg` | 等距 ARPG 垂直切片开发 |
| `author-game-levels` | 关卡设计（路径 + 灯光） |
| `build-game-camera-controls` | 相机控制（跟随/锁定/触摸） |
| `design-action-combat` | 战斗系统（起手/命中/防御） |
| `build-threejs-enemy-systems` | 敌人系统定义与实现 |
| `build-game-monster-system` | 怪物 Rig/动画/LOD |
| `tune-enemy-ai` | 敌人 AI 感知与决策 |
| `design-game-encounters` | 遭遇战设计（波次/Boss） |
| `build-game-inventory` | 背包/装备/掉落系统 |
| `create-game-vfx` / `build-game-audio-feedback` | 视觉/音效反馈 |
| `build-mobile-threejs-games` | 移动端适配 |
| `test-playable-web-games` | 游戏 QA 测试 |
| `ship-web-games` | 发布与部署验证 |

### UI (1)

`design-first-ui-prompting` — 设计优先的 UI 提示词系统：
- 6 段式提示词模板：Goal → Format → Layout → Type → Color → Constraints
- 变量迭代工作流（变体 > 重新生成）
- 负面提示词 / Guardrails
- 2-pass 字体流程（先生成布局，Figma 排版）

### Media (2)

- `aura-asset-images` — Aura Assets 商业图库
- `unsplash-asset-images` — Unsplash 高质量免费图

---

## 技能文件夹契约

```
agent-skills/<category>/<skill-name>/
├── SKILL.md              # 必需：frontmatter + 工作流
├── REFERENCES.md         # 可选：仅链接
├── ARTICLE.md           # 可选：长文解释
├── assets/              # 可选：图片/模板/示例
├── scripts/             # 可选：辅助脚本
└── demo/
    ├── index.html        # 可移植的独立 HTML（含内联 CSS/JS）
    ├── PROMPT.md         # 精确复现提示词 + 变体提示词
    ├── preview.jpg       # 1280×720 浏览器截图
    ├── source.json       # Neuform 溯源数据
    └── assets/          # 本地 demo 资源
```

---

## SKILL.md 标准格式

```markdown
---
name: <skill-name>
description: <Use when ... 精确触发条件>
---

# Skill Title

## Goal
<一句话目标>

## Workflow
1. <步骤 1>
2. <步骤 2>
...

## Quality Bar
<质量标准>

## Pitfalls
<常见错误>
```

---

## Demo 运行方式

```bash
cd mengto-skills-study
python3 -m http.server 4173 -d agent-skills/<category>/<skill-name>/demo
# 浏览器打开 http://localhost:4173
```

---

## 招牌工作流（旗舰四步）

```
① video-to-superprompt    视频 → 超级提示词
        ↓
② html-to-interaction-prompts   HTML → 交互提示词组
        ↓
③ stitched-full-page-capture   全页截图
        ↓
④ daily-ui-inspiration-capture   每日灵感循环
```

---

## 研究产出

| 文件 | 内容 |
|---|---|
| `index.html` | 研究总览 + Demo 展示入口 |
| `STUDY.md`（本文件）| 深度研究笔记 |
| `SKILL-MATRIX.md` | 技能矩阵（分类 × 能力） |

---

## License

继承上游 MIT License。详见 [LICENSE](../LICENSE)。
