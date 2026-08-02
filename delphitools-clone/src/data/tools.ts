import type { ToolDefinition, ToolId } from '../core/types';

const imageTools: readonly ToolDefinition[] = [
  { id: 'matte-generator', category: 'image', title: '方形衬底', englishTitle: 'Matte Generator', description: '将非正方形图片放入可设置背景色和边距的方形画布。', keywords: ['方形', '画布', '边距', '背景色'], workspace: 'image', mode: 'standard' },
  { id: 'scroll-generator', category: 'image', title: '无缝轮播拆分', englishTitle: 'Scroll Generator', description: '把长图拆成适合社交媒体连续轮播的图片。', keywords: ['长图', '轮播', '社交媒体', '拆分'], workspace: 'image', mode: 'standard' },
  { id: 'social-cropper', category: 'image', title: '社交媒体裁剪', englishTitle: 'Social Cropper', description: '按 Instagram、Bluesky 和 Threads 的常见比例裁剪图片。', keywords: ['裁剪', 'Instagram', 'Bluesky', 'Threads'], workspace: 'image', mode: 'standard' },
  { id: 'watermarker', category: 'image', title: '图片水印', englishTitle: 'Watermarker', description: '为图片添加可调位置、透明度和大小的文字或图片水印。', keywords: ['水印', '文字水印', '图片水印', '透明度'], workspace: 'image', mode: 'standard' },
  { id: 'artwork-enhancer', category: 'image', title: '艺术品增强', englishTitle: 'Artwork Enhancer', description: '调整图片对比度、饱和度、锐度与放大效果；彩色噪声纹理仍待补齐。', keywords: ['噪声', '纹理', '艺术品', '增强'], workspace: 'image', mode: 'standard' },
  { id: 'background-remover', category: 'image', title: '背景移除', englishTitle: 'Background Remover', description: '使用边缘连通与颜色容差生成透明背景，复杂背景和毛发效果有限。', keywords: ['抠图', '去背景', '透明 PNG', '本地处理'], workspace: 'advanced-media', mode: 'standard' },
  { id: 'favicon-genny', category: 'image', title: 'Favicon 生成器', englishTitle: 'Favicon Generator', description: '从图片生成常见尺寸的网站 Favicon 图标。', keywords: ['Favicon', '网站图标', 'ICO', '图标'], workspace: 'image', mode: 'standard' },
  { id: 'image-clipper', category: 'image', title: '透明边缘裁剪', englishTitle: 'Image Clipper', description: '自动裁掉 PNG 四周多余的透明边缘。', keywords: ['透明边缘', 'PNG', '裁边', '裁剪'], workspace: 'image', mode: 'standard' },
  { id: 'image-converter', category: 'image', title: '图片格式转换', englishTitle: 'Image Converter', description: '在浏览器支持范围内转换 PNG、JPEG 和 WebP；其他格式与尺寸调整仍待补齐。', keywords: ['格式转换', 'PNG', 'JPEG', 'WebP', '图片转换'], workspace: 'image', mode: 'standard' },
  { id: 'image-splitter', category: 'image', title: '图片分割', englishTitle: 'Image Splitter', description: '按行列或固定尺寸把图片切成多个小图。', keywords: ['分割', '切图', '行列', '尺寸'], workspace: 'image', mode: 'standard' },
  { id: 'image-stitcher', category: 'image', title: '图片拼接', englishTitle: 'Image Stitcher', description: '按方向、间距和顺序把多张图片拼成一张图。', keywords: ['拼接', '合并图片', '间距', '顺序'], workspace: 'image', mode: 'standard' },
  { id: 'image-tracer', category: 'image', title: '图片转 SVG', englishTitle: 'Image Tracer', description: '将简单栅格图像追踪为 SVG 路径。', keywords: ['SVG', '矢量化', '追踪', '栅格图'], workspace: 'advanced-media', mode: 'standard' },
  { id: 'paste-image', category: 'image', title: '剪贴板图片', englishTitle: 'Paste Image', description: '从系统剪贴板粘贴图片并下载。', keywords: ['剪贴板', '粘贴图片', '下载', '截图'], workspace: 'image', mode: 'standard' },
  { id: 'placeholder-genny', category: 'image', title: '占位图生成器', englishTitle: 'Placeholder Generator', description: '生成带尺寸、颜色和文字的占位图片。', keywords: ['占位图', '尺寸', '颜色', '文字'], workspace: 'image', mode: 'standard' },
  { id: 'svg-optimiser', category: 'image', title: 'SVG 优化器', englishTitle: 'SVG Optimiser', description: '清理无用属性、压缩并格式化 SVG 文件。', keywords: ['SVG', '矢量化', '压缩', '优化'], workspace: 'advanced-media', mode: 'standard' },
  { id: 'base64-image-encoder', category: 'image', title: '图片 Base64 编码', englishTitle: 'Base64 Image Encoder', description: '将图片转换为可嵌入 HTML 或 CSS 的 Base64 字符串。', keywords: ['Base64', '图片编码', 'HTML', 'CSS'], workspace: 'image', mode: 'standard' },
];

