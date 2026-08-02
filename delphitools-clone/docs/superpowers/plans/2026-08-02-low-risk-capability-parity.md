# 低风险工具能力补齐 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以纯浏览器确定性算法补齐批次 1 的颜色、纸张、密码、Meta、正则、文本、进制和科学计算能力，并同步更新每个工具的中文能力说明与状态。

**Architecture:** 算法和静态数据继续放在 `src/engines` 与 `src/data`，React 工作区只负责输入、状态、复制、预览和下载。现有工具 ID、路由和工作区分组保持不变；每个增量先扩展纯函数测试，再接入对应页面，最后统一更新 `toolExplanations.ts` 这一事实来源。

**Tech Stack:** React 19、TypeScript、Vite、Vitest、Testing Library；不新增运行时依赖。

## Global Constraints

- 所有输入和生成结果只在本地浏览器处理，不上传，不调用远程服务。
- 不新增运行时依赖；颜色空间公式以 W3C CSS Color 4 的转换步骤和样例代码为依据。
- 用户可见文案以中文为主；英文缩写第一次出现时写中文解释。
- 不修改机器学习抠图、专业 PDF、批量 ZIP、二维码/条码导出或 Substrata 大规模扩展。
- 每个任务严格 TDD：先看到新增测试失败，再实现，再运行定向测试和生产构建。
- 任何能力变化都必须在 Task 9 同步更新 `src/data/toolExplanations.ts`，不得只更新审计 Markdown。
- 保留用户和其他任务的无关文件；每个任务只提交自己的文件。

---

### Task 1: 补齐颜色转换格式与逐项复制

**Files:**
- Modify: `src/engines/color.ts`
- Modify: `src/tools/ColorWorkspace.tsx`
- Modify: `tests/color.test.ts`
- Modify: `tests/color-workspace.test.tsx`

**Interfaces:**
- Produces: `ColorConversionResult`、`convertColor(input): ColorConversionResult`。
- `ColorConversionResult` 固定字段：`hex`、`rgb`、`decimalRgb`、`hsl`、`lab`、`lch`、`oklab`、`oklch`。
- UI 继续消费 `convertColor`，每个字段单独显示并提供“复制 <格式>”按钮。

- [ ] **Step 1: 写颜色空间标准样例失败测试**

在 `tests/color.test.ts` 追加：

```ts
it('输出 Decimal RGB、Lab/LCH 与 OKLab/OKLCH', () => {
  const red = convertColor('#ff0000');
  expect(red.decimalRgb).toBe('rgb(1, 0, 0)');
  expect(red.lab).toMatch(/^lab\(54\.29% 80\.81 69\.89\)$/u);
  expect(red.lch).toMatch(/^lch\(54\.29% 106\.84 40\.85\)$/u);
  expect(red.oklab).toMatch(/^oklab\(62\.8% 0\.225 0\.126\)$/u);
  expect(red.oklch).toMatch(/^oklch\(62\.8% 0\.258 29\.23\)$/u);
});
```

转换步骤必须使用：sRGB 解伽马 → D65 XYZ；Lab 前做 Bradford D65→D50；OKLab 直接由 D65 XYZ 转换；极低色度的色相序列化为 `none`。参考：`https://www.w3.org/TR/css-color-4/#color-conversion-code`。

- [ ] **Step 2: 运行引擎测试并确认缺少字段**

Run: `npm.cmd test -- tests/color.test.ts`

Expected: FAIL，`decimalRgb`、`lab`、`lch`、`oklab`、`oklch` 不存在。

- [ ] **Step 3: 实现颜色空间转换和稳定格式化**

新增类型：

```ts
export type ColorConversionResult = {
  hex: string;
  rgb: string;
  decimalRgb: string;
  hsl: string;
  lab: string;
  lch: string;
  oklab: string;
  oklch: string;
};
```

数值格式规则：Decimal RGB 最多 4 位小数；Lab/LCH 的 L、a、b、C、H 最多 2 位；OKLab/OKLCH 的 L 为百分数 1 位，其他分量最多 3 位；去掉无意义尾零。

- [ ] **Step 4: 写逐项复制页面失败测试**

在 `tests/color-workspace.test.tsx` 渲染 `colour-converter`，断言 8 个 `dt` 和按钮：

