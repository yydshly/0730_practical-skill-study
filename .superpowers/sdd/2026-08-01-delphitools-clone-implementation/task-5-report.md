# Task 5 实施报告：文字、排版、字体和文档工具

## 状态

`DONE_WITH_CONCERNS`

简报要求的 11 个入口已接入 `TextWorkspace`，focused/full tests 与生产构建均通过。格式能力按简报诚实收口：可见转换仅包含能生成真实内容的 Markdown、HTML、纯文本和完整 LaTeX 文档；Word、EPUB 未实现且不显示为可选项。

## 实现范围

- 接入：`doc-converter`、`text-editor`、`font-explorer`、`glyph-browser`、`large-type`、`line-height-calc`、`paper-sizes`、`px-to-rem`、`text-diff`、`typo-calc`、`word-counter`。
- 复用：现有 `App` / `ToolPage`、`ToolLayout`、`ResultPanel`、`FileDropzone`、`StatusMessage`、剪贴板和下载核心函数。
- 文档：Markdown ↔ HTML、Markdown/HTML → 纯文本、Markdown/纯文本 → 完整 LaTeX 文档；Markdown 原始 HTML 先转义，危险链接协议降级为 `#`，预览不执行原始脚本。
- 字体：仅处理用户在 `FileDropzone` 中选择的第一个 TTF/OTF 文件；浏览器安全解析 SFNT 的 `head`、`maxp`、`name` 表，展示家族、样式、units-per-em、字形数及可用名称。
- Unicode：按区段或码点搜索，每次最多渲染 120 个字符（引擎硬上限 200），支持复制字符与中文反馈。
- 响应式：大字预览在 390px 宽度下使用受限 `clamp()` 字号；现有全局 `prefers-reduced-motion` 规则禁用过渡和动画。

## 严格 TDD：RED / GREEN

### 核心引擎与数据

- RED：`npm.cmd test -- tests/text.test.ts`
  - 结果：1 个测试文件失败，14/14 测试失败。
  - 原因：`text.ts`、`document.ts`、`paperSizes.ts`、`unicodeBlocks.ts` 尚不存在，和预期缺失能力一致。
- GREEN：`npm.cmd test -- tests/text.test.ts`
  - 首轮：13/14 通过；唯一失败来自测试错误地要求只有 95 个可显示字符的 Basic Latin 区段返回 200 项。
  - 修正：改用 CJK 大区段验证 200 项硬上限，不改变生产代码。
  - 结果：14/14 通过。

### 11 个 UI 与路由

- RED：`npm.cmd test -- tests/text-workspace.test.tsx`
  - 结果：18 项中 17 项失败、1 项通过。
  - 17 项失败均因 11 个文字入口仍显示占位工作区；唯一通过项证明非文字工具仍保留原工作区。
- GREEN：同命令再次运行。
  - 结果：18/18 通过。

### 可见 LaTeX 文件有效性

- RED：`npm.cmd test -- tests/text.test.ts`
  - 结果：13/14 通过；LaTeX 输出缺少 `documentclass` 和 `document` 环境。
- GREEN：将 Markdown/纯文本 LaTeX 输出包成完整 `article` + `ctex` 文档。
  - 最终 focused 结果：32/32 通过。

### 构建兼容修复

- 首次 `npm.cmd run build` 失败：`Array.at()` 不属于项目 `ES2020` lib。
- 根因确认：仓库唯一 `.at()` 位于新增差异合并函数。
- 最小修复：改为 `segments[segments.length - 1]`，行为不变。
- 后续构建通过。

## 最终验证

- Focused：`npm.cmd test -- tests/text.test.ts tests/text-workspace.test.tsx`
  - 2 个测试文件通过，32/32 测试通过。
- Full：`npm.cmd test`
  - 8 个测试文件通过，86/86 测试通过。
- Build：`npm.cmd run build`
  - TypeScript 构建和 Vite 生产构建通过；57 个模块完成转换。
  - 产物：CSS 11.70 kB（gzip 3.18 kB），JS 201.76 kB（gzip 67.41 kB）。
