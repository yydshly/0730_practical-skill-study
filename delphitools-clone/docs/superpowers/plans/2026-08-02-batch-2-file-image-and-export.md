# 批次 2：文件、图像与导出工作流 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在批次 1 的本地处理基础上，补齐可由浏览器稳定完成的文件批量、图像变换、颜色/调色板、二维码/条码和 PDF 导出能力，并把仍依赖模型或专业编辑器的边界如实保留。

**Architecture:** 先建立统一的本地文件批处理与结果下载层，再把图像算法拆成纯函数和 Canvas 适配层；页面只负责输入、进度、错误和结果展示。二维码、条码和 PDF 复用现有依赖，所有耗时任务都通过可取消的任务状态显示，禁止把长任务塞进同步点击处理器。

**Tech Stack:** React 18、TypeScript、Vite、Canvas/ImageBitmap、File/Blob/URL API、现有 `pdf-lib`、`qrcode`、`bwip-js`；不新增远程服务，不上传文件，不在没有本地模型时伪造 AI 结果。

## Global Constraints

- 所有用户文件只在浏览器本地处理；网络请求测试必须确认没有非本地资源加载。
- 中文界面必须说明算法、输入、输出、隐私和限制；新增按钮必须有中文可访问名称。
- 算法核心先写纯函数测试，再接入 React 页面；失败输入不得覆盖上一次有效结果。
- 批量处理默认最多 100 个文件、单文件最多 50 MiB；超过限制显示中文错误并跳过，不崩溃页面。
- 每次创建的 object URL 必须在结果替换、重置和组件卸载时释放；下载文件名必须过滤路径分隔符和控制字符。
- 不为本批次引入浏览器测试框架；每个批次使用组件测试、纯函数测试和独立浏览器冒烟验收。

---

### Task 1: 本地文件批处理与结果生命周期

**Files:**
- Create: `src/core/batch.ts`
- Create: `src/components/BatchProgress.tsx`
- Modify: `src/components/FileDropzone.tsx`
- Modify: `src/core/download.ts`
- Test: `tests/batch.test.ts`
- Test: `tests/file-components.test.tsx`

**Interfaces:**
- Produces `BatchItem = { id: string; file: File; status: 'queued'|'running'|'success'|'error'; error?: string }`。
- Produces `runBatch<T>(files: readonly File[], worker: (file: File, signal: AbortSignal) => Promise<T>, options?: { concurrency?: number; maxFiles?: number; maxBytes?: number })`，返回按原始顺序排列的成功/失败结果。
- Produces `sanitizeDownloadName(name: string, fallback: string): string` 和 `releaseObjectUrls(urls: Iterable<string>): void`。

- [ ] **Step 1: 写失败测试**：验证 100 个文件上限、50 MiB 单文件上限、原始顺序、并发数不超过 2、单项失败不影响其他项、AbortSignal 会停止排队任务、文件名会移除 `\\` `/` 控制字符、object URL 会逐项释放。
- [ ] **Step 2: 运行 `npm.cmd test -- tests/batch.test.ts tests/file-components.test.tsx`，确认新 API 缺失或行为失败。**
- [ ] **Step 3: 用队列游标和 `Promise.race` 实现并发限制；所有错误转换成中文 `BatchItem.error`，不吞掉取消状态。**
- [ ] **Step 4: 接入进度组件，显示“已完成/总数”、失败数、取消按钮和可访问状态；结果列表提供单项下载和全部下载。**
- [ ] **Step 5: 运行目标测试、构建并提交 `feat: add local batch file pipeline`。**

### Task 2: Canvas 图像基础算法

**Files:**
- Modify: `src/engines/image.ts`
- Create: `src/engines/imageTransform.ts`
- Test: `tests/image.test.ts`
- Test: `tests/image-transform.test.ts`

**Interfaces:**
- Produces `resizeImage(source, { width, height, fit: 'contain'|'cover'|'stretch' }): ImageDataLike`。
- Produces `cropImage(source, { x, y, width, height }): ImageDataLike`、`rotateImage(source, degrees: 0|90|180|270): ImageDataLike`。
- Produces `splitImage(source, rows: number, columns: number): readonly ImageDataLike[]`、`stitchImages(images, direction: 'horizontal'|'vertical', gap: number): ImageDataLike`。
- Produces `drawWatermark(source, mark, options: { opacity: number; position: nine-position; scale: number }): ImageDataLike`。
- 纯函数使用宽高、像素数组和 Canvas 适配器；不得在测试中依赖真实浏览器尺寸。

- [ ] **Step 1: 写 1x1、2x2 固定像素失败测试**：覆盖 contain/cover 尺寸、四种旋转、九宫格切分、拼接尺寸、透明度和越界参数中文错误。
- [ ] **Step 2: 运行 `npm.cmd test -- tests/image-transform.test.ts` 确认失败。**
- [ ] **Step 3: 实现整数尺寸校验、裁剪边界夹取、旋转坐标映射和透明像素合成；对 50 MiB 限制在文件层处理。**
- [ ] **Step 4: 运行图像引擎测试与现有图片测试，确认原有真实 PNG/JPEG/WebP 校验不回退。**
- [ ] **Step 5: 提交 `feat: add local image transform engines`。**

