# Task 4：颜色引擎和十个颜色工具报告

## 实现结果

- 新增纯颜色引擎：颜色解析/转换、WCAG 对比度、和谐色、确定性调色板、Canvas 像素调色板、色觉模拟、Tailwind 色阶、渐变 CSS 与像素采样。
- 将且仅将 `colorblind-sim`、`colour-converter`、`contrast-checker`、`gradient-genny`、`harmony-genny`、`palette-collection`、`palette-extractor`、`palette-genny`、`pixel-picker`、`tailwind-shades` 接入共享 `ColorWorkspace`；非颜色工具仍使用原有 `ToolLayout` 工作区边界。
- 图片工具复用 `FileDropzone`，通过本地 Canvas 读取 `ImageData`，并在读取结束后调用 `URL.revokeObjectURL()`。生成颜色均显示 HEX 文本并可通过 `ResultPanel` 复制。

## TDD 记录

### RED

先新增 `tests/color.test.ts` 与 `tests/color-workspace.test.tsx`，运行：

```text
npm.cmd test -- tests/color.test.ts tests/color-workspace.test.tsx
```

结果：失败。颜色测试因 `src/engines/color` 不存在而无法加载；路由测试因颜色页面仍只有“正在构建此工具”而找不到“输入颜色”文本框。失败原因与新功能缺失一致。

### GREEN

新增纯引擎、调色板数据、模式化 `ColorWorkspace`，并仅在颜色工具路由启用它。首轮颜色测试发现两个契约偏差：`ocean` 的字符码手工和为 518（修正期望的精确字面值），以及 Tailwind `500` 必须保持输入的规范 HEX、不能经 HSL 往返。最小修正后：

```text
npm.cmd test -- tests/color.test.ts
10 passed

npm.cmd test -- tests/color-workspace.test.tsx
1 passed
```

## 全套验证

```text
npm.cmd test
6 test files passed, 39 tests passed

npm.cmd run build
tsc -b && vite build: passed
```

构建期间发现 `ImageData` 不接受可能为 `SharedArrayBuffer` 的类型化像素缓冲；根因是 `ImagePixels.data` 的 Canvas 类型比构造器约束宽。通过在将像素放回预览 canvas 前创建本地 `Uint8ClampedArray` 副本修复，随后构建成功。

## 变更文件

- `delphitools-clone/src/engines/color.ts`
- `delphitools-clone/src/tools/ColorWorkspace.tsx`
- `delphitools-clone/src/data/palettes.ts`
- `delphitools-clone/src/app/ToolPage.tsx`
- `delphitools-clone/src/styles/components.css`
- `delphitools-clone/tests/color.test.ts`
- `delphitools-clone/tests/color-workspace.test.tsx`

## 自检

- 10 个目标 ID 都有各自中文标签、默认值及结果布局；无关工具路由保持原占位边界。
- 转换/对比/色觉/渐变/和谐/收藏/生成/提取/像素/Tailwind 均调用本地引擎。
- 无效输入、图片空值/读取错误、处理状态与复制状态均使用中文文本；像素工具支持点击、方向键和坐标数值输入。
- 未触碰工作树中的无关未跟踪文件。

## 提交

`feat: implement color design tools`

## Fix Round 1

### RED

先扩展 `tests/color-workspace.test.tsx`，运行：

```text
npm.cmd test -- tests/color-workspace.test.tsx
```

结果：15 项中 3 项失败，分别证明空文件选择没有中文提示、图片读取期间没有“正在读取图片”状态、以及损坏的 `localStorage` JSON 会让调色板收藏页崩溃。失败均来自生产代码的实际 UI 行为。

### GREEN

- 图片处理入口先拒绝空文件数组，避免调用 `URL.createObjectURL`；读取期间显示“正在读取图片”。
- 将底层读取异常统一映射为“图片读取失败，请重试”，同时保留已有的 `finally` URL 回收。
- 收藏数据在 JSON 解析和字符串数组校验后才使用；损坏或非数组数据回退为空收藏。
- 工作区测试覆盖十个颜色入口的标题/专属控件，并覆盖空输入、加载/错误、Object URL 回收、像素方向键、收藏持久化及损坏数据回退。

### 本轮验证

```text
npm.cmd test -- tests/color-workspace.test.tsx
16 passed

npm.cmd test
6 test files passed, 54 tests passed

npm.cmd run build
tsc -b && vite build: passed
```

### 本轮提交

`fix: harden color workspace image and favorites flows`
