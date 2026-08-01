# Delphitools 中文工具箱 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `delphitools-clone` 中建立一个中文化、无需登录、主要在浏览器本地处理数据的多功能工具箱，覆盖设计规格列出的全部工具入口和主要能力。

**Architecture:** React 应用壳通过统一 `ToolDefinition` 注册表加载工具页面。颜色、文本、开发、计算、图片、PDF 和画布编辑分别使用独立纯函数引擎与通用工作台，耗时任务放入 Web Worker；所有主要文案由中文注册表提供。

**Tech Stack:** Vite、React、TypeScript、React Router、Vitest、Testing Library、Playwright/browser evidence、Canvas API、Web Worker、pdf-lib、pdfjs-dist、culori、diff、marked、turndown、qrcode、bwip-js、mathjs、nerdamer、function-plot、opentype.js、SVGO、ImageTracer、浏览器端背景移除模型。

## Global Constraints

- 项目路径固定为 `F:/0730_vscode_claude_project/delphitools-clone`。
- 所有主要用户文案使用简体中文；标准文件格式和技术缩写保留原写法。
- 不实现登录、云端项目、业务数据库或项目自有文件上传后端。
- 工具入口必须产生实际结果，不能只显示占位卡片。
- 图片、文本和 PDF 输入默认只在浏览器本地处理。
- 桌面、平板、手机目标宽度分别为 1440px、900px、390px。
- 同时支持浅色和深色主题、可见焦点和 reduced-motion。
- 每个新增处理函数先有失败测试，再写最小实现。

---

## 文件结构

```text
delphitools-clone/
├─ src/
│  ├─ app/{App,HomePage,ToolPage,NotFoundPage}.tsx
│  ├─ components/{AppShell,Sidebar,ToolCard,ToolLayout,FileDropzone,ResultPanel}.tsx
│  ├─ core/{files,clipboard,download,theme,types}.ts
│  ├─ data/{categories,tools,palettes,paperSizes,tailwindClasses,unicodeBlocks}.ts
│  ├─ engines/{color,text,developer,calculator,image,pdf,document,editor}.ts
│  ├─ tools/{ColorWorkspace,TextWorkspace,DeveloperWorkspace,CalculatorWorkspace,ImageWorkspace,PdfWorkspace,EditorWorkspace}.tsx
│  ├─ workers/{backgroundRemoval,imageTrace,pdf}.worker.ts
│  ├─ styles/{tokens,global,components}.css
│  └─ test/setup.ts
├─ tests/{registry,color,text,developer,calculator,image,pdf,app}.test.ts(x)
├─ docs/{FEATURES,VALIDATION,HANDOFF}.md
└─ package.json
```

## Task 1: 工程基础、测试环境和工具注册接口

**Files:**
- Create: `delphitools-clone/package.json`
- Create: `delphitools-clone/vite.config.ts`
- Create: `delphitools-clone/tsconfig.json`
- Create: `delphitools-clone/index.html`
- Create: `delphitools-clone/src/core/types.ts`
- Create: `delphitools-clone/src/data/categories.ts`
- Create: `delphitools-clone/src/data/tools.ts`
- Create: `delphitools-clone/tests/registry.test.ts`

**Interfaces:**
- Produces: `ToolCategory`, `ToolId`, `ToolDefinition`, `TOOL_CATEGORIES`, `TOOLS`, `getToolById(id)` and `searchTools(query)`.
- Every later workspace consumes `ToolDefinition.mode` to choose the matching engine behavior.

- [ ] **Step 1: 写注册表失败测试**

```ts
it('每个工具 ID 唯一且中文标题完整', () => {
  expect(new Set(TOOLS.map((tool) => tool.id)).size).toBe(TOOLS.length);
  expect(TOOLS.every((tool) => /[\u4e00-\u9fff]/.test(tool.title))).toBe(true);
  expect(TOOLS.length).toBeGreaterThanOrEqual(56);
});

it('中文搜索能找到图片格式转换', () => {
  expect(searchTools('格式转换').map((tool) => tool.id)).toContain('image-converter');
});
```

- [ ] **Step 2: 运行测试并确认因注册表不存在而失败**

Run: `npm test -- tests/registry.test.ts`
Expected: FAIL，提示无法导入 `src/data/tools`。

- [ ] **Step 3: 建立项目配置、类型和完整中文工具注册表**

`ToolDefinition` 必须包含 `id`、`category`、`title`、`englishTitle`、`description`、`keywords`、`workspace` 和 `mode`。注册表逐项列出设计规格中的全部工具。

