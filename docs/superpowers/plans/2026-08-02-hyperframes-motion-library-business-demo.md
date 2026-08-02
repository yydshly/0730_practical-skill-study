---
name: hyperframes-motion-library-business-demo
description: 基于 HyperFrames Motion Library 的业务演示规划 — 静态海报 × 动态视频协作生产闭环
metadata:
  type: plan
  date: 2026-08-02
  status: initial
  related:
    - hyperframes-motion-library-research
---

# HyperFrames Motion Library 业务演示规划

## 目标

将 `gc-minimal-zine-poster`（静态海报生成）与 `HyperFrames Motion Library`（动态视频模板）整合为完整的内容生产闭环。

## 当前状态

### 已完成
- 动效库技术研究（见 spec 归档）
- 业务演示页面框架（hyperframes-motion-library-business-demo/index.html）
- 单模板真实渲染测试（key-point-marker × gc-zine-business preset）
- 透明通道 WebM 动效渲染成功（gc-zine-overlay.webm）

### 待验证的正确用法
- **需要真人出镜原始视频素材**才能真正体现透明通道叠加价值
- 当前渲染的 gc-zine-final.mp4 是错误示范（静态图当背景 ≠ 正确用法）

## 核心认知（需传递给整个团队）

> HyperFrames Motion Library 的模板是**视频组件/叠加层**，不是完整视频场景。正确用法是：**真人视频 + 透明动效 = 成品视频**。

## 下一步行动

### Immediate（本周）
- [ ] 获取或录制一段真人出镜测试视频（30秒以上）
- [ ] 用 key-point-marker 透明动效叠加到真实视频上，验证完整 pipeline
- [ ] 修复业务演示页：正确标注"组件用途"而非"成品视频"

### Short-term（本月）
- [ ] 基于业务场景定制 3-5 个专属 preset（如 KPI 播报、设计要点金句、工具对比）
- [ ] 扩展一个新模板：海报风格演变动效（参考 AGENT_GUIDE.md）
- [ ] 测试剪映导入 MP4 的实际效果

### Medium-term
- [ ] 建立 HyperFrames 模板资产库中文档
- [ ] 设计 gc-minimal-zine-poster × HyperFrames 联合工作流
- [ ] Agent 辅助扩展新模板

## 适用业务场景

| 场景 | 推荐模板 | 交付物 |
|------|----------|--------|
| AI 海报产出量里程碑播报 | number-counter | 透明动效叠加到视频角标 |
| 效率提升展示 | big-number-card | 透明动效叠加到视频侧边 |
| 设计要点金句标注 | key-point-marker | 底部金句条叠加 |
| AI 创作 SOP | three-step-flow | 步骤指引叠加 |
| 工具对比 | bar-chart-grow | 数据图表叠加 |
| 风格概念解释 | concept-spotlight | 术语卡叠加 |
| 误区纠正 | myth-fact-swap | 反转动画叠加 |
| 风格排名榜单 | top-rank-list | 排名动画叠加 |

## 资源

- 动效库本地服务：http://localhost:4312
- 业务演示页：hyperframes-motion-library/business-demo/index.html
- 新增业务 preset：hyperframes-motion-library/templates/key-point-marker/presets/gc-zine-business.json
- 研究归档：docs/superpowers/specs/2026-08-02-hyperframes-motion-library-research.md