```tsx
expect(screen.getByText('Decimal RGB')).toBeVisible();
expect(screen.getByText('OKLCH')).toBeVisible();
expect(screen.getByRole('button', { name: '复制 OKLCH' })).toBeEnabled();
```

- [ ] **Step 5: 接入 8 格式列表与单项复制**

`Converter` 使用 `copyText` 和本地状态消息；每行结构为 `<dt>`、`<dd><code>`、复制按钮。复制成功显示“已复制 OKLCH”，失败显示中文错误，不移除现有整组结果复制能力。

- [ ] **Step 6: 验证并提交**

Run: `npm.cmd test -- tests/color.test.ts tests/color-workspace.test.tsx`

Run: `npm.cmd run build`

Commit: `feat: add complete color conversion outputs`

---

### Task 2: 扩展色彩和谐与 Tailwind 色阶导出

**Files:**
- Modify: `src/engines/color.ts`
- Modify: `src/tools/ColorWorkspace.tsx`
- Modify: `tests/color.test.ts`
- Modify: `tests/color-workspace.test.tsx`

**Interfaces:**
- Extends: `HarmonyScheme` 为 12 种方案。
- Produces: `TailwindScaleMode = 'balanced' | 'vivid' | 'muted'`、`generateTailwindScale(base, mode?)`、`formatTailwindCssVariables(name, scale)`、`formatTailwindConfig(name, scale)`。
- Consumes: Task 1 的 OKLCH 转换格式化逻辑，色阶卡片同时显示 HEX 和 OKLCH。

- [ ] **Step 1: 写 12 种和谐方案与导出失败测试**

方案集合固定为：`complementary`、`analogous`、`triadic`、`split-complementary`、`tetradic`、`square`、`monochromatic`、`shades`、`tints`、`tones`、`double-split`、`accented-analogous`。

测试至少断言：12 种均返回 2–6 个合法 HEX；`square` 色相间隔约 90°；`monochromatic` 保持色相只变化饱和度/明度；CSS 变量名会把“品牌 蓝”规范为 `--品牌-蓝-50`；Tailwind 配置对象包含 50–950 全部 11 档。

- [ ] **Step 2: 运行颜色引擎测试并确认失败**

Run: `npm.cmd test -- tests/color.test.ts`

Expected: FAIL，新增方案和导出函数不存在。

- [ ] **Step 3: 实现方案、模式和导出纯函数**

偏移规则：tetradic `[0, 60, 180, 240]`、square `[0, 90, 180, 270]`、double-split `[0, 30, 150, 180, 210, 330]`、accented-analogous `[0, 30, 60, 180]`。monochromatic/shades/tints/tones 使用固定的 HSL 饱和度与明度序列并经 `rgbToHex` 夹紧。

色阶模式：balanced 保持当前逻辑；vivid 将饱和度提高 12 个百分点；muted 将饱和度降低 24 个百分点。三个模式都返回 50–950 共 11 档。

- [ ] **Step 4: 写页面交互失败测试**

断言和谐页包含 12 个选项、“复制全部颜色”、“复制 CSS Variables”；Tailwind 页包含“色阶名称”、“生成模式”、“复制 CSS Variables”、“下载 Tailwind 配置”，并能选择 vivid 后生成结果。

- [ ] **Step 5: 接入复制和下载**

和谐页复制内容分别为每行一个 HEX、以及 `:root { --harmony-1: #...; }`。Tailwind 页用 `ResultPanel`/`Blob` 下载 `tailwind-colors.js`，文件内容为可直接合并到 `theme.extend.colors` 的对象；同时下载/复制 CSS 变量。

- [ ] **Step 6: 验证并提交**

Run: `npm.cmd test -- tests/color.test.ts tests/color-workspace.test.tsx`

Run: `npm.cmd run build`

Commit: `feat: expand harmony and tailwind color tools`

---

### Task 3: 扩展纸张数据库、搜索、比较与 DPI 查询

**Files:**
- Modify: `src/data/paperSizes.ts`
- Modify: `src/tools/TextWorkspace.tsx`
- Modify: `tests/text.test.ts`
- Modify: `tests/text-workspace.test.tsx`