### Task 3A: 图像变换工具页面与批量导出

**Files:**
- Modify: `src/tools/ImageWorkspace.tsx`
- Modify: `src/components/ResultPanel.tsx`
- Modify: `src/styles/components.css`
- Test: `tests/image-workspace.test.tsx`
- Test: `tests/image-workspace-success.test.tsx`

**Scope:** `image-converter`、`social-cropper`、`image-splitter`、`image-stitcher`、`watermarker`。

- [ ] **Step 1: 为每个工具增加一个失败交互测试**：文件选择/粘贴、参数输入、执行、结果预览、错误清理、单项下载和批量下载；断言中文结果而非源码字符串。
- [ ] **Step 2: 运行指定测试确认新增控件或结果缺失。**
- [ ] **Step 3: 接入 Task 1 队列和 Task 2 的 resize/crop/split/stitch/watermark 算法；每个结果显示尺寸和处理状态。**
- [ ] **Step 4: 所有图像结果显示“本地处理”说明，重置时释放 URL，390px 下结果卡片和源码/JSON 区域不得撑开页面。**
- [ ] **Step 5: 运行图片相关测试、构建和浏览器代表操作，提交 `feat: add image transform workflows`。**

### Task 3B: 图像输入、元数据与无障碍分析工具

**Files:**
- Modify: `delphitools-clone/src/tools/ImageWorkspace.tsx`
- Modify: `delphitools-clone/src/components/ResultPanel.tsx`
- Modify: `delphitools-clone/src/styles/components.css`
- Test: `delphitools-clone/tests/image-workspace.test.tsx`
- Test: `delphitools-clone/tests/image-workspace-success.test.tsx`

**Scope:** `paste-image`、`placeholder-genny`、`favicon-genny`、`pixel-picker`、`contrast-checker`。

- [ ] **Step 1: 为五个工具写失败交互测试**：剪贴板读取失败/成功、占位图参数、Favicon 输出、像素拾取 RGBA/HEX、WCAG 普通/大文本对比度和错误清理。
- [ ] **Step 2: 运行 `npm.cmd test -- tests/image-workspace.test.tsx tests/image-workspace-success.test.tsx` 确认新增行为失败。**
- [ ] **Step 3: 接入真实 ImageBitmap/Canvas 结果；Favicon 明确实际输出格式，外部图片 URL 只作为文本；批量/下载使用 Task 1 生命周期。**
- [ ] **Step 4: 结果区域有中文算法和限制说明，390px 不横向溢出；运行图片测试、构建和浏览器代表操作。**
- [ ] **Step 5: 提交 `feat: add image inspection workflows`。**

### Task 4: 调色板、渐变、色盲模拟和 SVG 工具

**Files:**
- Modify: `src/engines/color.ts`
- Modify: `src/engines/advancedImage.ts`
- Modify: `src/tools/ColorWorkspace.tsx`
- Modify: `src/tools/ImageWorkspace.tsx`
- Test: `tests/color.test.ts`
- Test: `tests/color-workspace.test.tsx`
- Test: `tests/image.test.ts`

**Scope:** `palette-extractor`、`palette-genny`、`palette-collection`、`gradient-genny`、`colorblind-sim`、`image-tracer`、`svg-optimiser`、`tailwind-cheatsheet`。

- [ ] **Step 1: 写固定颜色/固定像素失败测试**：量化取样去重和排序、线性渐变插值、Protanopia/Deuteranopia/Tritanopia 矩阵、SVG 空白/注释压缩不破坏 viewBox 和路径、Tailwind 类检索。
- [ ] **Step 2: 运行颜色和图像引擎测试确认失败。**
- [ ] **Step 3: 实现确定性算法；调色板明确“从图片抽样近似”，色盲模拟明确使用矩阵近似，不声称医学诊断。**
- [ ] **Step 4: 页面提供复制 CSS 变量、JSON、SVG 和下载结果；任何外部图片 URL 只当文本，不加载。**
- [ ] **Step 5: 提交 `feat: add local palette and svg workflows`。**

### Task 5: QR、条码与开发导出工具

**Files:**
- Modify: `src/tools/DeveloperWorkspace.tsx`
- Modify: `src/engines/developer.ts`
- Modify: `src/components/ResultPanel.tsx`
- Test: `tests/developer.test.ts`
- Test: `tests/developer-workspace.test.tsx`

**Scope:** `qr-genny`、`code-genny`、`encoder`、`tailwind-cheatsheet` 的可导出部分。

