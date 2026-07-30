/* =====================================================
   nav.js — 移动端抽屉菜单（open/close/Escape）+ drawer theme 同步
   原 IIFE 8 提取
   Phase A · family-orchard 模块化重构
   ===================================================== */

import { initTheme } from './theme.js';

function syncDrawerLabel(drawerTheme, theme) {
  drawerTheme.textContent = theme === 'dark' ? '深 / 浅' : '浅 / 深';
}

export function initNav() {
  const ham = document.getElementById('hamburgerBtn');
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const drawerTheme = document.getElementById('drawerTheme');
  if (!ham || !drawer || !backdrop) return;

  function open() {
    drawer.classList.add('is-open');
    backdrop.classList.add('is-open');
    ham.classList.add('is-open');
    ham.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    ham.classList.remove('is-open');
    ham.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  ham.addEventListener('click', () => {
    drawer.classList.contains('is-open') ? close() : open();
  });
  backdrop.addEventListener('click', close);
  drawer.querySelectorAll('[data-drawer-link]').forEach(a => {
    a.addEventListener('click', close);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
  });

  // drawer 主题按钮 → 委托给 themeBtn
  if (drawerTheme) {
    drawerTheme.addEventListener('click', () => {
      document.getElementById('themeBtn').click();
    });
    // 初始同步 + 监听 themechange 事件
    const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
    syncDrawerLabel(drawerTheme, initialTheme);
    document.addEventListener('themechange', (e) => {
      syncDrawerLabel(drawerTheme, e.detail.theme);
    });
  }
}