**Interfaces:**
- Extends: `PaperSize` 增加 `aliases: readonly string[]` 和更细的 `group` 字段。
- Produces: `searchPaperSizes(query, group?)`、`paperPixelDimensions(id, dpi)`。
- Extends: `convertPaperDimensions(id, unit, dpi = 96)`；`px` 使用传入 DPI。

- [ ] **Step 1: 写数据覆盖和换算失败测试**

数据库至少包含这些完整系列：ISO A0–A10、ISO B0–B10、ISO C0–C10、RA0–RA4、SRA0–SRA4、ANSI A–E、Architectural A–E/E1、JIS B0–B10；以及 Letter、Legal、Tabloid/Ledger、Executive、Folio、Quarto、Imperial、Royal、Crown、Demy、中国大度/正度常用开本、瑞典 SIS 与法国 Raisin/Carré 常用规格。总数不得少于 75。

```ts
expect(PAPER_SIZES.length).toBeGreaterThanOrEqual(75);
expect(findPaperSize('c5')).toMatchObject({ widthMm: 162, heightMm: 229 });
expect(findPaperSize('sra3')).toMatchObject({ widthMm: 320, heightMm: 450 });
expect(paperPixelDimensions('a4', 300)).toEqual({ width: 2480, height: 3508, dpi: 300 });
expect(searchPaperSizes('名片').some((item) => item.id === 'business-card-cn')).toBe(true);
```

- [ ] **Step 2: 运行文本引擎测试并确认失败**

Run: `npm.cmd test -- tests/text.test.ts`

Expected: FAIL，数量不足且搜索/DPI API 不存在。

- [ ] **Step 3: 扩展静态数据和纯函数**

所有尺寸以毫米存储，英寸来源使用 `25.4 mm/in` 转换后保留最多 3 位；像素计算使用 `Math.round(mm / 25.4 * dpi)`。DPI 必须是 36–2400 的有限数，否则抛出“DPI 必须在 36 到 2400 之间”。搜索匹配 id、name、group 和 aliases，忽略大小写与首尾空格。

- [ ] **Step 4: 写工作区搜索和比较失败测试**

测试搜索“C5”只显示相关规格；可勾选最多 3 项比较；输入 300 DPI 后 A4 显示 `2480 × 3508 px`；第 4 项勾选被拒绝并显示中文提示。

- [ ] **Step 5: 接入搜索、分组、比较和 DPI**

页面包含搜索框、类别筛选、DPI 数字输入、可访问的规格列表和“比较纸张”区域。比较卡按面积比例显示 CSS 预览，但最大边限制 240px；不添加图片上传（它属于后续图像工作流）。

- [ ] **Step 6: 验证并提交**

Run: `npm.cmd test -- tests/text.test.ts tests/text-workspace.test.tsx`

Run: `npm.cmd run build`

Commit: `feat: expand paper size explorer`

---

### Task 4: 补齐密码解码方式与自动候选

**Files:**
- Modify: `src/engines/developer.ts`
- Modify: `src/tools/DeveloperWorkspace.tsx`
- Modify: `tests/developer.test.ts`
- Modify: `tests/developer-workspace.test.tsx`

**Interfaces:**
- Produces: `decodeVigenere(text, key)`、`decodeMorse(text)`、`decodeHex(text)`、`rankDecodingCandidates(text, limit?)`。
- `DecodingCandidate = { method: 'caesar' | 'atbash' | 'rot13' | 'morse' | 'hex' | 'base64'; label: string; text: string; score: number }`。

- [ ] **Step 1: 写解码向量失败测试**

```ts
expect(decodeVigenere('LXFOPVEFRNHR', 'LEMON')).toBe('ATTACKATDAWN');
expect(decodeMorse('... --- ... / .---- ..---')).toBe('SOS 12');
expect(decodeHex('E4 BD A0 E5 A5 BD')).toBe('你好');
expect(rankDecodingCandidates('SGVsbG8gd29ybGQ=', 6).some((item) => item.method === 'base64' && item.text === 'Hello world')).toBe(true);
```

Vigenère 只移动 A–Z/a–z，保留标点并保持大小写；Morse 支持 A–Z、0–9、常用标点，空格分隔符号、`/` 分隔单词；Hex 接受空格/冒号/连字符和连续偶数字节，按 UTF-8 严格解码。

