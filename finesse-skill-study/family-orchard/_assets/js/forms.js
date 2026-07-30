/* =====================================================
   forms.js — 表单提交（验证 + success banner）+ 电话输入过滤
   原 IIFE 3 + IIFE 5 合并
   Phase A · family-orchard 模块化重构
   注：原 banner.style.cssText 内联样式改为 .form-banner class
   ===================================================== */

function wire(formId, okText) {
  const form = document.getElementById(formId);
  if (!form) return;

  // 替代原 banner.style.cssText 内联样式（依赖 cta.css 中的 .form-banner）
  const banner = document.createElement('div');
  banner.className = 'form-banner';
  banner.textContent = okText;
  form.querySelector('.note').after(banner);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const required = form.querySelectorAll('[required]');
    for (let i = 0; i < required.length; i++) {
      if (!required[i].value.trim()) {
        required[i].focus();
        required[i].style.borderColor = '#C0453C';
        return;
      }
    }
    const btn = form.querySelector('.submit');
    const orig = btn.textContent;
    btn.textContent = '✓ 已收到';
    btn.classList.add('sent');
    btn.disabled = true;
    banner.classList.add('is-visible');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('sent');
      btn.disabled = false;
      banner.classList.remove('is-visible');
      form.reset();
      form.querySelectorAll('input').forEach(el => { el.style.borderColor = ''; });
    }, 5000);
  });
}

function wirePhoneFilter() {
  document.querySelectorAll('input[type=tel]').forEach(input => {
    input.addEventListener('input', () => {
      const v = input.value.replace(/\D/g, '').slice(0, 11);
      input.value = v;
    });
  });
}

export function initForms() {
  wire('formC', '已记录。预计 1 个工作日内短信回执具体发货时间。');
  wire('formB', '已转采供负责人。2 个工作日内电话回复。');
  wirePhoneFilter();
}