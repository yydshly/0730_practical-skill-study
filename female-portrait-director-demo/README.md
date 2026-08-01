# 女性人像提示词导演 Demo

> 上游仓库 README：[English](https://github.com/liyue-aigc/female-portrait-director/blob/main/README.md) | [简体中文](https://github.com/liyue-aigc/female-portrait-director/blob/main/README_zh.md) | [日本語](https://github.com/liyue-aigc/female-portrait-director/blob/main/README_ja.md) | [한국어](https://github.com/liyue-aigc/female-portrait-director/blob/main/README_ko.md)

## 🎯 本目录是研究演示

本目录基于 [liyue-aigc/female-portrait-director](https://github.com/liyue-aigc/female-portrait-director) 进行研究和演示。

## 🌐 网页版演示

打开 **[index.html](index.html)** 查看完整的网页演示。

```bash
# 本地浏览（在仓库根目录）
python -m http.server 8000
# 浏览器访问 http://localhost:8000/female-portrait-director-demo/
```

或者直接双击 `index.html` 打开。

## 🧪 交互式 Playground（推荐）

打开 **[playground/index.html](playground/index.html)** 进入交互式测试场。

**特色功能：**
- ✅ **20 种风格全部可测试** - 不只是展示，可以实际生成
- ✅ **MiniMax 生图 API 集成** - 支持中国版 / 国际版，本地配置 API Key
- ✅ **提示词一键复制** - 正向 / 负面 / JSON 三种格式
- ✅ **5 种风格预设示例** - 快速加载常用参数
- ✅ **历史记录** - 最近 20 次生成可恢复参数
- ✅ **图片下载** - 生成的图片可直接下载

详见 [playground/README.md](playground/README.md)。

## 📋 演示内容

| 模块 | 内容 |
|---|---|
| **Hero 首屏** | 项目概览、核心数据（20 种风格、5 段式输出、1.2k Stars） |
| **20 种风格卡片** | 按 9 个分类展示所有已实现风格，可点击查看示例 |
| **导演式工作流** | 4 步流程：参数锁定 → 风格路由 → 导演设计 → 融合扩写 |
| **输出格式说明** | 参数锁定 / 导演式扩写 / 五段式提示词 / 负面约束 |
| **交互式示例** | 5 种风格的输入参数 + 生成提示词 + 负面约束 |
| **作品展示画廊** | 6 张示例图片 |
| **一键安装** | `npx skills add` 命令 |

## 📁 文件说明

- `index.html` - 网页版演示（45 KB）
- `DEMO.md` - 演示文档（Markdown 格式，含完整参数示例）
- `SKILL.md` - 上游 Skill 定义
- `assets/cases/` - 示例图片
- `skill/` - 20 种风格路由实现
- `examples/` - 输入/输出示例

## 🔗 上游资源

- **GitHub**: https://github.com/liyue-aigc/female-portrait-director
- **作者**: 李岳
- **版本**: FEMALE-PORTRAIT-DIRECTOR-V1.6
- **许可证**: MIT

## ✨ 核心能力

- **20 种已实现风格** - 涵盖 lifestyle / curve / fashion / fantasy / commercial / oriental / beauty / realism / cinematic 九大分类
- **导演式扩写** - 不是简单的关键词堆砌，而是将人物、服装、动作、空间、镜头、光线和滤镜融合为同一个可拍摄瞬间
- **五段式提示词** - 人物 → 动作 → 服装 → 场景 → 光线，分段职责明确
- **气质叠加系统** - 通过 Overlay 系统为 Route 叠加气质增强
- **参考图生成** - 支持身份保留的产品图生成

## 🚀 快速开始

```bash
# 一键安装
npx skills add https://github.com/liyue-aigc/female-portrait-director/tree/main/skills/female-portrait-director -g

# 更新
npx skills@latest update female-portrait-director -g -y
```

安装后在新会话中调用 `$female-portrait-director` 即可开始使用。