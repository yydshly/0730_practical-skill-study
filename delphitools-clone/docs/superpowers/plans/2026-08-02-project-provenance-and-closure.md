# 项目来源说明与阶段收尾实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在能力总览和全部工具说明中显示准确、统一的项目来源与当前阶段边界，并保留为未提交预览供用户验收。

**Architecture:** 使用一个纯数据模块集中维护参考网页、官方源码和许可证信息；能力总览显示完整说明，统一工具说明面板显示简短来源行。现有工具算法、状态筛选和路由保持不变。

**Tech Stack:** React 18、TypeScript、Vite、Vitest、Testing Library、现有 CSS 变量系统。

## Global Constraints

- 不修改任何工具算法、输入、输出或能力状态。
- 不声称本项目是官方版本、镜像或完整复刻。
- 如实说明此前主要参考网页可见行为，官方源码从当前阶段开始用于核对。
- 外部链接使用新标签页和 `noopener noreferrer`。
- 本轮不得提交；展示后由用户决定是否提交。

---

### Task 1: 集中来源数据并接入两个说明层级

**Files:**

- Create: `src/data/projectProvenance.ts`
- Modify: `src/app/CapabilityStatusPage.tsx`
- Modify: `src/components/ToolExplanationPanel.tsx`
- Modify: `src/styles/components.css`
- Modify: `tests/capability-status-page.test.tsx`
- Modify: `tests/tool-explanation-panel.test.tsx`

**Interfaces:**

- Produces: `PROJECT_PROVENANCE`，包含 `referenceSiteUrl`、`sourceRepositoryUrl`、`licenseUrl`、实现关系和阶段进展文本。
- Consumes: 能力总览和统一工具说明组件只读取该对象。

- [ ] **Step 1: 写失败测试**

在能力总览测试中断言“参考来源与实现关系”、参考网页、官方源码、MIT、独立中文实现和“尚未全部完成”；在工具说明测试中断言两个来源链接和“本项目实现”。两个链接都必须有 `target="_blank"` 与 `rel="noopener noreferrer"`。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm.cmd test -- tests/capability-status-page.test.tsx tests/tool-explanation-panel.test.tsx`

Expected: FAIL，提示来源标题或链接不存在。

- [ ] **Step 3: 实现集中数据与页面区块**

创建 `PROJECT_PROVENANCE`，在能力总览导语后渲染完整来源区；在 `ToolExplanationPanel` 底部渲染简短来源行。文案必须与设计文件一致。

- [ ] **Step 4: 增加最小响应式样式**

复用现有 `var(--line)`、`var(--surface)`、`var(--text-muted)` 和圆角；390px 下链接可换行且容器不溢出。

- [ ] **Step 5: 运行自动化验证**

Run: `npm.cmd test -- tests/capability-status-page.test.tsx tests/tool-explanation-panel.test.tsx`

Expected: PASS。

Run: `npm.cmd run build`

Expected: PASS。

Run: `git diff --check`

Expected: PASS。

- [ ] **Step 6: 浏览器展示并停止在未提交状态**

在 `http://127.0.0.1:4174/capabilities` 和一个代表工具页检查桌面、390px、外部链接、无横向溢出和控制台错误。输出预览地址与 `git status`；不得执行 `git add` 或 `git commit`。