- [ ] **Step 2: 运行开发引擎测试并确认失败**

Run: `npm.cmd test -- tests/developer.test.ts`

Expected: FAIL，新增解码函数不存在。

- [ ] **Step 3: 实现手动解码和安全自动候选**

自动候选对不符合形态的 Morse/Hex/Base64 不生成结果；候选统一经过现有 `englishScore` 排序并去除重复文本，最多返回 10 项。Vigenère 不进入自动候选，因为缺少密钥时无法可靠推断。

- [ ] **Step 4: 写 Decoder 页面失败测试**

断言下拉框包含 Vigenère、Morse、Hex、Base64；Vigenère 时显示“密钥”；自动模式显示方法标签和候选；页面包含“密码参考”折叠区，解释每种方法的输入格式和限制。

- [ ] **Step 5: 接入手动/自动模式和参考表**

保留现有凯撒/Atbash/ROT13；Base64 使用已有 `decodeBase64`。所有失败都用 `StatusMessage` 显示中文错误，不把失败输入静默返回原文。

- [ ] **Step 6: 验证并提交**

Run: `npm.cmd test -- tests/developer.test.ts tests/developer-workspace.test.tsx`

Run: `npm.cmd run build`

Commit: `feat: expand local cipher decoder`

---

### Task 5: 补齐 Meta 社交标签与正则预设

**Files:**
- Create: `src/data/regexPresets.ts`
- Modify: `src/engines/developer.ts`
- Modify: `src/tools/DeveloperWorkspace.tsx`
- Modify: `tests/developer.test.ts`
- Modify: `tests/developer-workspace.test.tsx`

**Interfaces:**
- Extends: `MetaTagInput` 增加 `siteName`、`twitterHandle`、`twitterCard: 'summary' | 'summary_large_image'`。
- Produces: `REGEX_PRESETS`，固定 id 为 `email`、`url`、`phone-cn`、`iso-date`。

- [ ] **Step 1: 写 Meta 输出与预设数据失败测试**

断言 `generateMetaTags` 输出 `og:site_name`、`twitter:card`、`twitter:title`、`twitter:description`、`twitter:image`、规范化后的 `twitter:site=@handle`，且所有属性继续 HTML 转义。断言 4 个预设均能通过 `testRegex` 匹配各自样例。

- [ ] **Step 2: 运行开发测试并确认失败**

Run: `npm.cmd test -- tests/developer.test.ts`

Expected: FAIL，新字段和 `REGEX_PRESETS` 不存在。

- [ ] **Step 3: 扩展生成器与预设静态数据**

Twitter handle 去掉输入前导 `@` 后再输出一个 `@`；未填 title/description/image 时不生成对应 Twitter 标签。预设对象字段固定为 `{ id, name, pattern, flags, sample, description }`，flags 使用 `g` 或 `giu`，不依赖浏览器尚未普及的 `v` 标志。

- [ ] **Step 4: 写 Meta 预览与 Regex 快捷按钮失败测试**

Meta 页断言新增 3 个输入和“社交分享预览”区域；正则页断言 4 个预设按钮，点击“电子邮箱”会同时更新 pattern/flags/sample；标志快捷控制包含 `g i m s u y d`，点击会增删且按 `dgimsuy` 规范顺序写回输入框。

- [ ] **Step 5: 接入页面**

社交预览显示标题、描述、站点名、图片 URL 的本地视觉卡，不请求远程图片；使用纯色占位区域和 URL 文本，避免隐式网络访问。正则保留文本 flags 输入，同时增加 `aria-pressed` 按钮组；`u` 与未来 `v` 不同时启用。

- [ ] **Step 6: 验证并提交**

Run: `npm.cmd test -- tests/developer.test.ts tests/developer-workspace.test.tsx`

Run: `npm.cmd run build`

Commit: `feat: add social meta and regex presets`

---

### Task 6: 补齐文本查找替换、提取与批处理动作

**Files:**
- Modify: `src/engines/developer.ts`
- Modify: `src/tools/DeveloperWorkspace.tsx`
- Modify: `tests/developer.test.ts`
- Modify: `tests/developer-workspace.test.tsx`

