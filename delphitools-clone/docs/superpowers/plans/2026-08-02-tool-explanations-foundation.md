# DelphiTools 逐工具说明基础设施实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为全部 56 个工具增加真实、统一、可测试的中文能力说明，并提供全站差异总览，为后续能力补齐批次建立事实来源。

**Architecture:** 详细说明从现有 `ToolDefinition` 中分离，集中存放在只含数据的说明注册表中；工具页面通过统一组件读取说明，能力总览页复用同一注册表生成状态和未实现清单。现有工作区和算法在本计划中保持不变，只校准过度承诺的简短描述。

**Tech Stack:** React 18、TypeScript 5.6、Vite 7、Vitest 4、Testing Library、现有 CSS 变量系统。

## Global Constraints

- 文件和输入默认只在浏览器中处理，不上传服务器。
- 允许增加浏览器端依赖、WASM、本地模型和合法可分发的数据集，但本计划不新增运行时依赖。
- 不默认引入远程服务；不得静默上传任何数据。
- 中文优先；格式名、标准名和算法名可以保留英文原名。
- 功能说明必须与当前真实实现一致，未实现能力不得无条件宣传。
- `partial` 和 `unavailable` 必须列出具体限制；`unavailable` 必须说明原因或后续条件。
- 保留工作区中与本任务无关的用户文件和未跟踪文件；每次只暂存本任务列出的路径。

---

## 文件结构

- `src/core/types.ts`：增加说明状态和说明数据类型。
- `src/data/toolExplanations.ts`：唯一的 56 项详细说明注册表、状态元数据、按 ID 查询和未完整实现筛选函数。
- `src/components/ToolExplanationPanel.tsx`：工具页统一说明组件。
- `src/app/CapabilityStatusPage.tsx`：按状态和类别展示 56 项能力总览。
- `src/components/ToolLayout.tsx`：在工作区之后挂载说明组件。
- `src/app/App.tsx`：注册 `/capabilities` 路由。
- `src/components/Sidebar.tsx`：增加“能力与实现说明”入口。
- `src/data/tools.ts`：校准与当前实现不一致的简短宣传。
- `src/styles/components.css`：说明面板、状态标签和总览页的响应式样式。
- `tests/tool-explanations.test.ts`：注册表完整性、状态分配和帮助函数测试。
- `tests/tool-explanation-panel.test.tsx`：说明面板语义和展开行为测试。
- `tests/capability-status-page.test.tsx`：总览路由、统计和未实现原因测试。

---

### Task 1: 建立说明类型、状态标签和查询接口

**Files:**
- Modify: `src/core/types.ts`
- Create: `src/data/toolExplanations.ts`
- Create: `tests/tool-explanations.test.ts`

**Interfaces:**
- Consumes: 现有 `ToolId`、`ToolDefinition` 和 `TOOLS`。
- Produces: `ToolCapabilityStatus`、`ToolExplanation`、`TOOL_CAPABILITY_STATUS_META`、`getToolCapabilityStatusLabel(status)`。

- [ ] **Step 1: 写状态标签失败测试**

在 `tests/tool-explanations.test.ts` 写入：

```ts
import { describe, expect, it } from 'vitest';

import {
  getToolCapabilityStatusLabel,
  TOOL_CAPABILITY_STATUS_META,
} from '../src/data/toolExplanations';

describe('工具能力说明状态', () => {
  it('为四种状态提供固定中文标签', () => {
    expect(Object.keys(TOOL_CAPABILITY_STATUS_META).sort()).toEqual([
      'complete', 'core-complete', 'partial', 'unavailable',
    ]);
    expect(getToolCapabilityStatusLabel('complete')).toBe('完整实现');
    expect(getToolCapabilityStatusLabel('core-complete')).toBe('主要能力完整');
    expect(getToolCapabilityStatusLabel('partial')).toBe('部分实现');
    expect(getToolCapabilityStatusLabel('unavailable')).toBe('当前无法完整实现');
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- tests/tool-explanations.test.ts`

Expected: FAIL，提示找不到 `../src/data/toolExplanations` 或缺少导出。

- [ ] **Step 3: 增加精确类型**

