# Task 3：公共文件、剪贴板、结果和下载能力报告

## 范围

为 `delphitools-clone` 增加仅在浏览器本地运行的文件校验、读取、预览、剪贴板、下载与通用交互组件。未实现颜色、图片处理或其他领域引擎。

## RED / GREEN 记录

### RED

1. 先创建 `tests/files.test.ts` 和 `tests/file-components.test.tsx`，执行：

   ```powershell
   npm.cmd test -- tests/files.test.ts tests/file-components.test.tsx
   ```

   结果：失败。Vite 分别无法解析 `src/core/files` 和 `src/components/FileDropzone`，原因是所需模块尚未实现。

2. 为 MIME 为空时的文本通配扩展名回退新增测试后，按简报指定的单文件命令执行：

   ```powershell
   npm.cmd test -- tests/files.test.ts
   ```

   结果：失败（11 项中 1 项失败）。`note.TXT` 配合 `text/*` 被错误拒绝，错误为“请选择文本文件”。

### GREEN

实现最小的文本扩展名回退集合后，重新执行：

```powershell
npm.cmd test -- tests/files.test.ts
```

结果：通过，11/11。

随后执行公共能力与组件测试：

```powershell
npm.cmd test -- tests/files.test.ts tests/file-components.test.tsx
```

结果：通过，16/16。组件测试直接渲染 `FileDropzone` 与 `ResultPanel`，通过真实拖放、鼠标、键盘和结果操作验证可观察行为；仅对浏览器外部 API（Clipboard、对象 URL、锚点下载）使用边界夹具。

## 全套验证

执行：

```powershell
npm.cmd test -- --run
npm.cmd run build
```

最终复验结果：4 个测试文件、26/26 测试通过；生产构建也通过。全套测试覆盖原有应用壳与注册表测试，以及本任务新增的文件/组件测试。

## 文件

- 新建 `delphitools-clone/src/core/files.ts`：接受类型断言、FileReader 文本/Data URL 读取、临时对象 URL 图片加载与释放。
- 新建 `delphitools-clone/src/core/clipboard.ts`：优先 Clipboard API；仅在 API 不可用时使用并立即删除临时文本框；权限错误以中文可恢复错误传播。
- 新建 `delphitools-clone/src/core/download.ts`：Blob 下载、锚点清理、对象 URL 释放与中文可恢复错误传播。
- 新建 `delphitools-clone/src/components/FileDropzone.tsx`：点击、拖放、键盘激活、类型/大小校验和中文无障碍提示。
- 新建 `delphitools-clone/src/components/ResultPanel.tsx`：按 props 显示复制、下载、重置，并展示操作结果。
- 新建 `delphitools-clone/src/components/StatusMessage.tsx`：以文字和 ARIA role 明确表示空闲、处理中、成功、错误。
- 修改 `delphitools-clone/src/styles/components.css`：为上述通用组件增加样式，不依赖颜色作为唯一状态信号。
- 新建 `delphitools-clone/tests/files.test.ts` 与 `delphitools-clone/tests/file-components.test.tsx`：覆盖文件规则、读取、资源释放、错误传播和真实组件交互。

## 自检

- 文件校验覆盖精确 MIME、通配 MIME、仅 MIME 为空时的扩展名回退及中文拒绝消息。
- 无效文件（类型或大小不符）在 `onFiles` 前被阻止。
- `ResultPanel` 未收到对应 prop 时不会出现相应动作。
- 下载和图片预览创建的对象 URL 都在完成或出错时释放；当前通用组件不持有跨渲染的对象 URL，下载锚点立即移除。
- 剪贴板 API 存在但拒绝时不降级，以便调用方获得权限错误；不存在时才启用 textarea 回退。
- `git diff --check` 已执行且无空白错误；提交仅包含 Task 3 文件与本报告，不包含工作树里的无关未跟踪文件。

## 提交

提交信息：`feat: add local file and result pipeline`。