- [ ] **Step 4: 运行注册表测试**

Run: `npm test -- tests/registry.test.ts`
Expected: PASS，全部工具 ID 唯一且中文搜索有效。

- [ ] **Step 5: 提交工程基础**

```bash
git add delphitools-clone/package.json delphitools-clone/vite.config.ts delphitools-clone/tsconfig.json delphitools-clone/index.html delphitools-clone/src/core/types.ts delphitools-clone/src/data delphitools-clone/tests/registry.test.ts
git commit -m "feat: scaffold chinese delphitools registry"
```

## Task 2: 应用壳、首页、搜索、导航和主题

**Files:**
- Create: `delphitools-clone/src/main.tsx`
- Create: `delphitools-clone/src/app/App.tsx`
- Create: `delphitools-clone/src/app/HomePage.tsx`
- Create: `delphitools-clone/src/app/ToolPage.tsx`
- Create: `delphitools-clone/src/app/NotFoundPage.tsx`
- Create: `delphitools-clone/src/components/AppShell.tsx`
- Create: `delphitools-clone/src/components/Sidebar.tsx`
- Create: `delphitools-clone/src/components/ToolCard.tsx`
- Create: `delphitools-clone/src/components/ToolLayout.tsx`
- Create: `delphitools-clone/src/core/theme.ts`
- Create: `delphitools-clone/src/styles/tokens.css`
- Create: `delphitools-clone/src/styles/global.css`
- Create: `delphitools-clone/src/styles/components.css`
- Create: `delphitools-clone/tests/app.test.tsx`

**Interfaces:**
- Consumes: `TOOLS`, `TOOL_CATEGORIES`, `searchTools`.
- Produces: responsive application shell, route `/tools/:toolId`, persisted `light | dark` theme and semantic layout components.

- [ ] **Step 1: 写首页和主题失败测试**

```tsx
it('首页可以通过中文关键词过滤工具', async () => {
  render(<App />);
  await userEvent.type(screen.getByRole('searchbox'), '二维码');
  expect(screen.getByRole('link', { name: /二维码生成器/ })).toBeVisible();
  expect(screen.queryByRole('link', { name: /科学计算器/ })).toBeNull();
});

it('主题按钮会切换根元素主题', async () => {
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: '切换到深色主题' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
});
```

- [ ] **Step 2: 运行并确认因应用组件不存在而失败**

Run: `npm test -- tests/app.test.tsx`
Expected: FAIL，提示无法导入 `App`。

- [ ] **Step 3: 实现应用壳、工具卡片、搜索、路由和主题**

桌面显示固定侧栏；900px 以下使用可开关抽屉。每个工具页必须显示中文标题、用途、隐私说明、工作区和返回入口。

- [ ] **Step 4: 运行测试和生产构建**

Run: `npm test -- tests/app.test.tsx; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm run build`
Expected: PASS 且 Vite 构建退出码为 0。

- [ ] **Step 5: 提交应用壳**

```bash
git add delphitools-clone/src/app delphitools-clone/src/components delphitools-clone/src/core/theme.ts delphitools-clone/src/styles delphitools-clone/src/main.tsx delphitools-clone/tests/app.test.tsx
git commit -m "feat: add chinese tool catalog shell"
```

## Task 3: 公共输入、文件、剪贴板、结果和下载能力

**Files:**
- Create: `delphitools-clone/src/core/files.ts`
- Create: `delphitools-clone/src/core/clipboard.ts`
- Create: `delphitools-clone/src/core/download.ts`
- Create: `delphitools-clone/src/components/FileDropzone.tsx`
- Create: `delphitools-clone/src/components/ResultPanel.tsx`
- Create: `delphitools-clone/src/components/StatusMessage.tsx`
- Create: `delphitools-clone/tests/files.test.ts`

**Interfaces:**
- Produces: `readFileAsDataUrl(file)`, `readFileAsText(file)`, `loadImage(file)`, `downloadBlob(blob, name)`, `copyText(text)` and reusable input/result components.

- [ ] **Step 1: 写文件验证失败测试**

```ts
it('图片上传拒绝非图片文件并返回中文错误', () => {
  const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
  expect(() => assertAcceptedFile(file, ['image/*'])).toThrow('请选择图片文件');
});
```

- [ ] **Step 2: 运行并确认失败原因是函数不存在**