在 `src/core/types.ts` 追加：

```ts
export type ToolCapabilityStatus =
  | 'complete'
  | 'core-complete'
  | 'partial'
  | 'unavailable';

export type ToolExplanation = {
  toolId: ToolId;
  status: ToolCapabilityStatus;
  summary: string;
  capabilities: readonly string[];
  inputs: readonly string[];
  outputs: readonly string[];
  principle: readonly string[];
  workflow: readonly string[];
  privacy: string;
  limitations: readonly string[];
  unavailableReasons?: readonly string[];
  futureRequirements?: readonly string[];
};
```

- [ ] **Step 4: 创建状态元数据和标签函数**

在 `src/data/toolExplanations.ts` 创建：

```ts
import type { ToolCapabilityStatus } from '../core/types';

export const TOOL_CAPABILITY_STATUS_META: Readonly<Record<
  ToolCapabilityStatus,
  { label: string; description: string }
>> = {
  complete: { label: '完整实现', description: '核心能力、主要格式和主要流程均已对齐。' },
  'core-complete': { label: '主要能力完整', description: '核心任务可靠，仅缺次要快捷操作或展示细节。' },
  partial: { label: '部分实现', description: '主要任务可完成，但仍缺重要格式、模式、交互或数据范围。' },
  unavailable: { label: '当前无法完整实现', description: '核心算法、数据或主要模式尚未达到可靠实现标准。' },
};

export function getToolCapabilityStatusLabel(status: ToolCapabilityStatus): string {
  return TOOL_CAPABILITY_STATUS_META[status].label;
}
```

- [ ] **Step 5: 运行测试和类型构建**

Run: `npm test -- tests/tool-explanations.test.ts`

Expected: PASS，1 个测试通过。

Run: `npm run build`

Expected: PASS，无 TypeScript 错误。

- [ ] **Step 6: 提交基础类型**

```bash
git add src/core/types.ts src/data/toolExplanations.ts tests/tool-explanations.test.ts
git commit -m "feat: add tool explanation status model"
```

---

### Task 2: 填充全部 56 项说明注册表并验证状态分配

**Files:**
- Modify: `src/data/toolExplanations.ts`
- Modify: `tests/tool-explanations.test.ts`
- Reference: `docs/audit-2026-08-02/FUNCTION-PARITY-AUDIT.md`
- Reference: `src/engines/*.ts`
- Reference: `src/tools/*Workspace.tsx`

**Interfaces:**
- Consumes: Task 1 的 `ToolExplanation` 和 `ToolCapabilityStatus`。
- Produces: `TOOL_EXPLANATIONS`、`TOOL_EXPLANATION_BY_ID`、`getToolExplanation(toolId)`、`getIncompleteToolExplanations()`。

状态必须严格按下列集合分配，不得自行美化：

```ts
const CORE_COMPLETE_IDS = [
  'image-clipper', 'base64-image-encoder', 'line-height-calc',
  'px-to-rem', 'word-counter', 'regex-tester', 'encoder',
  'time-calc', 'unit-converter',
] as const;

const UNAVAILABLE_IDS = [
  'artwork-enhancer', 'background-remover', 'image-converter', 'editor',
  'colorblind-sim', 'colour-converter', 'gradient-genny', 'harmony-genny',
  'palette-collection', 'palette-genny', 'paper-sizes', 'pdf-preflight',
  'zine-imposer', 'code-genny', 'decoder', 'qr-genny',
  'tailwind-cheatsheet', 'algebra-calc', 'sci-calc',
  'shavian-transliterator',
] as const;
```

其余 27 项全部为 `partial`，当前没有 `complete` 项。原则说明必须引用真实实现方式：

