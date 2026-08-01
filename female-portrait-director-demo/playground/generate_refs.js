// 生成 12 个 SVG 参考图
const fs = require('fs');
const path = require('path');

const stylesSvg = {
  'sporty-active': {
    colors: ['#FFE5B4', '#FF9966', '#FF6B6B'],
    icon: '🏃‍♀️',
    label: '活力运动'
  },
  'travel-vacation': {
    colors: ['#87CEEB', '#FFE4B5', '#F4E4BC'],
    icon: '✈️',
    label: '旅行假日'
  },
  'studio-retouched': {
    colors: ['#F5F5F5', '#E8E8E8', '#D8D8D8'],
    icon: '📸',
    label: '影楼精修'
  },
  'oriental-voluptuous': {
    colors: ['#2C1810', '#5C2E1F', '#8B4513'],
    icon: '🌸',
    label: '东方丰腴'
  },
  'cold-xianxia-enhanced': {
    colors: ['#0F1B3D', '#4A6FA5', '#B8D4E3'],
    icon: '❄️',
    label: '清冷仙气'
  },
  'bright-luxury-gufeng': {
    colors: ['#8B0000', '#DC143C', '#FFD700'],
    icon: '👑',
    label: '明媚华贵'
  },
  'ultra-close-real-face': {
    colors: ['#FAF0E6', '#F5DEB3', '#DEB887'],
    icon: '👤',
    label: '超近景'
  },
  'ancient-lady-dewy-makeup': {
    colors: ['#E6E6FA', '#DDA0DD', '#FFE4E1'],
    icon: '💧',
    label: '水光妆'
  },
  'black-pearl-dark-gold-ccd': {
    colors: ['#0A0A0A', '#2C1810', '#4A3B2A'],
    icon: '🌙',
    label: '黑珍珠墨金'
  },
  'soft-ccd-energetic-voluptuous': {
    colors: ['#FFE4B5', '#FFDAB9', '#FFC0CB'],
    icon: '☀️',
    label: '元气柔光'
  },
  'cold-white-clear-ccd-curve': {
    colors: ['#F0F8FF', '#E6E6FA', '#FFFFFF'],
    icon: '✨',
    label: '冷白清透'
  },
  'low-key-cinematic-photography': {
    colors: ['#0A0A0A', '#1C1C1C', '#2C2416'],
    icon: '🎬',
    label: '低调电影感'
  }
};

const filenames = {
  'sporty-active': '07-sporty-active.svg',
  'travel-vacation': '08-travel-vacation.svg',
  'studio-retouched': '09-studio-retouched.svg',
  'oriental-voluptuous': '10-oriental-voluptuous.svg',
  'cold-xianxia-enhanced': '11-cold-xianxia.svg',
  'bright-luxury-gufeng': '12-bright-luxury-gufeng.svg',
  'ultra-close-real-face': '13-ultra-close-face.svg',
  'ancient-lady-dewy-makeup': '14-dewy-makeup.svg',
  'black-pearl-dark-gold-ccd': '15-black-pearl-ccd.svg',
  'soft-ccd-energetic-voluptuous': '16-soft-ccd.svg',
  'cold-white-clear-ccd-curve': '17-cold-white-ccd.svg',
  'low-key-cinematic-photography': '18-low-key-cinematic.svg'
};

const outDir = 'assets/cases';

let count = 0;
for (const [styleId, cfg] of Object.entries(stylesSvg)) {
  const [c1, c2, c3] = cfg.colors;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="50%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="400" fill="url(#bg)"/>
  <circle cx="150" cy="180" r="80" fill="rgba(255,255,255,0.1)"/>
  <circle cx="150" cy="180" r="60" fill="rgba(255,255,255,0.15)"/>
  <text x="150" y="205" font-size="80" text-anchor="middle">${cfg.icon}</text>
  <text x="150" y="330" font-family="Georgia, serif" font-size="22" text-anchor="middle" fill="white" font-weight="600">${cfg.label}</text>
  <text x="150" y="358" font-family="monospace" font-size="10" text-anchor="middle" fill="rgba(255,255,255,0.7)">${styleId}</text>
  <text x="150" y="45" font-family="Georgia, serif" font-size="11" text-anchor="middle" fill="rgba(255,255,255,0.5)" letter-spacing="2">FEMALE PORTRAIT DIRECTOR</text>
  <rect x="20" y="380" width="260" height="2" fill="rgba(255,255,255,0.3)"/>
</svg>`;

  const fname = path.join(outDir, filenames[styleId]);
  fs.writeFileSync(fname, svg, 'utf8');
  console.log(`Created: ${fname}`);
  count++;
}

console.log(`\nTotal: ${count} SVG reference images generated`);