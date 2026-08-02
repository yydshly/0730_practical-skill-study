# delphitools 子项目 GitHub Pages 展示设计

日期：2026-08-02

## 目标

让仓库外层 `README.md` 能清楚介绍 `delphitools-clone` 子项目，并提供推送后可直接访问的 GitHub Pages 展示链接。

## 方案

- 保持仓库现有 `master / (root)` GitHub Pages 发布方式，不调整其他子项目。
- 将 Vite 生产构建输出到 `delphitools-clone/site/`，使用相对静态资源路径。
- 线上构建使用哈希路由，例如 `#/capabilities` 和 `#/tools/qr-genny`，避免 GitHub Pages 对深层路由返回 404。
- 本地开发继续使用 `/`、`/capabilities`、`/tools/:id`，不改变当前开发与测试地址。
- 外层 README 增加项目简介、在线工具站、能力总览、参考网页和官方源码关系说明。

## 验收标准

- `npm.cmd test` 全部通过。
- `npm.cmd run build` 在 `delphitools-clone/site/` 生成可提交的静态文件。
- 构建产物不包含以 `/assets/` 开头的仓库根路径资源。
- 构建产物包含线上哈希导航入口。
- README 中的展示链接指向 `https://yydshly.github.io/0730_practical-skill-study/delphitools-clone/site/`。
- 本次提交不包含仓库内其他未跟踪文件。