- 图片类分别依据 `fitMatte`、`seamlessSlices`、`socialCropRect`、`watermarkLayout`、Canvas 像素处理、`removeBackground`、`faviconSizes`、`transparentBounds`、Canvas `toBlob`、`splitGrid`、`stitchLayout`、`traceImage`、Clipboard API、`createPlaceholderSvg`、`optimiseSvg`、`encodeImageBase64`/`decodeImageBase64`。
- 编辑器依据 `editorReducer`、DOM 图层命中区域和 `renderDocument` Canvas 导出。
- 颜色类依据 `simulateColorVision`、`convertColor`、`contrastRatio`/`wcagGrade`、`generateGradientCss`、`generateHarmony`、内置调色板数据、`extractPalette`、`generatePalette`、`samplePixel`、`generateTailwindScale`。
- 文字类依据 `markdownToHtml`/`htmlToMarkdown`/文档打包、`inspectFont`、Unicode 区段数据、CSS 大字预览、`calculateLineHeight`、纸张数据表、`pxToRem`/`remToPx`、`diffText`、`convertTypographyUnit`、`countText`。
- PDF 类依据 `preflightPdf`、`imposePdf`、`createZinePdf` 和 `pdf-lib`。
- 开发类依据 `generateBarcodeSvg`、凯撒/Atbash/ROT13 排名函数、`generateMetaTags`、`generateQrSvg`、隔离 Worker 中的 `testRegex`、Tailwind 静态数据、文本清理函数。
- 计算类依据 `convertBase`、Base64/URL/Web Crypto、`buildPlotSeriesWithDiagnostics`、`evaluateScientific`、日期与时区函数、单位定义表。
- Shavian 必须写明当前是 `transliterateShavian` 的规则替换，不是发音词典。

每个条目都必须写满 `summary`、`capabilities`、`inputs`、`outputs`、`principle`、`workflow`、`privacy` 和 `limitations`。`summary` 使用当前真实能力，不复制原站目标能力；`limitations` 的事实依据为审计报告对应行。`unavailable` 条目还必须填写 `unavailableReasons` 或 `futureRequirements`。

- [ ] **Step 1: 扩展注册表失败测试**

在现有测试文件追加：

```ts
import { TOOLS } from '../src/data/tools';
import {
  getIncompleteToolExplanations,
  getToolExplanation,
  TOOL_EXPLANATIONS,
} from '../src/data/toolExplanations';

it('完整覆盖 56 个工具且没有重复 ID', () => {
  expect(TOOL_EXPLANATIONS).toHaveLength(56);
  expect(new Set(TOOL_EXPLANATIONS.map((item) => item.toolId)).size).toBe(56);
  expect(TOOL_EXPLANATIONS.map((item) => item.toolId).sort())
    .toEqual(TOOLS.map((tool) => tool.id).sort());
});

it('保持审计状态数量和关键工具状态', () => {
  const counts = Object.groupBy(TOOL_EXPLANATIONS, (item) => item.status);
  expect(counts.complete ?? []).toHaveLength(0);
  expect(counts['core-complete'] ?? []).toHaveLength(9);
  expect(counts.partial ?? []).toHaveLength(27);
  expect(counts.unavailable ?? []).toHaveLength(20);
  expect(getToolExplanation('qr-genny').status).toBe('unavailable');
  expect(getToolExplanation('regex-tester').status).toBe('core-complete');
});

it('所有说明字段完整，未完整项给出具体限制', () => {
  for (const item of TOOL_EXPLANATIONS) {
    expect(item.summary.trim(), item.toolId).not.toBe('');
    expect(item.capabilities.length, item.toolId).toBeGreaterThan(0);
    expect(item.inputs.length, item.toolId).toBeGreaterThan(0);
    expect(item.outputs.length, item.toolId).toBeGreaterThan(0);
    expect(item.principle.length, item.toolId).toBeGreaterThan(0);
    expect(item.workflow.length, item.toolId).toBeGreaterThan(0);
    expect(item.privacy.trim(), item.toolId).not.toBe('');
    if (item.status === 'partial' || item.status === 'unavailable') {
      expect(item.limitations.length, item.toolId).toBeGreaterThan(0);
    }
    if (item.status === 'unavailable') {
      expect([
        ...(item.unavailableReasons ?? []),
        ...(item.futureRequirements ?? []),
      ].length, item.toolId).toBeGreaterThan(0);
    }
  }
  expect(getIncompleteToolExplanations()).toHaveLength(47);
});
```

