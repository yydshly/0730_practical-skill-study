export type TailwindClassEntry = {
  className: string;
  category: string;
  description: string;
};

export const TAILWIND_CLASSES: readonly TailwindClassEntry[] = [
  { className: 'block', category: '布局', description: '将元素显示为块级元素。' },
  { className: 'hidden', category: '布局', description: '隐藏元素并移出布局。' },
  { className: 'flex', category: 'Flexbox', description: '创建弹性布局容器。' },
  { className: 'flex-col', category: 'Flexbox', description: '让弹性项目纵向排列。' },
  { className: 'items-center', category: 'Flexbox', description: '在交叉轴上居中项目。' },
  { className: 'justify-between', category: 'Flexbox', description: '在主轴上平均分配项目间距。' },
  { className: 'grid', category: 'Grid', description: '创建网格布局容器。' },
  { className: 'grid-cols-2', category: 'Grid', description: '创建两列等宽网格。' },
  { className: 'grid-cols-3', category: 'Grid', description: '创建三列等宽网格。' },
  { className: 'gap-4', category: '间距', description: '设置 1rem 的网格或弹性间距。' },
  { className: 'p-4', category: '间距', description: '设置四周 1rem 内边距。' },
  { className: 'px-6', category: '间距', description: '设置水平方向 1.5rem 内边距。' },
  { className: 'mt-8', category: '间距', description: '设置顶部 2rem 外边距。' },
  { className: 'w-full', category: '尺寸', description: '宽度占满父容器。' },
  { className: 'max-w-screen-lg', category: '尺寸', description: '最大宽度限制为 large 断点。' },
  { className: 'text-sm', category: '排版', description: '使用较小字号和对应行高。' },
  { className: 'text-center', category: '排版', description: '文本居中对齐。' },
  { className: 'font-bold', category: '排版', description: '使用 700 字重。' },
  { className: 'leading-relaxed', category: '排版', description: '使用较宽松的行高。' },
  { className: 'bg-slate-900', category: '颜色', description: '使用深色 Slate 背景。' },
  { className: 'text-white', category: '颜色', description: '将文字设为白色。' },
  { className: 'border', category: '边框', description: '添加默认宽度边框。' },
  { className: 'rounded-lg', category: '边框', description: '使用大圆角。' },
  { className: 'shadow-md', category: '效果', description: '添加中等阴影。' },
  { className: 'hover:bg-blue-700', category: '状态', description: '悬停时使用蓝色背景。' },
  { className: 'focus-visible:ring-2', category: '状态', description: '键盘聚焦时显示两像素焦点环。' },
  { className: 'md:grid-cols-3', category: '响应式', description: '中等屏幕起使用三列网格。' },
];