- Diff hygiene：`git diff --check` 通过，无空白错误。

## 依赖

- 未新增运行时或开发依赖。
- `package.json`、锁文件均未修改。
- 字体解析、Markdown/HTML 转换和单位换算均由本地 TypeScript 实现。

## 文件

新增：

- `delphitools-clone/src/engines/text.ts`
- `delphitools-clone/src/engines/document.ts`
- `delphitools-clone/src/tools/TextWorkspace.tsx`
- `delphitools-clone/src/data/paperSizes.ts`
- `delphitools-clone/src/data/unicodeBlocks.ts`
- `delphitools-clone/tests/text.test.ts`
- `delphitools-clone/tests/text-workspace.test.tsx`
- `.superpowers/sdd/2026-08-01-delphitools-clone-implementation/task-5-report.md`

修改：

- `delphitools-clone/src/app/ToolPage.tsx`
- `delphitools-clone/src/components/ToolLayout.tsx`
- `delphitools-clone/src/components/ResultPanel.tsx`
- `delphitools-clone/src/styles/components.css`

## 提交

- 分支：`codex/delphitools-clone`
- 提交消息：`feat: implement chinese text and typography tools`
- 本报告与实现置于同一提交；提交对象无法在不改变自身哈希的情况下内嵌最终 SHA，最终 SHA 记录在交付回复中。
- 仅暂存上述 Task 5 文件；工作树中其他任务的未跟踪文档和图片不纳入提交。

## 自检

- [x] 仅 11 个指定 ID 使用 `TextWorkspace`。
- [x] 11 个模式具有独立中文标签和可用默认值。
- [x] 复用现有布局、结果、文件选择和状态反馈组件。
- [x] Markdown 源文/预览、复制、`.md`/`.html` 真实下载完成。
- [x] 原始 HTML 和危险链接不会在 Markdown 预览中执行。
- [x] 可见文档格式均生成与扩展名/MIME 一致的真实内容。
- [x] 字体仅读取用户选择的单一文件，损坏文件返回中文错误。
- [x] Unicode 渲染有界，支持区段、字符/码点搜索和复制。
- [x] 文本差异同时提供新增/删除视觉标签和文字摘要。
- [x] 大字工具在 390px 可读并服从 reduced-motion。
- [x] focused、full tests 和 build 均有最新成功证据。

## Concerns / 明确边界

- Word 与 EPUB 未实现，UI 明确说明限制且不暴露对应选项。
- LaTeX 使用 `ctex` 支持中文；实际编译环境需安装相应 TeX 宏包。本工具生成的是结构完整的 `.tex` 源文件，不在浏览器中运行 TeX 编译器。
- 字体解析限定标准单字体 TTF/OTF SFNT；不支持 WOFF/WOFF2、可变字体轴详情、TTC 字体集合或损坏表修复。
- Unicode 数据是常用区段目录，不包含完整 Unicode 字符名称数据库；搜索支持区段名称、单字符和 `U+` 码点。
- Markdown 转换覆盖编辑器和文档工具所需的常用标题、段落、列表、强调、代码和链接，不宣称完整 CommonMark/HTML 互转兼容。
- 当前运行环境没有独立代码审查代理工具，无法执行 `requesting-code-review` 的代理调度步骤；已以需求逐项自检、`git diff --check`、focused/full tests 和生产构建作为回退证据。

---

## Fix round 1（4 个 Important findings）

### 状态

`DONE`

本节取代上方“Word 与 EPUB 未实现”的旧边界记录。两个格式现已作为可见选项提供，并生成真实 ZIP 容器与必需内部结构；本轮按要求未处理动态 `aria-label` 和字体 `name` 表内部边界两个 Minor 项。

### 1. 真实 DOCX 与 EPUB