若当前 TypeScript 标准库不提供 `Object.groupBy`，测试中改用 `reduce` 计算相同四类数量，不提高 `tsconfig` 目标版本。

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- tests/tool-explanations.test.ts`

Expected: FAIL，提示注册表导出不存在或条目数不是 56。

- [ ] **Step 3: 实现只读注册表和查询函数**

实现以下签名：

```ts
export const TOOL_EXPLANATIONS: readonly ToolExplanation[];

export const TOOL_EXPLANATION_BY_ID: Readonly<Record<ToolId, ToolExplanation>> =
  Object.freeze(Object.fromEntries(
    TOOL_EXPLANATIONS.map((item) => [item.toolId, item]),
  ) as Record<ToolId, ToolExplanation>);

export function getToolExplanation(toolId: ToolId): ToolExplanation {
  return TOOL_EXPLANATION_BY_ID[toolId];
}

export function getIncompleteToolExplanations(): readonly ToolExplanation[] {
  return TOOL_EXPLANATIONS.filter((item) => item.status === 'partial' || item.status === 'unavailable');
}
```

不要以循环批量生成空泛说明；56 个条目必须显式可审阅。允许抽取完全相同的本地隐私句子常量，但算法、输入、输出和限制必须逐工具书写。

- [ ] **Step 4: 运行注册表测试**

Run: `npm test -- tests/tool-explanations.test.ts`

Expected: PASS，4 个测试通过；状态数量为 0/9/27/20，不完整项为 47。

- [ ] **Step 5: 运行注册表和现有工具测试**

Run: `npm test -- tests/tool-explanations.test.ts tests/registry.test.ts`

Expected: PASS，原有 56 项路由注册表未回归。

- [ ] **Step 6: 提交说明数据**

```bash
git add src/data/toolExplanations.ts tests/tool-explanations.test.ts
git commit -m "feat: document all tool capabilities"
```

---

### Task 3: 在每个工具页面显示统一中文说明

**Files:**
- Create: `src/components/ToolExplanationPanel.tsx`
- Modify: `src/components/ToolLayout.tsx`
- Modify: `src/styles/components.css`
- Create: `tests/tool-explanation-panel.test.tsx`

**Interfaces:**
- Consumes: `getToolExplanation(tool.id)`、`getToolCapabilityStatusLabel(status)`。
- Produces: `ToolExplanationPanel({ toolId }: { toolId: ToolId })`。

- [ ] **Step 1: 写面板失败测试**

```tsx
/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { ToolExplanationPanel } from '../src/components/ToolExplanationPanel';

afterEach(cleanup);

describe('工具能力与原理说明', () => {
  it('先显示状态、摘要和算法原理，并能展开限制', async () => {
    const user = userEvent.setup();
    render(<ToolExplanationPanel toolId="qr-genny" />);

    expect(screen.getByRole('heading', { name: '能力与实现说明' })).toBeVisible();
    expect(screen.getByText('当前无法完整实现')).toBeVisible();
    expect(screen.getByRole('heading', { name: '算法与实现原理' })).toBeVisible();

    const limitations = screen.getByText('当前限制与差异').closest('details');
    expect(limitations).not.toHaveAttribute('open');
    await user.click(screen.getByText('当前限制与差异'));
    expect(limitations).toHaveAttribute('open');
    expect(within(limitations!).getByText(/WiFi/)).toBeVisible();
  });
});
```

测试文件需要从 Testing Library 增加 `within` 导入。

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- tests/tool-explanation-panel.test.tsx`

Expected: FAIL，提示找不到 `ToolExplanationPanel`。

- [ ] **Step 3: 实现语义化面板**

组件结构必须使用以下完整信息层级；`explanation` 来自 `getToolExplanation(toolId)`，`hasUnavailableContent` 在渲染前由两个可选数组的长度计算：