Run: `npm test -- tests/files.test.ts`
Expected: FAIL，提示 `assertAcceptedFile` 未定义。

- [ ] **Step 3: 实现公共文件管线和状态组件**

拖拽区同时支持点击选择；结果面板提供复制、下载、重置和中文错误反馈。Object URL 必须在替换或卸载时释放。

- [ ] **Step 4: 运行公共能力测试**

Run: `npm test -- tests/files.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交公共能力**

```bash
git add delphitools-clone/src/core delphitools-clone/src/components/FileDropzone.tsx delphitools-clone/src/components/ResultPanel.tsx delphitools-clone/src/components/StatusMessage.tsx delphitools-clone/tests/files.test.ts
git commit -m "feat: add local file and result pipeline"
```

## Task 4: 颜色引擎和十个颜色工具

**Files:**
- Create: `delphitools-clone/src/engines/color.ts`
- Create: `delphitools-clone/src/tools/ColorWorkspace.tsx`
- Create: `delphitools-clone/src/data/palettes.ts`
- Create: `delphitools-clone/tests/color.test.ts`

**Interfaces:**
- Produces: `parseColor`, `convertColor`, `contrastRatio`, `wcagGrade`, `generateHarmony`, `generatePalette`, `extractPalette`, `simulateColorVision`, `generateTailwindScale`.
- Covers: `colorblind-sim`, `colour-converter`, `contrast-checker`, `gradient-genny`, `harmony-genny`, `palette-collection`, `palette-extractor`, `palette-genny`, `pixel-picker`, `tailwind-shades`.

- [ ] **Step 1: 写颜色引擎失败测试**

```ts
it('黑白对比度为 21', () => {
  expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2);
});

it('红色转换为 RGB', () => {
  expect(convertColor('#ff0000').rgb).toBe('rgb(255, 0, 0)');
});
```

- [ ] **Step 2: 运行并确认颜色函数缺失导致失败**

Run: `npm test -- tests/color.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现颜色纯函数和通用颜色工作台**

每种 `mode` 显示不同参数与结果；图片取色和调色板提取使用 Canvas 像素数据，结果色块均可复制。

- [ ] **Step 4: 运行颜色测试**

Run: `npm test -- tests/color.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交颜色工具**

```bash
git add delphitools-clone/src/engines/color.ts delphitools-clone/src/tools/ColorWorkspace.tsx delphitools-clone/src/data/palettes.ts delphitools-clone/tests/color.test.ts
git commit -m "feat: implement color design tools"
```

## Task 5: 文字、排版和字体工具

**Files:**
- Create: `delphitools-clone/src/engines/text.ts`
- Create: `delphitools-clone/src/engines/document.ts`
- Create: `delphitools-clone/src/tools/TextWorkspace.tsx`
- Create: `delphitools-clone/src/data/paperSizes.ts`
- Create: `delphitools-clone/src/data/unicodeBlocks.ts`
- Create: `delphitools-clone/tests/text.test.ts`

**Interfaces:**
- Produces: `countText`, `diffText`, `pxToRem`, `remToPx`, `calculateLineHeight`, `convertTypographyUnit`, `markdownToHtml`, `htmlToMarkdown`, `inspectFont`.
- Covers: `doc-converter`, `text-editor`, `font-explorer`, `glyph-browser`, `large-type`, `line-height-calc`, `paper-sizes`, `px-to-rem`, `text-diff`, `typo-calc`, `word-counter`.

- [ ] **Step 1: 写文本和排版失败测试**

```ts
it('统计中文、英文和段落', () => {
  expect(countText('你好 world\n\n第二段')).toMatchObject({ characters: 12, words: 3, paragraphs: 2 });
});

it('16px 在 16px 根字号下等于 1rem', () => {
  expect(pxToRem(16, 16)).toBe(1);
});
```

- [ ] **Step 2: 运行并确认函数不存在导致失败**

Run: `npm test -- tests/text.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现文本引擎、文档转换和字体检查工作台**

Markdown/HTML 双向转换必须可复制和下载；Word、LaTeX、EPUB 使用浏览器端导入/导出库并明确复杂版式限制。字体浏览器读取用户选择的字体文件，不读取系统字体目录。

- [ ] **Step 4: 运行文字工具测试**