**Interfaces:**
- Extends: `TextCase` 增加 `toggle`。
- Produces: `findAndReplaceText(source, query, replacement, options)`、`extractTextItems(source, kind)`、`reverseLines`、`removeEmptyLines`、`numberLines`。
- `FindReplaceOptions = { useRegex: boolean; caseSensitive: boolean; replaceAll: boolean }`。
- `TextExtractKind = 'emails' | 'urls' | 'phone-numbers' | 'numbers'`。

- [ ] **Step 1: 写确定性文本操作失败测试**

覆盖：字面量 `$&` 替换不会被当作替换模板；正则无效时报中文错误；不区分大小写全部替换；提取结果去重且保持首次出现顺序；toggle case；逆序行、删除空行、行号从 1 开始。

- [ ] **Step 2: 运行开发引擎测试并确认失败**

Run: `npm.cmd test -- tests/developer.test.ts`

Expected: FAIL，新增文本 API 不存在。

- [ ] **Step 3: 实现纯函数**

字面量查找使用 escaped RegExp，并用替换回调返回 replacement，避免 `$` 展开。正则模式最大 1,000 字符；提取最多返回 10,000 项。URL 只提取 `http://`/`https://`，手机号提取带可选 `+`、空格和连字符的 7–15 位数字组合。

- [ ] **Step 4: 写文本处理台页面失败测试**

页面新增三个中文页签/分组：“查找替换”“提取内容”“大小写、行与清理”。测试输入、应用、重置、复制和下载；查找替换显示替换次数；提取区显示去重结果。

- [ ] **Step 5: 接入完整动作集**

现有 10 个动作全部保留，新增 toggle、reverse-lines、remove-empty-lines、number-lines。使用按钮/选择框的可访问标签；结果仍通过 `ResultPanel` 复制和下载。

- [ ] **Step 6: 验证并提交**

Run: `npm.cmd test -- tests/developer.test.ts tests/developer-workspace.test.tsx`

Run: `npm.cmd run build`

Commit: `feat: expand text processing workbench`

---

### Task 7: 补齐多进制同步、16 位切换和位运算

**Files:**
- Modify: `src/engines/developer.ts`
- Modify: `src/tools/DeveloperWorkspace.tsx`
- Modify: `tests/developer.test.ts`
- Modify: `tests/developer-workspace.test.tsx`

**Interfaces:**
- Produces: `convertCommonBases(value, fromBase)`、`toggleBit16(value, bit)`、`applyBitwise16(left, right, operation)`。
- `CommonBaseValues = { binary: string; octal: string; decimal: string; hexadecimal: string }`。
- `BitwiseOperation = 'and' | 'or' | 'xor' | 'not' | 'shift-left' | 'shift-right'`。

- [ ] **Step 1: 写位运算边界失败测试**

```ts
expect(convertCommonBases('ff', 16)).toEqual({ binary: '11111111', octal: '377', decimal: '255', hexadecimal: 'ff' });
expect(toggleBit16('0', 15)).toBe('32768');
expect(applyBitwise16('65535', '3855', 'and')).toBe('3855');
expect(applyBitwise16('32768', '1', 'shift-left')).toBe('0');
```

16 位操作统一使用无符号 `0..65535` 并在每次操作后 `& 0xffff`；超范围或负数抛中文错误。普通 2–36 进制大整数转换继续支持负数，不受 16 位限制。

- [ ] **Step 2: 运行开发测试并确认失败**

Run: `npm.cmd test -- tests/developer.test.ts`

Expected: FAIL，新 API 不存在。

- [ ] **Step 3: 实现纯函数**

复用 `convertBase` 的逐字符 BigInt 解析，不使用 `Number.parseInt` 处理大整数。四种常用进制输出不加 `0x/0b` 前缀；十六进制小写。

- [ ] **Step 4: 写多输入页面失败测试**

断言二/八/十/十六进制四个可编辑输入，修改任一个会同步其余三个；16 个 bit 按钮有 `aria-pressed`；位运算提供第二操作数和 AND/OR/XOR/NOT/左移/右移；每个输出可单独复制。

- [ ] **Step 5: 接入页面并防止输入反馈循环**

