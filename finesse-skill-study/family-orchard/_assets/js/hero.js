/* =====================================================
   hero.js — 5 层 cinematic · 第 5 层（暖色聚光）跟随鼠标
   原 IIFE 1 提取
   Phase A · family-orchard 模块化重构
   ===================================================== */

export function initHero() {
  const stage = document.getElementById('heroStage');
  const spot = document.getElementById('heroSpot');
  if (!stage || !spot) return;

  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    // radial gradient that follows the cursor: transparent at the cursor → falls off
    spot.style.background =
      'radial-gradient(circle 360px at ' + x + 'px ' + y + 'px,' +
      'rgba(255, 240, 215, 0.18) 0%, rgba(255, 240, 215, 0.04) 45%, rgba(20, 16, 12, 0.12) 88%)';
    spot.style.opacity = '1';
    stage.classList.add('is-active');
  });

  stage.addEventListener('pointerleave', () => {
    spot.style.opacity = '0';
    stage.classList.remove('is-active');
  });
}