/* =====================================================
   theme.js — 浅/深主题切换 + localStorage 持久化
   原 IIFE 2 提取
   Phase A · family-orchard 模块化重构
   ===================================================== */

const KEY = 'shisui-theme';

function labelFor(theme) {
  return theme === 'dark' ? '深 / 浅' : '浅 / 深';
}

export function initTheme() {
  const root = document.documentElement;
  const btn = document.getElementById('themeBtn');
  if (!btn) return;

  // 初始化：读取 localStorage
  const saved = localStorage.getItem(KEY);
  if (saved === 'dark' || saved === 'light') {
    root.setAttribute('data-theme', saved);
    btn.textContent = labelFor(saved);
  }

  // 切换
  btn.addEventListener('click', () => {
    const cur = root.getAttribute('data-theme') || 'light';
    const next = cur === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    btn.textContent = labelFor(next);
    try { localStorage.setItem(KEY, next); } catch (e) {}

    // 触发自定义事件，nav.js 监听以同步 drawer 按钮
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
  });
}