状态保存规范十进制 BigInt 字符串和最后编辑的输入；无效输入只在当前字段显示且不覆盖上次有效结果。Bit Toggle 只对 16 位区域启用，页面明确说明边界。

- [ ] **Step 6: 验证并提交**

Run: `npm.cmd test -- tests/developer.test.ts tests/developer-workspace.test.tsx`

Run: `npm.cmd run build`

Commit: `feat: add synchronized base and bit tools`

---

### Task 8: 补齐科学计算器角度、函数、Ans 与键盘

**Files:**
- Modify: `src/engines/calculator.ts`
- Modify: `src/tools/CalculatorWorkspace.tsx`
- Modify: `tests/calculator.test.ts`
- Modify: `tests/calculator-workspace.test.tsx`

**Interfaces:**
- Produces: `ScientificOptions = { angleMode?: 'rad' | 'deg'; ans?: number }`。
- Extends: `evaluateScientific(expression, options?)`。
- Parser 增加 `%`、`!`、逗号和多参数 `root(value, degree)`；常量保留 `pi`、`e`，增加变量 `ans`。

- [ ] **Step 1: 写科学计算向量失败测试**

```ts
expect(evaluateScientific('sin(30)', { angleMode: 'deg' })).toBeCloseTo(0.5, 12);
expect(evaluateScientific('asin(0.5)', { angleMode: 'deg' })).toBeCloseTo(30, 12);
expect(evaluateScientific('5!')).toBe(120);
expect(evaluateScientific('17 % 5')).toBe(2);
expect(evaluateScientific('root(27, 3)')).toBeCloseTo(3, 12);
expect(evaluateScientific('ans * 2', { ans: 7 })).toBe(14);
expect(evaluateScientific('1.25e3')).toBe(1250);
```

阶乘只接受 0–170 整数；root 的 degree 不能为 0，偶次根不能接收负数；mod 除数不能为 0。`^` 保持右结合。

- [ ] **Step 2: 运行计算引擎测试并确认失败**

Run: `npm.cmd test -- tests/calculator.test.ts`

Expected: FAIL，options、阶乘、mod、root 或 ans 不受支持。

- [ ] **Step 3: 扩展 tokenizer/parser**

Token 增加 `comma`，operator 增加 `%`、`!`；`!` 作为 postfix，优先级高于幂。函数表改为 `{ arity, evaluate(args, options) }`，sin/cos/tan 和 asin/acos/atan 根据 angleMode 做输入/输出转换；其他函数保持弧度无关。

- [ ] **Step 4: 写计算器界面失败测试**

断言 DEG/RAD 切换为 `aria-pressed`；键盘含 sin、cos、tan、sin⁻¹、cos⁻¹、tan⁻¹、log、ln、x!、|x|、π、e、Ans、EE、mod、xʸ、ʸ√x；完成一次计算后点击 Ans 会插入 `ans` 并使用上一结果。

- [ ] **Step 5: 接入扩展键盘和状态**

把按键分为数字/运算和科学函数两组，窄屏自动换行；历史记录保留 12 条。角度模式切换不清空表达式/Ans；清空只清表达式和当前错误，另加“清空历史”按钮。

- [ ] **Step 6: 验证并提交**

Run: `npm.cmd test -- tests/calculator.test.ts tests/calculator-workspace.test.tsx`

Run: `npm.cmd run build`

Commit: `feat: expand scientific calculator workflow`

---

### Task 9: 同步中文说明、状态统计和交付文档

**Files:**
- Modify: `src/data/toolExplanations.ts`
- Modify: `tests/tool-explanations.test.ts`
- Modify: `tests/capability-status-page.test.tsx`
- Modify: `docs/FEATURES.md`
- Modify: `docs/HANDOFF.md`

**Interfaces:**
- Consumes: Tasks 1–8 的实际能力。
- Produces: 新状态基线 `complete 0 / core-complete 17 / partial 24 / unavailable 15`。

- [ ] **Step 1: 写新状态和说明内容失败测试**

新增 core-complete：`colour-converter`、`harmony-genny`、`tailwind-shades`、`decoder`、`meta-tag-genny`、`markdown-writer`、`base-converter`、`sci-calc`。`paper-sizes` 从 unavailable 改为 partial，因为仍不含图片实物尺寸覆盖比较。