const editorTools: readonly ToolDefinition[] = [
  { id: 'editor', category: 'editor', title: 'Substrata 图片编辑器', englishTitle: 'Substrata Editor', description: '在画布中组合图片、文字和基础形状，并管理图层与导出 PNG。', keywords: ['编辑器', '画布', '图层', '标注', 'Substrata'], workspace: 'editor', mode: 'canvas' },
];

const colorTools: readonly ToolDefinition[] = [
  { id: 'colorblind-sim', category: 'color', title: '色盲模拟器', englishTitle: 'Colorblind Simulator', description: '模拟不同色觉条件下的颜色显示效果。', keywords: ['色盲', '色觉', '模拟', '无障碍'], workspace: 'color', mode: 'standard' },
  { id: 'colour-converter', category: 'color', title: '颜色格式转换', englishTitle: 'Colour Converter', description: '在 HEX、RGB 和 HSL 三种颜色格式之间转换。', keywords: ['HEX', 'RGB', 'HSL', '颜色转换'], workspace: 'color', mode: 'standard' },
  { id: 'contrast-checker', category: 'color', title: '对比度检查', englishTitle: 'Contrast Checker', description: '计算前景色与背景色的对比度并给出 WCAG 等级。', keywords: ['对比度', 'WCAG', '无障碍', '前景色'], workspace: 'color', mode: 'standard' },
  { id: 'gradient-genny', category: 'color', title: '渐变生成器', englishTitle: 'Gradient Generator', description: '生成基础双色渐变并复制 CSS。', keywords: ['渐变', 'CSS', '线性渐变', '网格渐变'], workspace: 'color', mode: 'standard' },
  { id: 'harmony-genny', category: 'color', title: '配色和谐生成器', englishTitle: 'Harmony Generator', description: '根据基准色生成互补、类似和三角色等配色。', keywords: ['配色', '互补色', '类似色', '三角色'], workspace: 'color', mode: 'standard' },
  { id: 'palette-collection', category: 'color', title: '调色板收藏', englishTitle: 'Palette Collection', description: '浏览、复制和收藏内置调色板。', keywords: ['调色板', '收藏', '颜色', '配色'], workspace: 'color', mode: 'standard' },
  { id: 'palette-extractor', category: 'color', title: '图片调色板提取', englishTitle: 'Palette Extractor', description: '从图片中提取主要颜色并生成调色板。', keywords: ['图片取色', '主色', '调色板', '提取'], workspace: 'color', mode: 'standard' },
  { id: 'palette-genny', category: 'color', title: '调色板生成器', englishTitle: 'Palette Generator', description: '生成可继续编辑的多色调色板。', keywords: ['调色板', '颜色生成', '多色', '配色'], workspace: 'color', mode: 'standard' },
  { id: 'pixel-picker', category: 'color', title: '像素取色器', englishTitle: 'Pixel Picker', description: '放大图片并精确采样像素颜色。', keywords: ['取色', '像素', '放大镜', '颜色'], workspace: 'color', mode: 'standard' },
  { id: 'tailwind-shades', category: 'color', title: 'Tailwind 色阶生成器', englishTitle: 'Tailwind Shades', description: '从基准色生成一组 Tailwind 风格色阶。', keywords: ['Tailwind', '色阶', '颜色', 'CSS'], workspace: 'color', mode: 'standard' },
];

