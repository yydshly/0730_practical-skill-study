# delphitools GitHub Pages Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `delphitools-clone` 生成可由仓库现有 GitHub Pages 直接托管的静态展示，并在外层 README 提供中文说明和展示链接。

**Architecture:** Vite 使用相对资源路径构建到 `site/`；导航模块在生产环境生成哈希链接，在开发环境保留 pathname 路由。README 只承担项目索引、来源边界和展示入口。

**Tech Stack:** React 18、TypeScript、Vite、Vitest、GitHub Pages。

## Global Constraints

- 不改变仓库现有 GitHub Pages 来源设置。
- 不改变本地开发路由形式。
- 不提交其他项目的未跟踪文件。
- 线上入口必须支持刷新和直接打开。

---

### Task 1: 静态部署导航

**Files:**
- Create: `delphitools-clone/src/core/navigation.ts`
- Modify: `delphitools-clone/src/app/App.tsx`
- Modify: `delphitools-clone/src/components/Sidebar.tsx`
- Modify: `delphitools-clone/src/components/ToolCard.tsx`
- Modify: `delphitools-clone/src/app/CapabilityStatusPage.tsx`
- Test: `delphitools-clone/tests/navigation.test.ts`

- [x] 测试 pathname、hash 解析与生产/开发链接生成。
- [x] 接入统一导航函数并监听 `hashchange`。
- [x] 运行导航测试和完整测试。

### Task 2: 构建展示目录

**Files:**
- Modify: `delphitools-clone/vite.config.ts`
- Modify: `delphitools-clone/.gitignore`
- Create: `delphitools-clone/site/**`

- [x] 将生产构建配置为 `base: './'` 和 `outDir: 'site'`。
- [x] 运行生产构建并检查相对资源路径。
- [x] 确认生成文件可由静态服务器访问。

### Task 3: 外层 README 与发布

**Files:**
- Modify: `README.md`

- [x] 增加在线访问表格入口和项目索引。
- [x] 说明 56 个工具、中文实现、完成度边界、参考网页和官方源码。
- [ ] 核对提交范围，提交并推送 `master`。
