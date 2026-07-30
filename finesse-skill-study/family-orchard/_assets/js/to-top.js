/* =====================================================
   to-top.js — 回顶浮动按钮（RAF 节流的滚动检测）
   原 IIFE 10 提取
   Phase A · family-orchard 模块化重构
   ===================================================== */

export function initToTop() {
  const btn = document.getElementById('toTop');
  if (!btn) return;

  function check() {
    btn.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.7);
  }

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  check();
  let raf = null;
  window.addEventListener('scroll', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { check(); raf = null; });
  }, { passive: true });
}