```ts
expect(counts['core-complete']).toHaveLength(17);
expect(counts.partial).toHaveLength(24);
expect(counts.unavailable).toHaveLength(15);
expect(getToolExplanation('paper-sizes').status).toBe('partial');
```

并逐项断言 principle/capabilities/limitations 包含本批新增关键词，例如颜色的 OKLCH、纸张的 DPI、密码的 Vigenère、Meta 的 Twitter、正则预设、文本查找替换、进制 Bit Toggle、科学计算 DEG/RAD。

- [ ] **Step 2: 运行说明测试并确认旧基线失败**

Run: `npm.cmd test -- tests/tool-explanations.test.ts tests/capability-status-page.test.tsx`

Expected: FAIL，仍为 0/9/27/20。

- [ ] **Step 3: 逐项更新事实数据**

只根据已通过测试的 Tasks 1–8 改状态、summary、capabilities、inputs、outputs、principle、workflow 和 limitations。删除已经实现的 unavailableReasons；保留仍未实现的边界。纸张限制明确“尚未提供图片上传后的实物覆盖叠放”。

- [ ] **Step 4: 更新总览测试和交付文档**

能力总览测试改为 0/17/24/15，并验证筛选后数量。FEATURES/HANDOFF 写入批次 1 能力和新状态；下一批仍为批量、导出和图像工作流，不能声称 56 项全部完整。

- [ ] **Step 5: 验证并提交**

Run: `npm.cmd test -- tests/tool-explanations.test.ts tests/capability-status-page.test.tsx tests/app.test.tsx`

Run: `npm.cmd run build`

Commit: `docs: sync low risk capability status`

---

### Task 10: 全量验证和浏览器交付

**Files:**
- Modify only when verification reveals a Task 1–9 defect.
- Update: `docs/HANDOFF.md` only if final evidence differs from Task 9 assumptions.

**Interfaces:**
- Consumes: Tasks 1–9 的全部产物。
- Produces: 批次 1 可交付版本和下一批准确起点。

- [ ] **Step 1: 运行全量测试**

Run: `npm.cmd test`

Expected: 所有测试文件通过，0 failures；记录文件数和测试数。

- [ ] **Step 2: 运行生产构建与差异检查**

Run: `npm.cmd run build`

Run: `git diff --check`

Expected: TypeScript/Vite 成功且无空白错误；既有大 chunk 警告可记录但不是失败。

- [ ] **Step 3: 浏览器冒烟**

检查 `/tools/colour-converter`、`/tools/harmony-genny`、`/tools/tailwind-shades`、`/tools/paper-sizes`、`/tools/decoder`、`/tools/meta-tag-genny`、`/tools/regex-tester`、`/tools/markdown-writer`、`/tools/base-converter`、`/tools/sci-calc` 和 `/capabilities`。每页完成一条代表任务；桌面和 390px 无横向溢出；控制台 0 新增 error/warning。

- [ ] **Step 4: 最终事实核验**

从 `TOOL_EXPLANATIONS` 实际计算 0/17/24/15；确认 56 个唯一 ID；确认所有新增按钮、下载和复制操作都不触发网络请求。

- [ ] **Step 5: 提交验证修复**

若无缺陷，不创建空提交；若有缺陷，按所属任务写失败回归测试、最小修复并使用提交信息 `fix: close low risk parity verification gaps`。

---

## 计划自审结果

- 规格覆盖：设计批次 1 的 10 类能力全部映射到 Tasks 1–8；状态、说明、总览和文档由 Task 9 同步；Task 10 提供完整验收。
- 范围隔离：纸张图片上传、批量 ZIP、二维码/条码导出、图像算法、PDF 与编辑器扩展未混入本计划。
- 占位符扫描：计划不含 TBD/TODO/“类似任务”等不可执行描述；每个任务给出接口、红灯、实现边界、绿灯和提交信息。
- 类型一致性：颜色、纸张、解码、文本、位运算和科学计算接口在生产者任务中定义，后续任务只消费这些签名。
- 状态算术：9 个原 core-complete 保留；8 个新 core-complete 得到 17；paper-sizes 转 partial 后为 24；unavailable 降为 15；complete 仍为 0。