const textTools: readonly ToolDefinition[] = [
  { id: 'doc-converter', category: 'text', title: '文档转换器', englishTitle: 'Document Converter', description: '在 Markdown、HTML、Word、LaTeX 和 EPUB 等格式间转换文档。', keywords: ['文档转换', 'Markdown', 'HTML', 'LaTeX', 'EPUB'], workspace: 'text', mode: 'standard' },
  { id: 'text-editor', category: 'text', title: 'Markdown 编辑器', englishTitle: 'Text Editor', description: '提供专注写作、预览和导出 Markdown 的能力。', keywords: ['Markdown', '编辑器', '预览', '导出'], workspace: 'text', mode: 'standard' },
  { id: 'font-explorer', category: 'text', title: '字体文件浏览器', englishTitle: 'Font Explorer', description: '查看字体文件的名称、家族、字重和表信息。', keywords: ['字体', '字重', '字族', '字体文件'], workspace: 'text', mode: 'standard' },
  { id: 'glyph-browser', category: 'text', title: 'Unicode 字符浏览器', englishTitle: 'Glyph Browser', description: '按区段查找、复制并查看 Unicode 字符编码。', keywords: ['Unicode', '字符', '字形', '编码'], workspace: 'text', mode: 'standard' },
  { id: 'large-type', category: 'text', title: '大字展示', englishTitle: 'Large Type', description: '将文本以适合展示的大字号呈现。', keywords: ['大字', '展示', '文本', '字号'], workspace: 'text', mode: 'standard' },
  { id: 'line-height-calc', category: 'text', title: '行高计算器', englishTitle: 'Line Height Calculator', description: '根据字号和排版比例计算推荐行高。', keywords: ['行高', '字号', '排版', '比例'], workspace: 'text', mode: 'standard' },
  { id: 'paper-sizes', category: 'text', title: '纸张尺寸查询', englishTitle: 'Paper Sizes', description: '查询当前内置的常见纸张规格。', keywords: ['纸张', 'A4', 'ISO', '印刷'], workspace: 'text', mode: 'standard' },
  { id: 'px-to-rem', category: 'text', title: 'PX 转 REM', englishTitle: 'PX to REM', description: '按根字体大小换算像素与 REM。', keywords: ['PX', 'REM', '像素', '根字体'], workspace: 'text', mode: 'standard' },
  { id: 'text-diff', category: 'text', title: '文本差异比较', englishTitle: 'Text Diff', description: '对比两段文本并高亮新增、删除和修改内容。', keywords: ['文本比较', '差异', '新增', '删除'], workspace: 'text', mode: 'standard' },
  { id: 'typo-calc', category: 'text', title: '排版单位计算器', englishTitle: 'Typography Calculator', description: '在常见排版单位之间进行换算。', keywords: ['排版', '单位', '字号', '换算'], workspace: 'text', mode: 'standard' },
  { id: 'word-counter', category: 'text', title: '字数统计', englishTitle: 'Word Counter', description: '统计文本的字数、字符数、行数和段落数。', keywords: ['字数', '字符数', '行数', '段落'], workspace: 'text', mode: 'standard' },
];

const printTools: readonly ToolDefinition[] = [
  { id: 'pdf-preflight', category: 'print', title: 'PDF 印刷预检', englishTitle: 'PDF Preflight', description: '分析 PDF 的页数、页面尺寸、方向和基础元数据。', keywords: ['PDF', '预检', '印刷', '字体'], workspace: 'print', mode: 'standard' },
  { id: 'imposer', category: 'print', title: 'PDF 拼版', englishTitle: 'Imposer', description: '生成小册子、骑马订和 N-up 拼版 PDF。', keywords: ['PDF', '拼版', '小册子', '骑马订'], workspace: 'print', mode: 'standard' },
  { id: 'zine-imposer', category: 'print', title: 'Zine 拼版', englishTitle: 'Zine Imposer', description: '生成 8 页单张小册子和折叠式 Zine 排版。', keywords: ['Zine', '拼版', '8 页', '折叠'], workspace: 'print', mode: 'standard' },
];

