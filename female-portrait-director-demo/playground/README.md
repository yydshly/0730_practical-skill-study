# Playground · 测试场

> Female Portrait Director 的交互式测试工具，支持 **20 种风格**全部可测试、**MiniMax API 生图**、**提示词一键复制**。

## 🎯 功能

- ✅ **20 种风格全部可测试** - 涵盖 lifestyle / curve / fashion / fantasy / commercial / oriental / beauty / realism / cinematic 九大分类
- ✅ **MiniMax 生图 API 集成** - 支持中国版 (api.minimaxi.com) 和国际版 (api.minimax.io)
- ✅ **本地配置 API Key** - 通过 localStorage 保存，不上传到任何服务器
- ✅ **参数拼装器** - 10 个参数字段，自动根据风格路由拼接五段式提示词
- ✅ **一键复制提示词** - 正向 / 负面 / JSON 三种格式独立复制
- ✅ **历史记录** - 最近 20 次生成记录，可恢复参数
- ✅ **图片下载** - 直接下载生成的图片
- ✅ **5 种风格预设示例** - 快速加载常用参数

## 🚀 快速开始

### 1. 打开 Playground

```bash
# 在仓库根目录
cd f:/0730_vscode_claude_project
python -m http.server 8000

# 浏览器访问
# http://localhost:8000/female-portrait-director-demo/playground/
```

或者直接双击 [index.html](index.html) 打开（注意：直接打开时图片资源需走相对路径）。

### 2. 配置 API Key

1. 点击右上角 **设置** 按钮（齿轮图标）
2. 填入 **MiniMax API Key**（从 [MiniMax Platform](https://platform.minimaxi.com/user-center/basic-information/interface-key) 获取）
3. 选择 API Endpoint：
   - **中国版**：`https://api.minimaxi.com/v1/image_generation`
   - **国际版**：`https://api.minimax.io/v1/image_generation`
4. 点击 **测试连接** 验证 Key 有效性
5. 保存

### 3. 选择风格

在左侧边栏选择 20 种风格之一，每种风格都有：
- 风格分类标签
- 关键词
- 描述
- 参考示例图（如有）

### 4. 填写参数

最少需要填写：
- **场景方向** - 例如：午后安静的咖啡馆靠窗座位
- **服装方向** - 例如：米白针织开衫 + 浅色内搭

其他可选参数：
- 气质标签、五官方向、身形方向、画幅比例、镜头方向、光线氛围、滤镜效果、年龄特征、补充要求

可以点击 **加载示例** 快速填充预设参数。

### 5. 生成提示词

点击 **生成提示词** 按钮：
- 自动根据所选风格拼接五段式提示词（人物 / 动作 / 服装 / 场景 / 光线）
- 同时生成负面约束
- 显示完整 JSON 视图

可以切换三个 Tab：
- 正向提示词
- 负面约束
- 完整 JSON

### 6. 生成图片

点击右上角 **生成图片** 按钮：
- 调用 MiniMax API
- 显示生成的图片
- 支持下载和重新生成

## 📁 文件结构

```
playground/
├── index.html       # 主页面（含设置弹窗）
├── styles.js        # 20 种风格定义
├── prompts.js       # 提示词生成引擎（每种风格独立模板）
├── app.js           # 主应用逻辑
└── README.md        # 本文件
```

## 🎨 20 种风格

| ID | 名称 | 分类 |
|---|---|---|
| `clean-lifestyle` | 清纯生活照 | lifestyle |
| `pure-desire-curve` | 纯欲曲线生活照 | curve |
| `urban-fashion` | 都市时尚写真 | fashion |
| `gufeng-xianxia` | 古风仙侠美人图 | fantasy |
| `ecommerce-tryon` | 电商服装模特图 | commercial |
| `retro-hongkong` | 复古港风写真 | lifestyle |
| `french-lazy` | 法式慵懒写真 | lifestyle |
| `new-chinese` | 新中式东方写真 | oriental |
| `sporty-active` | 活力运动写真 | fashion |
| `travel-vacation` | 旅行假日写真 | lifestyle |
| `studio-retouched` | 影楼精修写真 | fashion |
| `oriental-voluptuous` | 东方丰腴写真 | curve |
| `cold-xianxia-enhanced` | 清冷仙气古风增强版 | fantasy |
| `bright-luxury-gufeng` | 明媚华贵古风增强版 | fantasy |
| `ultra-close-real-face` | 超近景真实人脸人像 | realism |
| `ancient-lady-dewy-makeup` | 古风贵女水光妆 | beauty |
| `black-pearl-dark-gold-ccd` | 黑珍珠墨金CCD曲线生活照 | curve |
| `soft-ccd-energetic-voluptuous` | 元气丰腴柔光CCD生活照 | curve |
| `cold-white-clear-ccd-curve` | 冷白清透CCD曲线生活照 | curve |
| `low-key-cinematic-photography` | 低调电影感摄影 | cinematic |

## 🔑 MiniMax API 信息

- **官方文档**: https://platform.minimaxi.com/docs/guides/image-generation
- **API Key 获取**: https://platform.minimaxi.com/user-center/basic-information/interface-key
- **Endpoint**: `POST https://api.minimaxi.com/v1/image_generation`
- **模型**: `image-01`
- **认证**: `Authorization: Bearer <API_KEY>`
- **请求参数**: `model`, `prompt`, `aspect_ratio`, `response_format`, `n`, `seed`, `subject_reference`
- **支持的画幅**: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

## 💡 使用技巧

1. **快速测试**：点击 **加载示例** 自动填充该风格的预设参数
2. **测试不同 API**：支持中国版和国际版，海外用户可切换到国际版
3. **批量生成**：在设置中选择生成 1/2/4 张图
4. **历史回溯**：左侧历史记录可一键恢复参数
5. **复制到其他工具**：生成的 JSON 可直接复制到 ComfyUI / SD WebUI 等工具

## 🔒 隐私

- API Key 仅保存在浏览器 **localStorage**
- 不会上传到任何服务器
- 清除浏览器数据会清除 Key

## 📝 输出格式示例

以清纯生活照为例，生成的提示词为：

```
生成一张 3:4 竖幅、真实摄影质感的咖啡馆窗边生活照。画面中的人物是一位虚构、24-28 岁年轻成年东方女性，成年气质明确。她拥有柔和流畅的鹅蛋脸，眉形自然舒展，眼神干净温柔...

午后时分，她身处午后安静的咖啡馆靠窗座位，刚把翻到一半的书轻轻合上，手指仍停留在书页边缘，肩颈放松...

米白针织开衫 + 浅色内搭，材质柔软细腻，自然贴合肩线...

采用半身到大腿以上构图，平视略偏侧前方机位...

柔和窗光从侧前方落在脸侧、发丝和针织纹理上。整体采用真实电影生活剧照滤镜...
```

负面约束：

```
未成年感，幼态化，学生感，儿童化，网红整容脸，假面感，过度磨皮，僵硬摆拍...
```

---

*创建时间：2026-07-31*