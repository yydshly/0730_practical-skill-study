# GC Minimal Zine Poster Demo Design

> 状态：已确认
> 日期：2026-08-01
> 研究项目：`gc-minimal-zine-poster`

## 目标

在现有多项目研究仓库中，为 `gc-minimal-zine-poster` 建立一个可直接浏览的研究型 UI Demo。Demo 需要把这个 Skill 的输入、Prompt 编译、变体配方、质量检查和真实生成结果拆成可观察的页面状态，帮助研究者理解它如何把抽象主题转化为极简 ZINE 风格海报。

第一阶段使用当前内部 Codex 的图像生成能力预先生成真实样例，并把样例作为本地素材放入 Demo。页面本身保持静态、可部署、无 API Key、无后端，不在浏览器运行时调用外部图像服务。

## 设计契约

- Entry mode：Brief-led
- Target user and context：研究这个 Skill 的设计者、提示词作者和前端实现者
- Desired first impression：进入页面后立即看懂“输入主题 → Prompt 编译 → 海报结果”的完整闭环，并能看到真实生成样例
- Visual ambition：Editorial
- Experience architecture：Editorial Flow
- Visual constraints：深石墨研究工作台、暖灰仿旧纸张结果卡、细线框、衬线标题、等宽技术标记、单一高饱和色彩锚点
- Information constraints：输入和生成结果是第一优先级；Prompt 字段、Recipe 和 Quality Gate 是解释层，不得抢过海报结果
- Operation constraints：预设切换、输入编辑、编译、切换变体、复制 Prompt、打开示例详情、键盘可达
- State constraints：初始、编译中、结果、空输入、复制成功、生成能力边界都必须有清晰文字反馈
- Environment constraints：原生 HTML/CSS/JavaScript；本地资源；支持 GitHub Pages；不引入构建系统和远程字体
- Primary journey：选择预设或输入主题 → 编译 Prompt → 检查字段和 Recipe → 查看真实样例/本地预览 → 复制 Prompt
- User-defined phases：第一阶段完成可运行演示和即时研究；实时生图接口、完整自动化回归体系和后端连接留待后续
- Required artifacts：Demo 页面、真实生成样例、本地运行说明、验证记录、自动化测试和根目录研究索引入口
- Autonomy authorization：用户已确认离线静态 Demo，并确认直接使用内部 Codex 生成真实样例
- User-decision boundary：不扩展为实时 API 或后端产品；若要浏览器按钮实时调用 Codex，需要单独设计桥接方案
- Observable completion criteria：桌面/平板/手机均可访问；完成主流程；Prompt、Recipe、Quality Gate 和真实样例可见；复制和空输入反馈可用；无横向溢出；测试和浏览器验收有记录

## 项目边界与目录

保留上游 Skill 文件和示例不变，在仓库内新增独立的 `demo/` 子项目，并让根目录研究索引链接到它。

```text
gc-minimal-zine-poster/
├─ SKILL.md
├─ README.md
├─ README.zh-CN.md
├─ examples/
└─ demo/
   ├─ index.html
   ├─ styles.css
   ├─ js/
   │  ├─ data.js
   │  ├─ compiler.js
   │  └─ app.js
   ├─ assets/
   │  ├─ generated/
   │  └─ previews/
   ├─ tests/
   │  ├─ compiler.test.mjs
   │  └─ browser-smoke.py
   ├─ docs/
   │  └─ frontend-validation.md
   └─ README.md
```

## 页面结构

### 1. 研究页头

显示 Skill 名称、版本、研究标签、当前模式 `STANDARD MODE` 和“本 Demo 使用内部 Codex 预生成素材”的边界说明。页头只提供方向，不放置过多装饰。

### 2. 左侧输入区

- 输入类型：主题、句子、物件、情绪、文章简报
- 主输入框：允许用户直接修改内容
- 预设按钮：雨天旧书店、海边午后、台风记忆、夜门等
- 主操作：`Compile Prompt`
- 次操作：`New Variation`
- 输入下方显示当前输入被提炼出的核心主题和视觉隐喻

### 3. 中央海报区

- 暖灰 3:5 纸张画布
- 真实 Codex 生成样例作为主要结果
- 图片加载失败时显示带编号的本地占位，不阻塞 Prompt 研究
- 叠加 `GENERATED SAMPLE`、主体名称、色彩锚点和留白比例等少量研究标记
- 结果区旁边提供样例切换和“查看原图”入口

### 4. 右侧解释区

按 Skill 的真实工作流拆成三个面板：

- `PROMPT COMPILER`：展示 9 个字段，包括 Canvas、Attention Geometry、Image Anchor、Typography、Color Logic、Texture、Mood 和 Hard Avoids
- `VARIATION RECIPE`：展示布局、主体、字体、色彩、纹理、情绪六个轴
- `QUALITY GATE`：展示留白、主体比例、单一高饱和色、印刷质感、反向约束等检查结果

Prompt 使用四段式展示，并提供复制按钮。长文本在桌面端可滚动，在手机端自然折行。

## 数据流与接口

