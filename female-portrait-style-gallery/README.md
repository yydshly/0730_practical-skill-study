# Female Portrait Style Gallery

Female Portrait Director 的二十种人像风格样例展廊。项目使用原生 HTML、CSS 和 JavaScript 构建，不依赖后端、API Key、远程字体或运行时网络请求。

## 浏览项目

在当前目录启动任意静态文件服务器，例如：

```powershell
python -m http.server 43173
```

然后打开 `http://127.0.0.1:43173/`。

页面支持九类风格筛选、中文关键词搜索、空结果重置、键盘操作的详情弹窗，以及完整提示词复制。按 `/` 可以快速聚焦搜索框，按 `Esc` 可以退出详情。

## 目录结构

```text
female-portrait-style-gallery/
├─ assets/styles/       # 2:3 本地人像样例
├─ docs/evidence/       # 三种视口与详情弹窗的浏览器截图
├─ js/gallery.js        # 目录校验和筛选工具
├─ js/styles.js         # 二十种风格、参数与提示词
├─ js/main.js           # 页面渲染和交互
├─ tests/               # 数据单元测试与浏览器验收
├─ index.html
└─ styles.css
```

## 测试

```powershell
npm.cmd test
npm.cmd run test:browser
```

浏览器验收前需要在 `43173` 端口启动本地静态服务，并在本机安装 Python Playwright。验收覆盖 1440、768、390 三种视口，以及筛选、搜索、详情、复制、焦点返回、空状态和缺图反馈。

## 图片说明

样例图片通过当前 Codex 对话内置生图能力生成并保存为本地 PNG。图像路径和对应提示词均在 `js/styles.js` 中一一对应；未生成或加载失败的图片会显示带编号的明确占位，不会影响风格资料与页面操作。