Run: `npm test -- tests/text.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交文字工具**

```bash
git add delphitools-clone/src/engines/text.ts delphitools-clone/src/engines/document.ts delphitools-clone/src/tools/TextWorkspace.tsx delphitools-clone/src/data/paperSizes.ts delphitools-clone/src/data/unicodeBlocks.ts delphitools-clone/tests/text.test.ts
git commit -m "feat: implement chinese text and typography tools"
```

## Task 6: 开发、编码、二维码和条形码工具

**Files:**
- Create: `delphitools-clone/src/engines/developer.ts`
- Create: `delphitools-clone/src/tools/DeveloperWorkspace.tsx`
- Create: `delphitools-clone/src/data/tailwindClasses.ts`
- Create: `delphitools-clone/tests/developer.test.ts`

**Interfaces:**
- Produces: `testRegex`, `encodeBase64`, `decodeBase64`, `encodeUrl`, `hashText`, `convertBase`, `generateMetaTags`, `decodeClassicalCipher`, `transliterateShavian`.
- Covers: `code-genny`, `decoder`, `meta-tag-genny`, `qr-genny`, `regex-tester`, `tailwind-cheatsheet`, `markdown-writer`, `base-converter`, `encoder`, `shavian-transliterator`.

- [ ] **Step 1: 写开发工具失败测试**

```ts
it('十六进制 ff 转十进制为 255', () => {
  expect(convertBase('ff', 16, 10)).toBe('255');
});