- 新增无压缩 ZIP writer，写入正确 local header、central directory、CRC32 与 EOCD。
- DOCX MIME：`application/vnd.openxmlformats-officedocument.wordprocessingml.document`。
- DOCX 必需部件：`[Content_Types].xml`、`_rels/.rels`、`word/document.xml`。
- EPUB MIME：`application/epub+zip`。
- EPUB 首条为未压缩且内容精确的 `mimetype`；包含 `META-INF/container.xml`、EPUB 3 OPF、导航 XHTML 和正文 XHTML。
- UI 新增 `Word DOCX`、`EPUB 3` 输出选项和中文边界：DOCX 仅基础文字 OOXML，不保留复杂版式；EPUB 为单章节 EPUB 3。

RED：

- `tests/text.test.ts`：新增 2 项失败，分别为 `createDocx is not a function`、`createEpub is not a function`。
- `tests/text-workspace.test.tsx`：新增 UI 测试失败，`docx` 不存在于输出选项。

GREEN：

- 文档引擎 18/18 通过；测试直接解析 ZIP 本地头并核对条目、XML、MIME、EPUB 首项和 EOCD。
- UI 21/21 通过；测试通过共享下载动作捕获 Blob 并核对 DOCX/EPUB MIME。

### 2. 解析式 HTML 消毒

- 移除基于字符串删除的正则清理。
- 使用 `DOMParser` 首次解析，再重建严格允许标签树；脚本、样式、iframe、object、embed、SVG、MathML、template 等整棵丢弃。
- 重建时不复制任意属性；链接仅保留经过协议检查的 `href` 和纯文本 `title`，事件属性不会进入输出。
- 对 `javascript:`、`data:` 等危险 URL 统一降级为 `#`。

RED：`<scr<script>ipt>...` 经旧清理后重新解析得到真实 `<script>`；事件属性和危险 URL 同时暴露。

GREEN：重新解析消毒输出后不存在 `script`、事件属性或 `javascript:` URL。

### 3. 越界数字实体

- 数字实体仅接受 `0..0x10FFFF` 且排除 `0xD800..0xDFFF` 代理区的 Unicode 标量值。
- 越界、代理区或畸形数字实体安全替换为 `�`，工具函数和页面不抛 `RangeError`。

RED：`&#x110000;` 触发 `RangeError: Invalid code point 1114112`。

GREEN：`&#x110000; / &#55296; / 正文` 稳定输出 `� / � / 正文`。

### 4. 通用 MIME 字体上传

- 字体选择器接受 `application/octet-stream`、`binary/octet-stream`。
- 在读取内容前要求文件名扩展名为 `.ttf` 或 `.otf`。
- 读取后继续由 `inspectFont` 校验 TTF/OTF SFNT magic、表目录和必需 `head`/`maxp` 表；扩展名不能绕过内容校验。

RED：合法 `.ttf + application/octet-stream` 被 `FileDropzone` 前置拒绝；非字体扩展只得到通用类型错误。

GREEN：手工构造的合法最小 SFNT 通过并显示 3 个字形；`.bin + application/octet-stream` 在读取前以“请选择 TTF 或 OTF 字体文件”拒绝。

### 最终验证

- Focused：`npm.cmd test -- tests/text.test.ts tests/text-workspace.test.tsx` → 2 files / 39 tests passed。
- Full：`npm.cmd test` → 8 files / 93 tests passed。
- Build：`npm.cmd run build` → TypeScript + Vite 成功，57 modules transformed。
- 构建过程曾发现 ZIP helper 的 `Uint8Array<ArrayBufferLike>` 不满足 `BlobPart`；最小修复为复制到明确 `ArrayBuffer`，随后 build 与 focused/full tests 重新通过。
- 依赖：未新增依赖，`package.json` 与锁文件不变。

### 本轮文件与提交

- 修改：`delphitools-clone/src/engines/document.ts`
- 修改：`delphitools-clone/src/tools/TextWorkspace.tsx`
- 修改：`delphitools-clone/tests/text.test.ts`
- 修改：`delphitools-clone/tests/text-workspace.test.tsx`
- 追加：本报告
- 修复提交消息：`fix: harden text document and font tools`