const developerTools: readonly ToolDefinition[] = [
  { id: 'code-genny', category: 'developer', title: '条形码生成器', englishTitle: 'Code Generator', description: '生成 Data Matrix、Aztec、PDF417、Code 128 和 EAN-13 等条码。', keywords: ['条形码', 'Data Matrix', 'Aztec', 'EAN-13'], workspace: 'developer', mode: 'standard' },
  { id: 'decoder', category: 'developer', title: '古典密码解码器', englishTitle: 'Decoder', description: '手动或自动识别并解码常见古典密码。', keywords: ['密码', '解码', '凯撒密码', '古典密码'], workspace: 'developer', mode: 'standard' },
  { id: 'meta-tag-genny', category: 'developer', title: 'Meta 标签生成器', englishTitle: 'Meta Tag Generator', description: '根据页面信息生成 HTML Meta 标签。', keywords: ['Meta', 'HTML', 'SEO', '网页'], workspace: 'developer', mode: 'standard' },
  { id: 'qr-genny', category: 'developer', title: '二维码生成器', englishTitle: 'QR Generator', description: '生成可自定义颜色、形状和 Logo 的二维码。', keywords: ['二维码', 'QR', 'Logo', '下载'], workspace: 'developer', mode: 'standard' },
  { id: 'regex-tester', category: 'developer', title: '正则表达式测试器', englishTitle: 'Regex Tester', description: '输入正则和样本文本，查看匹配结果。', keywords: ['正则', 'Regex', '匹配', '文本'], workspace: 'developer', mode: 'standard' },
  { id: 'tailwind-cheatsheet', category: 'developer', title: 'Tailwind 速查表', englishTitle: 'Tailwind Cheatsheet', description: '搜索当前内置的常用 Tailwind CSS 类名。', keywords: ['Tailwind', 'CSS', '类名', '速查表'], workspace: 'developer', mode: 'standard' },
  { id: 'markdown-writer', category: 'developer', title: '文本处理台', englishTitle: 'Markdown Writer', description: '格式化、清理和转换常见文本内容。', keywords: ['文本处理', '格式化', '清理', 'Markdown'], workspace: 'developer', mode: 'standard' },
];

const calculatorTools: readonly ToolDefinition[] = [
  { id: 'algebra-calc', category: 'calculator', title: '代数计算器', englishTitle: 'Algebra Calculator', description: '化简、因式分解、求解和求导代数表达式。', keywords: ['代数', '化简', '因式分解', '求导'], workspace: 'calculator', mode: 'standard' },
  { id: 'base-converter', category: 'calculator', title: '进制转换器', englishTitle: 'Base Converter', description: '转换十进制、十六进制、二进制和八进制。', keywords: ['进制', '二进制', '十六进制', '八进制'], workspace: 'developer', mode: 'standard' },
  { id: 'encoder', category: 'calculator', title: '编码工具', englishTitle: 'Encoder', description: '提供 Base64、URL 编码、解码和哈希生成。', keywords: ['Base64', 'URL 编码', '解码', '哈希'], workspace: 'developer', mode: 'standard' },
  { id: 'graph-calc', category: 'calculator', title: '函数绘图器', englishTitle: 'Graph Calculator', description: '输入数学函数并绘制曲线。', keywords: ['函数', '绘图', '曲线', '数学'], workspace: 'calculator', mode: 'standard' },
  { id: 'sci-calc', category: 'calculator', title: '科学计算器', englishTitle: 'Scientific Calculator', description: '支持三角函数、对数、幂和计算历史。', keywords: ['科学计算', '三角函数', '对数', '幂'], workspace: 'calculator', mode: 'standard' },
  { id: 'time-calc', category: 'calculator', title: '时间计算器', englishTitle: 'Time Calculator', description: '处理 Unix 时间戳、日期运算和时区换算。', keywords: ['时间戳', '日期', '时区', 'Unix'], workspace: 'calculator', mode: 'standard' },
  { id: 'unit-converter', category: 'calculator', title: '单位转换器', englishTitle: 'Unit Converter', description: '换算长度、重量、数据容量等常见单位。', keywords: ['单位', '长度', '重量', '数据容量'], workspace: 'calculator', mode: 'standard' },
];

const specialTools: readonly ToolDefinition[] = [
  { id: 'shavian-transliterator', category: 'special', title: 'Shavian 转写器', englishTitle: 'Shavian Transliterator', description: '使用有限字母规则近似转换英文文本，不等同于发音词典转写。', keywords: ['Shavian', '转写', '英文', '特殊文字'], workspace: 'special', mode: 'standard' },
];

export const TOOLS: readonly ToolDefinition[] = [
  ...imageTools,
  ...editorTools,
  ...colorTools,
  ...textTools,
  ...printTools,
  ...developerTools,
  ...calculatorTools,
  ...specialTools,
];

export function getToolById(id: ToolId): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.id === id);
}

export function searchTools(query: string): readonly ToolDefinition[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return TOOLS;
  }

  return TOOLS.filter((tool) =>
    [tool.title, tool.englishTitle, tool.description, ...tool.keywords].some((value) =>
      value.toLocaleLowerCase().includes(normalizedQuery),
    ),
  );
}
