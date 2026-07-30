/* =====================================================
   faq.js — FAQ accordion 展开/收起
   原 IIFE 7 提取
   Phase A · family-orchard 模块化重构
   ===================================================== */

export function initFaq() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq');
      const isOpen = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
    });
  });
}