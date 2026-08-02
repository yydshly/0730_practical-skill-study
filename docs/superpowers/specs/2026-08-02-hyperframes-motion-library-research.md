---
name: hyperframes-motion-library-research
description: HyperFrames Motion Library 研究归档 — 动效模板库能力解析、业务场景匹配、真实视频渲染验证
metadata:
  type: research
  date: 2026-08-02
  status: completed
  related:
    - gc-minimal-zine-poster
---

# HyperFrames Motion Library 研究归档

## 库概述

- **作者：** 栗噔噔（nutllwhy）
- **GitHub：** https://github.com/nutllwhy/hyperframes-motion-library
- **在线演示：** https://nutllwhy.github.io/hyperframes-motion-library/
- **本地服务：** http://localhost:4312（npm run dev）
- **Star：** 230

## 核心定位

一套以 **HyperFrames** 为渲染内核的本地动效资产库。每个动效都是一个可独立预览、校验和渲染的模板；文案、数字、颜色等可变内容通过参数传入，不需要改动动画源码。

## 技术架构

| 层级 | 技术 | 说明 |
|------|------|------|
| 结构 | HTML | 每个模板 = 一个 HTML 文件 |
| 样式 | CSS | 定位、布局、颜色、滤镜、backdrop-filter 玻璃态 |
| 动画 | GSAP 3.14 | `gsap.timeline({ paused: true })` 控制时间轴 |
| 参数 | `data-composition-variables` | HTML 原生属性，存参数的 JSON Schema |
| 变量读取 | `window.__hyperframes.getVariables()` | 渲染时注入参数 |
| 渲染 | hyperframes@0.6.115 npm 包 | Headless Chrome 截图 + FFmpeg 编码 |
| 编码 | FFmpeg | 输出 MP4 / WebM / MOV (ProRes 4444) |

**关键结论：底层就是 HTML + CSS + JavaScript，无 WebGL，无 Canvas，就是最朴素的 DOM + GSAP 动画。**

## 渲染链路

```
HTML 文件（带 GSAP Timeline）
       ↓ hyperframes npm 包
  ├─ 启动 Headless Chrome
  ├─ 加载 HTML，执行 GSAP 动画
  ├─ 按帧截图（每帧 1920×1080 PNG，alpha 通道保留）
  └─ FFmpeg 编码 → MP4/WebM/MOV
```

## 模板结构

每个模板目录：
```
templates/<id>/
├── index.html          # 模板源码（含参数声明 + GSAP 动画）
└── presets/
    ├── default.json     # 默认参数
    └── *.json           # 自定义 preset
```

### 参数声明格式

```html
<html data-composition-variables='[
  {"id":"point","type":"string","label":"重点句","default":"默认文字"},
  {"id":"accent","type":"color","label":"强调色","default":"#FF5A36"}
]'>

<!-- 参数读取 -->
const v = window.__hyperframes?.getVariables() ?? fallback;
```

### GSAP Timeline 格式

```javascript
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
tl.fromTo(".marker", { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: .62, ease: "expo.out" }, .14);
window.__timelines.main = tl;
```

## 20 个模板分类

### 数据可视化（9 个）
| ID | 名称 | 用途 |
|----|------|------|
| bar-chart-grow | 柱状图增长 | 业绩对比、多维度数据 |
| number-counter | 数字计数器 | KPI、里程碑、累计数据 |
| line-chart-draw | 折线绘制 | 时间序列趋势 |
| metric-pulse | 数据脉冲 | 增长数据、里程碑 |
| big-number-card | 大数字结论卡 | 效率/成本/提升幅度 |
| before-after-stat | 前后对比数字 | 工具提效对比 |
| horizontal-bar-compare | 横向条形对比 | 方法对比 |
| top-rank-list | Top 排名卡 | 工具推荐、权重排序 |
| turning-point-line | 拐点趋势线 | 版本演进、关键时刻 |

### 知识讲解（7 个）
| ID | 名称 | 用途 |
|----|------|------|
| concept-spotlight | 概念解释卡 | 术语解释、方法论定义 |
| source-citation-card | 数据来源引用卡 | 知识视频可信度 |
| three-step-flow | 三步流程 | SOP、教程步骤 |
| myth-fact-swap | 误区纠正 | 认知反转、观点纠偏 |
| key-point-marker | 重点标注 | 金句、结论、操作提醒 |
| checklist-pop | 清单核对 | 总结步骤、行动清单 |
| timeline-scan | 时间线推进 | 版本变化、历史演变 |
| cause-chain | 因果链路 | 机制解释、结果说明 |

### 透明叠加（4 个）
| ID | 名称 | 用途 |
|----|------|------|
| stat-duel | 双数据对比 | 透明叠加在实拍画面底部 |
| status-split | 状态转折 | 章节式对照 |
| number-impact | 极值刻度 | 冲击型叠加 |

## 输出格式

| 格式 | 用途 | 特点 |
|------|------|------|
| MP4（深色底） | 直接导入剪映 | 保留黑色背景，兼容性最好 |
| MOV（透明通道） | ProRes 4444 | 本地自动转换，文件大 |
| WebM（透明通道） | 网页/支持 WebM 的编辑器 | 文件更小 |

## 与 gc-minimal-zine-poster 的关系

| 维度 | gc-minimal-zine-poster | HyperFrames Motion Library |
|------|------------------------|---------------------------|
| 输出形态 | 静态 3:5 海报图（JPEG） | 动态视频（MP4/WebM/MOV） |
| 模板理念 | Prompt Compiler 模板化 | JSON 参数模板化 |
| 输出场景 | 海报、封面、社媒配图 | 社媒视频、口播叠加、数据展示 |
| 渲染方式 | AI 图像模型生成 | Chrome + FFmpeg 本地渲染 |
| 内容类型 | 视觉美学表达 | 数据叙事、知识讲解、强调标注 |
| 扩展路径 | 新 Style/Layout Variation | 新 Template/AGENT_GUIDE 扩展 |

**协作价值：** 同一套数据源 → 静态图 + 动态视频双产出

## 关键认知

1. **这些模板是"组件"不是"完整视频"** — 数字计数器、重点标注、概念卡都是叠加在真人出镜视频上的透明动效层，不是独立完整的视频场景
2. **正确用法：** 真人视频 + 透明通道动效 = 成品视频
3. **错误用法：** 静态图 + 动效模板 = 假视频（之前走了这个弯路）
4. **透明通道是核心能力** — 动效叠加在真人画面上，才真正产生价值

## 本地运行

```bash
cd hyperframes-motion-library
npm install
npm run dev
# → http://localhost:4312
```

命令行渲染：
```bash
npm run render -- <template-id> <preset.json>
# 示例
npm run render -- key-point-marker templates/key-point-marker/presets/default.json
```

## 相关文件

- **业务演示：** `hyperframes-motion-library/business-demo/`
- **新增业务 preset：** `templates/key-point-marker/presets/gc-zine-business.json`
- **渲染产出透明动效：** `hyperframes-motion-library/business-demo/gc-zine-overlay.webm`
- **FFmpeg 合成测试：** `hyperframes-motion-library/business-demo/gc-zine-final.mp4`（注：此为测试素材，竖图强行塞横屏构图不理想，正确用法需要真人出镜视频叠加透明动效）
