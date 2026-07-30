/* =====================================================
   photo-guide.js — 摄影指南展开/收起
   原 IIFE 9 提取
   Phase A · family-orchard 模块化重构
   ===================================================== */

export function initPhotoGuide() {
  const btn = document.getElementById('imgDisclosureMore');
  const guide = document.getElementById('photoGuide');
  if (!btn || !guide) return;
  btn.addEventListener('click', () => {
    const open = guide.hasAttribute('hidden');
    if (open) {
      guide.removeAttribute('hidden');
      btn.textContent = '收起摄影指南 ↑';
    } else {
      guide.setAttribute('hidden', '');
      btn.textContent = '查看摄影指南 →';
    }
  });
}