```tsx
<section className="tool-explanation" aria-labelledby={`tool-explanation-${toolId}`}>
  <header className="tool-explanation__header">
    <div>
      <p className="tool-explanation__eyebrow">中文能力说明</p>
      <h2 id={`tool-explanation-${toolId}`}>能力与实现说明</h2>
    </div>
    <span className={`tool-status tool-status--${explanation.status}`}>
      {getToolCapabilityStatusLabel(explanation.status)}
    </span>
  </header>
  <p>{explanation.summary}</p>
  <section aria-labelledby={`tool-principle-${toolId}`}>
    <h3 id={`tool-principle-${toolId}`}>算法与实现原理</h3>
    <ul>{explanation.principle.map((item) => <li key={item}>{item}</li>)}</ul>
  </section>
  <details>
    <summary>支持的输入与输出</summary>
    <h3>输入</h3>
    <ul>{explanation.inputs.map((item) => <li key={item}>{item}</li>)}</ul>
    <h3>输出</h3>
    <ul>{explanation.outputs.map((item) => <li key={item}>{item}</li>)}</ul>
    <p>{explanation.privacy}</p>
  </details>
  <details>
    <summary>推荐操作流程</summary>
    <ol>{explanation.workflow.map((item) => <li key={item}>{item}</li>)}</ol>
  </details>
  <details>
    <summary>当前限制与差异</summary>
    <ul>{explanation.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
  </details>
  {hasUnavailableContent && (
    <details>
      <summary>为什么暂时无法完整实现</summary>
      <ul>
        {[...(explanation.unavailableReasons ?? []), ...(explanation.futureRequirements ?? [])]
          .map((item) => <li key={item}>{item}</li>)}
      </ul>
    </details>
  )}
</section>
```

算法原理默认展开；输入输出、流程、限制和无法实现原因使用原生 `details/summary`。数组渲染为 `<ul>` 或 `<ol>`，隐私文字放在输入输出区域末尾。不要用点击事件手写折叠状态。

- [ ] **Step 4: 在 ToolLayout 挂载面板**

`ToolLayout` 保持工作区优先：`children` 后渲染 `<ToolExplanationPanel toolId={tool.id} />`。不得在各个 Workspace 重复添加面板。

- [ ] **Step 5: 增加响应式样式**

在 `components.css` 添加：

- `.tool-explanation`：最大宽度随 `page-wrap`，顶部间距 40px，表面背景、1px 边框、14px 圆角、24px 内边距。
- `.tool-explanation__header`：flex，两端对齐，可换行。
- `.tool-status`：圆角胶囊；四种状态分别使用现有 CSS 变量与半透明背景，文字对比度至少 4.5:1。
- `.tool-explanation details`：上下边框和 12px 垂直间距；`summary` 可点击、键盘可聚焦。
- 440px 以下将 header 改为纵向排列，面板内边距改为 16px。

- [ ] **Step 6: 运行组件和代表性工作区测试**

Run: `npm test -- tests/tool-explanation-panel.test.tsx tests/color-workspace.test.tsx tests/developer-workspace.test.tsx tests/editor-workspace.test.tsx`

Expected: PASS；说明面板不改变工作区控件行为。

- [ ] **Step 7: 提交面板**

```bash
git add src/components/ToolExplanationPanel.tsx src/components/ToolLayout.tsx src/styles/components.css tests/tool-explanation-panel.test.tsx
git commit -m "feat: show capability explanations on tool pages"
```

---

### Task 4: 增加 56 项能力总览和无法实现汇总

**Files:**
- Create: `src/app/CapabilityStatusPage.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/styles/components.css`
- Create: `tests/capability-status-page.test.tsx`

**Interfaces:**
- Consumes: `TOOLS`、`TOOL_EXPLANATIONS`、`TOOL_CAPABILITY_STATUS_META`。
- Produces: `/capabilities` 页面和侧栏入口。

- [ ] **Step 1: 写路由和统计失败测试**

```tsx
/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { App } from '../src/app/App';

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

describe('能力与实现说明总览', () => {
  it('显示 56 项统计和无法完整实现原因', () => {
    window.history.replaceState({}, '', '/capabilities');
    render(<App />);

    expect(screen.getByRole('heading', { name: '能力与实现说明' })).toBeVisible();
    expect(screen.getByText('主要能力完整 9')).toBeVisible();
    expect(screen.getByText('部分实现 27')).toBeVisible();
    expect(screen.getByText('当前无法完整实现 20')).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(56);
    expect(screen.getByRole('link', { name: /二维码生成器/ })).toHaveAttribute('href', '/tools/qr-genny');
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- tests/capability-status-page.test.tsx`