- [ ] **Step 1: 写失败测试**：QR 文本/纠错级别/尺寸输出、条码格式校验、PNG/SVG 下载 MIME、编码器 UTF-8/URL/HTML/JSON、错误输入清理。
- [ ] **Step 2: 运行开发工具测试确认失败。**
- [ ] **Step 3: 复用现有 `qrcode` 和 `bwip-js`，将生成结果转换为 Blob/下载项；禁止把任意字符串当成条码成功。**
- [ ] **Step 4: 页面说明二维码/条码库、输入限制和本地处理；完成后清理 Canvas/URL。**
- [ ] **Step 5: 提交 `feat: add qr barcode and export workflows`。**

### Task 6: PDF 印刷工作流补齐

**Files:**
- Modify: `src/engines/pdf.ts`
- Modify: `src/tools/PdfWorkspace.tsx`
- Modify: `src/workers/pdf.worker.ts`
- Test: `tests/pdf.test.ts`
- Test: `tests/pdf-workspace.test.tsx`

**Scope:** `pdf-preflight`、`imposer`、`zine-imposer`、`doc-converter` 的浏览器可验证部分。

- [ ] **Step 1: 写失败测试**：PDF 页数/尺寸/旋转读取、出血和安全区计算、N-up 2/4/8 页、双面长短边、zine 页序、空白页插入、损坏 PDF 中文错误。
- [ ] **Step 2: 运行 PDF 定向测试确认失败。**
- [ ] **Step 3: 使用 `pdf-lib` 复制页面和变换矩阵；所有 PDF 输出以页尺寸、页数和内容流语义验证，不比较包含随机元数据的整文件字节。**
- [ ] **Step 4: 把重任务放入现有 worker 协议，显示进度和取消状态；不能解析的 PDF 明确说明不支持原因。**
- [ ] **Step 5: 浏览器验证导入、预览、下载和无远程请求，提交 `feat: complete local pdf print workflows`。**

### Task 7: 编辑器与模型依赖能力边界

**Files:**
- Modify: `src/engines/editor.ts`
- Modify: `src/tools/EditorWorkspace.tsx`
- Modify: `src/workers/backgroundRemoval.worker.ts`
- Modify: `src/engines/advancedImage.ts`
- Test: `tests/editor.test.ts`
- Test: `tests/editor-workspace.test.tsx`
- Test: `tests/image.test.ts`

**Scope:** `editor`、`artwork-enhancer`、`background-remover`、`image-tracer` 的可验证子集；`algebra-calc`、`graph-calc`、`shavian-transliterator` 单独保持下一批。

- [ ] **Step 1: 先写能力边界测试**：图层增删/排序/可见性/不透明度/撤销重做、导出尺寸；模型 worker 缺少模型资源时返回中文“未加载模型”，不能返回伪造结果。
- [ ] **Step 2: 运行失败测试并确认当前缺口。**
- [ ] **Step 3: 实现确定性图层编辑；模型能力只在本地模型资源和内存预算明确满足时接入，否则保留 unavailable 状态与原因。**
- [ ] **Step 4: 运行编辑器/图像测试、浏览器检查撤销重做和导出，提交 `feat: expand editor capability boundaries`。**

### Task 8: 状态同步、全量验收与下一批决策

**Files:**
- Modify: `src/data/toolExplanations.ts`
- Modify: `tests/tool-explanations.test.ts`
- Modify: `tests/capability-status-page.test.tsx`
- Modify: `docs/FEATURES.md`
- Modify: `docs/HANDOFF.md`

- [ ] **Step 1: 根据 Tasks 1–7 的实际测试结果更新状态，不提前把模型依赖工具标成完整。**
- [ ] **Step 2: 运行 `npm.cmd test`、`npm.cmd run build`、`git diff --check`。**
- [ ] **Step 3: 浏览器验收代表页面、390px 溢出、11 页控制台和网络请求；记录所有不能完成的真实原因。**
- [ ] **Step 4: 以 56 个唯一 ID 重新计算状态统计，更新中文原理/输入输出/隐私/限制。**
- [ ] **Step 5: 提交 `docs: sync batch 2 capability status`，并在交付文档列出批次 3 的数学/字体/专业模型边界。**

## 计划自审结果

- 能力覆盖：文件批处理、图像变换、颜色/SVG、二维码/条码、PDF 印刷和编辑器边界各有独立任务；未把所有高风险能力塞入一个任务。
- 代码边界：纯算法放在 `src/engines`，异步和模型隔离在 `src/workers`，页面只处理状态和展示，下载与 URL 生命周期集中在 `src/core`/组件。
- 安全边界：所有输入有数量/大小/格式限制；远程 URL 不会被自动加载；模型缺失不返回伪造结果。
- 测试策略：每项先写失败测试；PDF 避免非确定性整文件比较；浏览器布局用独立冒烟证据补充组件测试。
- 明确未承诺：没有本地模型时不承诺自动抠图/增强；专业 DOCX/PDF 互转、完整图形编辑器和复杂代数/绘图功能继续单独评估，不用占位功能冒充完成。