页面不直接执行上游 `SKILL.md`，而是把其规则转换为可研究的确定性前端模型：

```text
用户输入
  → normalizeInput(input)
  → selectVariation(input, history)
  → compilePrompt(normalizedInput, recipe)
  → runQualityGate(compilation)
  → renderResult(compilation, asset)
```

核心对象：

```js
{
  input: {
    type: 'theme',
    value: '雨天旧书店'
  },
  fields: {
    canvas,
    attentionGeometry,
    imageAnchor,
    anchorTreatment,
    typographySystem,
    colorLogic,
    reproductionTexture,
    emotionalTemperature,
    hardAvoids
  },
  promptParagraphs: [paragraph1, paragraph2, paragraph3, paragraph4],
  recipe: {
    layout,
    anchor,
    typography,
    accent,
    texture,
    mood
  },
  qualityGate: [
    { label, status, detail }
  ],
  preview: {
    assetPath,
    title,
    accentColor,
    clusterShare,
    negativeSpaceShare
  }
}
```

编译器需要保证：

- Prompt 始终输出四段；
- 每个结果包含一个明确的视觉主体；
- 每个结果包含一个主高饱和色彩锚点；
- 变体会改变视觉语法，而不只是改变位置；
- 空输入返回可读错误，不生成空结果；
- 同一个预设在切换变体后会轮换配方，但仍保持相同主题。

## 真实图像素材

使用内部 Codex 图像生成能力预先生成 4–6 张 3:5 海报，覆盖至少 3 种布局和 3 种色彩锚点。每张素材记录：

- 来源主题
- 使用的最终 Prompt
- Recipe
- 生成日期
- 对应文件路径

素材存放在 `demo/assets/generated/`，现有仓库示例继续作为参考画廊。页面必须明确区分 `GENERATED SAMPLE` 与 `LOCAL PREVIEW`，不把静态展示误称为运行时生成。

## 交互与状态

- 初始：载入第一个预设并显示可读结果
- 编译中：按钮禁用，流程标记依次显示 `PARSE / COMPILE / CHECK / READY`
- 结果：Prompt、Recipe、Quality Gate 和海报同步更新
- 空输入：输入框获得焦点，显示“请输入一个主题或简报”
- 复制成功：Toast 和按钮文案短暂变为 `COPIED`
- 复制失败：提供可见错误，并保留文本可手动选择
- 示例切换：不丢失当前 Prompt 历史，可回到上一个变体
- 键盘：Tab 顺序符合输入 → 编译 → 结果 → 解释区；焦点轮廓始终可见；Escape 关闭原图层
- reduced-motion：移除编译步骤动画和图片过渡，但不隐藏状态信息

## 响应式行为

- 桌面：输入、海报、解释三栏
- 平板：输入与解释分区，海报保持独立焦点
- 手机：输入 → 海报 → Prompt → Recipe → Quality Gate 垂直顺序
- 海报保持 3:5 比例，不使用横向滚动
- Prompt 和 Recipe 卡片允许内容自然增长，不裁剪必要信息

## 测试与验收

### Node 测试

第一阶段只保留覆盖核心编译器和主流程的轻量测试，不把 Demo 扩展成完整的自动化回归平台。

- 默认预设可编译
- 自定义输入可归一化
- 四段 Prompt 和 9 个字段完整
- Recipe 包含六个轴
- Quality Gate 能识别单一主色和硬性禁用项
- 空输入返回错误
- 变体切换会改变配方

### 浏览器验收

- 1440px：三栏布局、主路径和原图层
- 768px：平板布局、Prompt 可读、无重叠
- 390px：完整输入到复制路径、无横向溢出
- 交互：预设、编译、变体、复制、空状态、Escape、焦点回归
- 视觉：真实生成样例、纸张画布、研究标记和状态反馈均可见

## 不在第一阶段

- 浏览器运行时调用 Codex
- 外部图像 API、服务端代理或 API Key
- 用户账号、项目保存和数据库
- 批量生成和下载队列
- 复杂海报编辑器
- 将上游 `SKILL.md` 改写成另一套 Skill

## 覆盖清单

| 用户阶段 | 要求 | Surface / state | 证据 | 状态 |
|---|---|---|---|---|
| 第一阶段 | 可运行研究 Demo | 桌面初始页 | 浏览器截图 + DOM | continue |
| 第一阶段 | 输入到 Prompt 编译 | 桌面结果态 | 浏览器交互 | continue |
| 第一阶段 | 真实 Codex 样例展示 | 桌面海报区 | 本地素材 + 浏览器截图 | continue |
| 第一阶段 | Prompt / Recipe / Quality Gate | 桌面、平板、手机 | 浏览器截图 + DOM | continue |
| 第一阶段 | 复制和空状态 | 主流程 | 浏览器交互 | continue |
| 第一阶段 | 响应式无溢出 | 1440 / 768 / 390 | 浏览器截图 | continue |
| 第一阶段 | 自动化测试 | Node + 浏览器 smoke | 测试输出 | continue |
| 第一阶段 | 运行说明和验证记录 | README + docs | 文件检查 | continue |
