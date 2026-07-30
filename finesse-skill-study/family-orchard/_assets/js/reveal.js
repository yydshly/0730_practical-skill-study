/* =====================================================
   reveal.js — 滚动 reveal 动画（IntersectionObserver）
   原 IIFE 4 提取
   Phase A · family-orchard 模块化重构
   ===================================================== */

export function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    // 不支持 IO 时,直接显示全部
    els.forEach(e => e.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(e => io.observe(e));
}