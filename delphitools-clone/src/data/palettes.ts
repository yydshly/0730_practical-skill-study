export type CuratedPalette = { id: string; name: string; colors: string[] };

export const CURATED_PALETTES: readonly CuratedPalette[] = [
  { id: 'sea-glass', name: '海玻璃', colors: ['#0f766e', '#14b8a6', '#99f6e4', '#f0fdfa'] },
  { id: 'sunset-paper', name: '落日纸张', colors: ['#7c2d12', '#ea580c', '#fdba74', '#fff7ed'] },
  { id: 'night-garden', name: '夜色花园', colors: ['#1e1b4b', '#4338ca', '#a78bfa', '#f5f3ff'] },
  { id: 'berry-milk', name: '莓果牛奶', colors: ['#9d174d', '#ec4899', '#fbcfe8', '#fff1f2'] },
];
