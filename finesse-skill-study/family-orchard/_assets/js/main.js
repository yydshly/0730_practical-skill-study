/* =====================================================
   main.js — ES module 入口
   按依赖顺序初始化各模块（theme 必须在 nav 之前）
   Phase A · family-orchard 模块化重构
   ===================================================== */

import { initTheme }   from './theme.js';
import { initNav }     from './nav.js';
import { initHero }    from './hero.js';
import { initHeroRotation } from './hero-rotation.js';
import { initJournal } from './journal.js';
import { initForms }   from './forms.js';
import { initFaq }     from './faq.js';
import { initReveal }  from './reveal.js';
import { initPhotoGuide } from './photo-guide.js';
import { initToTop }   from './to-top.js';

// 初始化顺序：theme → nav（nav 依赖 theme 的事件）→ 其它可并行
initTheme();
initNav();
initHero();
initHeroRotation();
initJournal();
initForms();
initFaq();
initReveal();
initPhotoGuide();
initToTop();