Expected: FAIL，`/capabilities` 当前显示“未找到工具”。

- [ ] **Step 3: 实现总览页面**

页面必须包含：

- 标题“能力与实现说明”。
- 一段解释：入口可运行不等于能力完整复刻。
- 四张统计卡：完整实现 0、主要能力完整 9、部分实现 27、当前无法完整实现 20。
- 状态筛选 `<select aria-label="按实现状态筛选">`，选项为全部和四个状态。
- 56 个 `<article>`，显示中文名、英文名、状态、摘要、第一条限制；工具名链接到 `/editor` 或 `/tools/:id`。
- `unavailable` 卡片额外显示第一条无法实现原因或后续条件。

筛选只使用 React 本地状态，不修改全局搜索状态。

- [ ] **Step 4: 注册路由和侧栏入口**

在 `App.tsx` 的内容选择中，让 `pathname === '/capabilities'` 优先于工具路由。侧栏导航顶部增加：

```tsx
<a href="/capabilities" onClick={onClose} tabIndex={disabledTabIndex}>
  能力与实现说明
</a>
```

不要使用 `#capabilities`，因为这是独立路由。

- [ ] **Step 5: 增加总览响应式样式**

使用 `.capability-summary-grid`、`.capability-filter`、`.capability-tool-grid` 和 `.capability-tool-card`。桌面统计四列、工具卡两列；900px 以下两列；440px 以下全部单列。

- [ ] **Step 6: 运行页面与应用壳测试**

Run: `npm test -- tests/capability-status-page.test.tsx tests/app.test.tsx`

Expected: PASS；现有首页搜索、主题和移动抽屉测试不回归。

- [ ] **Step 7: 提交总览页**

```bash
git add src/app/CapabilityStatusPage.tsx src/app/App.tsx src/components/Sidebar.tsx src/styles/components.css tests/capability-status-page.test.tsx
git commit -m "feat: add capability status overview"
```

---

### Task 5: 校准过度承诺的工具短描述

**Files:**
- Modify: `src/data/tools.ts`
- Modify: `tests/registry.test.ts`
- Reference: `docs/audit-2026-08-02/FUNCTION-PARITY-AUDIT.md`

**Interfaces:**
- Consumes: Task 2 的状态注册表。
- Produces: 与现状一致的首页卡片描述和搜索内容。

至少修正以下 10 个明显不一致描述，使用这些精确中文：

```ts
{
  'artwork-enhancer': '调整图片对比度、饱和度、锐度与放大效果；彩色噪声纹理仍待补齐。',
  'background-remover': '使用边缘连通与颜色容差生成透明背景，复杂背景和毛发效果有限。',
  'image-converter': '在浏览器支持范围内转换 PNG、JPEG 和 WebP；其他格式与尺寸调整仍待补齐。',
  'editor': '在画布中组合图片、文字和基础形状，并管理图层与导出 PNG。',
  'colour-converter': '在 HEX、RGB 和 HSL 三种颜色格式之间转换。',
  'gradient-genny': '生成基础双色渐变并复制 CSS。',
  'paper-sizes': '查询当前内置的常见纸张规格。',
  'pdf-preflight': '分析 PDF 的页数、页面尺寸、方向和基础元数据。',
  'tailwind-cheatsheet': '搜索当前内置的常用 Tailwind CSS 类名。',
  'shavian-transliterator': '使用有限字母规则近似转换英文文本，不等同于发音词典转写。',
}
```

- [ ] **Step 1: 写事实校准失败测试**

在 `registry.test.ts` 追加：

```ts
it('明显缺口工具的目录描述不再宣传未实现能力', () => {
  expect(getToolById('image-converter')?.description).not.toMatch(/GIF|BMP|TIFF|ICO/);
  expect(getToolById('colour-converter')?.description).toContain('三种');
  expect(getToolById('pdf-preflight')?.description).not.toContain('字体');
  expect(getToolById('shavian-transliterator')?.description).toContain('近似');
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npm test -- tests/registry.test.ts`

