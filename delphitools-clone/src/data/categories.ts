import type { ToolCategoryDefinition } from '../core/types';

export const TOOL_CATEGORIES: readonly ToolCategoryDefinition[] = [
  { id: 'image', title: '图片与社交媒体', description: '处理图片、社交媒体素材和图像格式。' },
  { id: 'editor', title: 'Substrata 图片编辑器', description: '在独立画布中组合、标注和导出图片。' },
  { id: 'color', title: '颜色与视觉设计', description: '转换颜色、生成配色并检查视觉效果。' },
  { id: 'text', title: '文字、排版与字体', description: '编辑文字、查看字体并完成排版换算。' },
  { id: 'print', title: 'PDF 与印刷', description: '检查 PDF 并生成印刷拼版。' },
  { id: 'developer', title: '开发与编码', description: '生成代码、条码和开发辅助内容。' },
  { id: 'calculator', title: '数学与计算', description: '处理公式、单位、时间和常用计算。' },
  { id: 'special', title: '特殊文字', description: '转换和浏览特殊文字系统。' },
];
