# DelphiTools 中文本地工具箱

DelphiTools 是一个无需账号的浏览器工具箱，提供 56 个中文工具入口，覆盖图片、颜色、文字与排版、PDF 与印刷、开发编码、数学计算、特殊文字和 Substrata 图片编辑器。处理工作优先在当前浏览器页面完成；能力和限制详见 [功能覆盖矩阵](docs/FEATURES.md)。

## 环境要求

- Windows 10/11。
- Node.js `^20.19.0` 或 `>=22.12.0`（Vite 7 的最低要求，已在 `package.json` 声明）。
- 随 Node.js 安装的 npm。
- 支持现代 Canvas、Web Worker、Web Crypto、Clipboard API 的浏览器。剪贴板读取通常还要求浏览器授权和安全上下文。

## Windows 安装与启动

在 PowerShell 中进入项目目录：

```powershell
cd F:\0730_vscode_claude_project\delphitools-clone
npm.cmd ci
npm.cmd run dev
```

Vite 默认显示地址通常为 `http://localhost:5173/`；若 5173 端口被占用，终端会显示实际端口。固定验收地址请使用：

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 4173
```

固定地址为 `http://127.0.0.1:4173/`。

## 测试、构建与依赖审计

```powershell
# 全量自动化测试
npm.cmd test -- --run

# TypeScript 检查与生产构建；产物写入 dist
npm.cmd run build

# 查看当前依赖安全告警；不要盲目使用 --force
npm.cmd audit
```

需要预览构建产物时，可运行 `npx.cmd vite preview --host 127.0.0.1 --port 4173`，然后打开终端给出的地址。最终自动化、构建、依赖审计和真实浏览器记录见 [VALIDATION.md](docs/VALIDATION.md)。

## 隐私与本地处理

- 项目没有账号系统、自建后端、云端项目或数据库，也没有把用户文件上传到项目服务器的处理路径。
- 图片、文本、字体和 PDF 在浏览器内通过 TypeScript、Canvas、Web Worker 或前端库处理。背景移除是本地颜色距离与边缘连通算法，不下载模型，也不是 AI 人像抠图。
- 主题和调色板收藏写入浏览器 `localStorage`；编辑内容、导入文件和生成结果不会由应用持久保存，刷新或关闭页面后通常需要重新导入。
- 剪贴板图片读取由浏览器权限控制。下载通过本地 Blob/Object URL 触发；应用会在结果替换或组件卸载时回收相关 URL。
- `npm.cmd ci` 会从 npm 软件源下载项目依赖；这是安装依赖，不会上传用户在工具中处理的内容。

## 主要依赖

- React / React DOM：界面和状态管理。
- Vite / TypeScript：开发服务器、类型检查和生产构建。
- `qrcode`：本地生成二维码 SVG。
- `bwip-js`：本地生成 Code 128、EAN-13、Data Matrix、Aztec、PDF417 SVG。
- `pdf-lib`：本地读取、嵌入和生成 PDF。
- Vitest、Testing Library、jsdom：自动化测试。

依赖漏洞状态以当次 `npm.cmd audit` 输出为准。2026-08-02 最终锁文件审计为 0 项；后续升级依赖后仍应重新执行审计。

## 文档

- [56 工具功能与限制](docs/FEATURES.md)
- [自动化与浏览器验收](docs/VALIDATION.md)
- [架构、扩展与维护交接](docs/HANDOFF.md)