Expected: FAIL，当前描述仍宣传未实现格式或算法。

- [ ] **Step 3: 替换 10 项精确描述**

只修改上述工具的 `description`；保留中文标题、英文标题、关键词、工作区和路由 ID。

- [ ] **Step 4: 运行注册表、首页和说明测试**

Run: `npm test -- tests/registry.test.ts tests/app.test.tsx tests/tool-explanations.test.ts`

Expected: PASS；搜索仍能按关键词找到工具，说明注册表不受影响。

- [ ] **Step 5: 提交事实校准**

```bash
git add src/data/tools.ts tests/registry.test.ts
git commit -m "fix: align tool descriptions with implementation"
```

---

### Task 6: 完整验证与阶段交付

**Files:**
- Modify only if verification exposes a defect in Task 1–5 files.
- Update: `docs/FEATURES.md`
- Update: `docs/HANDOFF.md`

**Interfaces:**
- Consumes: Tasks 1–5 的全部产物。
- Produces: 可交付的批次 0、最新功能文档和验证证据。

- [ ] **Step 1: 更新功能文档失败检查**

Run: `rg -n "能力与实现说明|/capabilities|56 个工具" docs/FEATURES.md docs/HANDOFF.md`

Expected: 当前缺少 `/capabilities` 和逐工具说明记录，命令无完整匹配。

- [ ] **Step 2: 更新 FEATURES 和 HANDOFF**

`FEATURES.md` 必须新增：

- 每个工具页都有中文能力、输入输出、算法、流程、隐私和限制说明。
- `/capabilities` 为 56 项状态总览。
- 状态统计为完整实现 0、主要能力完整 9、部分实现 27、当前无法完整实现 20。

`HANDOFF.md` 必须新增：

- `src/data/toolExplanations.ts` 是说明和未实现清单的事实来源。
- 后续补功能时必须同步更新对应条目的状态、能力、原理和限制。
- 不能只更新审计 Markdown 而遗漏页面数据。

- [ ] **Step 3: 运行全量测试**

Run: `npm test`

Expected: PASS；原有 384 个测试及本计划新增测试全部通过。

- [ ] **Step 4: 运行生产构建**

Run: `npm run build`

Expected: PASS；无 TypeScript 或 Vite 构建错误。

- [ ] **Step 5: 浏览器冒烟验证**

使用当前本地预览或重新启动 Vite，依次检查：

- `/tools/qr-genny`：工作区之后出现说明面板，状态为“当前无法完整实现”，限制中包含 WiFi。
- `/tools/regex-tester`：状态为“主要能力完整”，算法说明提到 Worker 超时隔离。
- `/editor`：说明面板不破坏宽画布布局。
- `/capabilities`：显示 56 张卡片和 0/9/27/20 统计，状态筛选可用。
- 390px 宽度：说明 header、统计卡和工具卡单列显示，无水平溢出。
- 浏览器控制台：0 条新增 error 或 warning。

- [ ] **Step 6: 提交文档和验证修复**

```bash
git add docs/FEATURES.md docs/HANDOFF.md
git commit -m "docs: hand off tool explanation system"
```

- [ ] **Step 7: 记录批次 0 完成并进入下一计划**

下一份独立计划必须是 `docs/superpowers/plans/2026-08-02-low-risk-capability-parity.md`，覆盖设计文档批次 1 的颜色、纸张、密码、Meta、正则、文本、进制和科学计算能力。本计划完成前不得开始机器学习抠图、专业 PDF 或 Substrata 大规模扩展。

---

## 计划自审结果

- 设计覆盖：本计划完整覆盖设计文档的批次 0、统一状态模型、56 项说明、总览入口、事实校准和验证要求。
- 范围隔离：颜色算法、批量图像、PDF、模型和编辑器能力属于后续独立计划，本计划不修改这些算法。
- 类型一致性：所有任务统一使用 `ToolCapabilityStatus`、`ToolExplanation`、`TOOL_EXPLANATIONS`、`getToolExplanation` 和 `getIncompleteToolExplanations`。
- 无占位符：状态集合、精确数量、关键描述、组件结构、测试代码、文件路径和命令均已给出。