it('凯撒密码向左移动三位', () => {
  expect(decodeCaesar('KHOOR', 3)).toBe('HELLO');
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `npm test -- tests/developer.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现开发引擎和工作台**

二维码支持颜色、容错级别和中心 Logo；条形码支持设计规格列出的主要格式；哈希使用 Web Crypto；正则错误必须显示中文原因且不导致页面崩溃。

- [ ] **Step 4: 运行开发工具测试**

Run: `npm test -- tests/developer.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交开发工具**

```bash
git add delphitools-clone/src/engines/developer.ts delphitools-clone/src/tools/DeveloperWorkspace.tsx delphitools-clone/src/data/tailwindClasses.ts delphitools-clone/tests/developer.test.ts
git commit -m "feat: implement developer and encoding tools"
```

## Task 7: 数学、函数绘图、时间和单位换算

**Files:**
- Create: `delphitools-clone/src/engines/calculator.ts`
- Create: `delphitools-clone/src/tools/CalculatorWorkspace.tsx`
- Create: `delphitools-clone/tests/calculator.test.ts`

**Interfaces:**
- Produces: `evaluateScientific`, `simplifyAlgebra`, `factorAlgebra`, `solveAlgebra`, `differentiate`, `buildPlotSeries`, `calculateDate`, `convertTimezone`, `convertUnit`.
- Covers: `algebra-calc`, `graph-calc`, `sci-calc`, `time-calc`, `unit-converter`.

- [ ] **Step 1: 写计算引擎失败测试**

```ts
it('1000 米等于 1 千米', () => {
  expect(convertUnit(1000, 'meter', 'kilometer')).toBe(1);
});

it('科学计算器遵守运算优先级', () => {
  expect(evaluateScientific('2 + 3 * 4')).toBe(14);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `npm test -- tests/calculator.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现计算引擎和五个计算工作区**

函数绘图将输入表达式转换为可视曲线；非法表达式、除零和未知单位显示中文错误。时间工具覆盖 Unix 时间戳、日期加减和时区格式化。

- [ ] **Step 4: 运行计算测试**

Run: `npm test -- tests/calculator.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交计算工具**

```bash
git add delphitools-clone/src/engines/calculator.ts delphitools-clone/src/tools/CalculatorWorkspace.tsx delphitools-clone/tests/calculator.test.ts
git commit -m "feat: implement calculator tools"
```

## Task 8: 图片基础处理和社交媒体工具

**Files:**
- Create: `delphitools-clone/src/engines/image.ts`
- Create: `delphitools-clone/src/tools/ImageWorkspace.tsx`
- Create: `delphitools-clone/tests/image.test.ts`

**Interfaces:**
- Produces: `fitMatte`, `socialCropRect`, `splitGrid`, `seamlessSlices`, `stitchLayout`, `transparentBounds`, `watermarkLayout`, `faviconSizes`, `createPlaceholderSvg`, `encodeImageBase64`.
- Covers: `matte-generator`, `scroll-generator`, `social-cropper`, `watermarker`, `artwork-enhancer`, `favicon-genny`, `image-clipper`, `image-converter`, `image-splitter`, `image-stitcher`, `paste-image`, `placeholder-genny`, `base64-image-encoder`.

- [ ] **Step 1: 写图片几何失败测试**

```ts
it('2x2 网格能生成四个不重叠区域', () => {
  expect(splitGrid(1200, 800, 2, 2)).toEqual([
    { x: 0, y: 0, width: 600, height: 400 },
    { x: 600, y: 0, width: 600, height: 400 },
    { x: 0, y: 400, width: 600, height: 400 },
    { x: 600, y: 400, width: 600, height: 400 },
  ]);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `npm test -- tests/image.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现图片几何、Canvas 渲染和通用图片工作台**

所有模式支持上传、参数、预览、重置和下载。转换器完整支持浏览器原生 PNG/JPEG/WebP 输出，并为额外格式接入浏览器编码库；无法保证的格式必须禁用并给出明确中文说明，不能生成伪文件。

- [ ] **Step 4: 运行图片测试**

Run: `npm test -- tests/image.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交图片基础工具**

```bash
git add delphitools-clone/src/engines/image.ts delphitools-clone/src/tools/ImageWorkspace.tsx delphitools-clone/tests/image.test.ts
git commit -m "feat: implement local image tools"
```

## Task 9: SVG、背景移除、PDF 和文档高级能力

**Files:**
- Create: `delphitools-clone/src/engines/pdf.ts`
- Create: `delphitools-clone/src/tools/PdfWorkspace.tsx`
- Create: `delphitools-clone/src/workers/backgroundRemoval.worker.ts`
- Create: `delphitools-clone/src/workers/imageTrace.worker.ts`
- Create: `delphitools-clone/src/workers/pdf.worker.ts`
- Create: `delphitools-clone/tests/pdf.test.ts`

**Interfaces:**
- Produces: `preflightPdf`, `bookletOrder`, `nUpLayout`, `zineEightPageOrder`, `optimiseSvg`, `traceImage`, `removeBackground`.
- Covers: `background-remover`, `image-tracer`, `svg-optimiser`, `pdf-preflight`, `imposer`, `zine-imposer` and advanced document exports from Task 5.

- [ ] **Step 1: 写 PDF 排序失败测试**

```ts
it('八页小册子输出正确的外侧和内侧顺序', () => {
  expect(bookletOrder(8)).toEqual([[8, 1, 2, 7], [6, 3, 4, 5]]);
});

it('八页 mini-zine 使用固定折叠顺序', () => {
  expect(zineEightPageOrder()).toEqual([8, 1, 2, 7, 6, 3, 4, 5]);
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `npm test -- tests/pdf.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 PDF 引擎、Worker 和高级媒体工作区**

PDF 预检读取页数、尺寸、方向和基础元数据；拼版生成新的本地 PDF。背景移除显示模型加载与处理状态。图片追踪和 SVG 优化提供参数与导出，失败后保留原输入并允许重试。

- [ ] **Step 4: 运行高级能力测试和构建**

Run: `npm test -- tests/pdf.test.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm run build`
Expected: PASS 且 Worker 被正确打包。

- [ ] **Step 5: 提交高级能力**

```bash
git add delphitools-clone/src/engines/pdf.ts delphitools-clone/src/tools/PdfWorkspace.tsx delphitools-clone/src/workers delphitools-clone/tests/pdf.test.ts
git commit -m "feat: add pdf and advanced media tools"
```

## Task 10: Substrata 多图画布编辑器

**Files:**
- Create: `delphitools-clone/src/engines/editor.ts`
- Create: `delphitools-clone/src/tools/EditorWorkspace.tsx`
- Create: `delphitools-clone/src/components/editor/CanvasStage.tsx`
- Create: `delphitools-clone/src/components/editor/LayerPanel.tsx`
- Create: `delphitools-clone/src/components/editor/InspectorPanel.tsx`
- Create: `delphitools-clone/tests/editor.test.ts`

**Interfaces:**
- Produces: `EditorDocument`, `EditorLayer`, `editorReducer`, `addImageLayer`, `moveLayer`, `resizeLayer`, `rotateLayer`, `reorderLayer`, `undo`, `redo`, `renderDocument`.
- Covers: `editor` route and all Substrata requirements.

- [ ] **Step 1: 写编辑器状态机失败测试**

```ts
it('移动图层后撤销可以恢复原位置', () => {
  const initial = createDocument([{ id: 'a', x: 10, y: 20, width: 100, height: 80 }]);
  const moved = editorReducer(initial, { type: 'move', id: 'a', x: 40, y: 50 });
  const undone = editorReducer(moved, { type: 'undo' });
  expect(undone.layers[0]).toMatchObject({ x: 10, y: 20 });
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `npm test -- tests/editor.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现画布、图层面板、检查器、撤销重做和导出**

桌面为画布加左右面板；移动端将面板折叠为抽屉。支持图片、文字、矩形、圆形和箭头图层，所有图层可选择、移动、缩放、旋转、排序和删除。

- [ ] **Step 4: 运行编辑器测试和构建**

Run: `npm test -- tests/editor.test.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm run build`
Expected: PASS。

- [ ] **Step 5: 提交编辑器**

```bash
git add delphitools-clone/src/engines/editor.ts delphitools-clone/src/tools/EditorWorkspace.tsx delphitools-clone/src/components/editor delphitools-clone/tests/editor.test.ts
git commit -m "feat: implement substrata canvas editor"
```

## Task 11: 全量功能映射、中文 README 和浏览器验收

**Files:**
- Create: `delphitools-clone/README.md`
- Create: `delphitools-clone/docs/FEATURES.md`
- Create: `delphitools-clone/docs/VALIDATION.md`
- Create: `delphitools-clone/docs/HANDOFF.md`
- Modify: `docs/superpowers/specs/2026-08-01-delphitools-clone-frontend-contract.md`

**Interfaces:**
- Consumes: all registered tools, tests and production build.
- Produces: exact start command, canonical URL, full tool coverage table, browser evidence summary and valid capability limitations.

- [ ] **Step 1: 运行完整自动化检查**

Run: `npm test -- --run; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm run build`
Expected: 0 failures and build exit code 0。

- [ ] **Step 2: 启动唯一的验收服务器**

Run: `npm run dev -- --host 127.0.0.1 --port 4173`
Expected: canonical URL `http://127.0.0.1:4173/`。

- [ ] **Step 3: 浏览器验证主要旅程和覆盖矩阵**

验证 1440px 浅色、1440px 深色、900px 和 390px；完成中文搜索、进入工具、图片转换、调色板提取、文本差异、二维码下载、单位换算、Substrata 两图导出和主题切换。检查空、成功、错误和耗时状态，并验证可见焦点和 reduced-motion。

- [ ] **Step 4: 更新文档和契约状态**

`FEATURES.md` 列出每个工具的实现范围；`VALIDATION.md` 记录命令、URL、时间、宽度、主题、状态和证据；契约覆盖清单把已验证行改为 `pass`，无法在当前环境验证的非阻塞能力记录尝试方式、缺失能力和重测触发条件。

- [ ] **Step 5: 最终复验并提交**

Run: `npm test -- --run; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm run build`
Expected: 0 failures and build exit code 0。

```bash
git add delphitools-clone docs/superpowers/specs/2026-08-01-delphitools-clone-frontend-contract.md docs/superpowers/plans/2026-08-01-delphitools-clone-implementation.md
git commit -m "feat: deliver chinese delphitools suite"
```

## 功能覆盖映射

| 任务 | 工具入口 |
| --- | --- |
| Task 4 | 色盲模拟、颜色转换、对比度、渐变、配色和谐、调色板收藏、调色板提取、调色板生成、像素取色、Tailwind 色阶 |
| Task 5 | 文档转换、Markdown 编辑、字体浏览、Unicode 字符、大字展示、行高、纸张尺寸、PX/REM、文本差异、排版单位、字数统计 |
| Task 6 | 条形码、古典密码、Meta 标签、二维码、正则、Tailwind 速查、文本处理、进制、编码与哈希、Shavian 转写 |
| Task 7 | 代数、函数绘图、科学计算、时间、单位换算 |
| Task 8 | 方形衬底、无缝轮播、社交裁剪、水印、艺术品增强、Favicon、透明边缘、图片转换、图片分割、图片拼接、剪贴板图片、占位图、图片 Base64 |
| Task 9 | 背景移除、图片转 SVG、SVG 优化、PDF 预检、PDF 拼版、Zine 拼版 |
| Task 10 | Substrata 多图编辑器 |

## 计划自检结论

- 设计规格中的每个工具都映射到 Task 4-10。
- 公共中文界面、主题、响应式、状态、测试和浏览器验收分别由 Task 1-3 与 Task 11 覆盖。
- 各任务接口名称在后续任务中保持一致；没有未定义的跨任务接口引用。
- 不允许空壳工具页面；高级格式如果浏览器能力不足，必须诚实禁用并提供中文边界说明，不能伪造结果文件。
