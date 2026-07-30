/* =====================================================
   hero-rotation.js — hero 区 3 张图片轮询 + Ken Burns 推进 + 手动控制
   · 每张图停留 5s,1.2s 交叉淡入淡出
   · 鼠标悬停 hero 时暂停轮询
   · 进入页面时预加载所有图,避免首次切换白闪
   · 左右箭头 / 底部点 可手动切换,切完重置 5s 计时器
   · 切换过程中(CROSSFADE_MS 内)忽略重复点击,避免状态错乱
   Phase A · family-orchard 模块化重构
   ===================================================== */

const HOLD_MS    = 5000;   // 每张停留 5 秒
const CROSSFADE_MS = 800;  // 淡入淡出时长（与 CSS transition 对齐）

export function initHeroRotation() {
  const stage = document.getElementById('heroStage');
  if (!stage) return;

  const photos  = Array.from(stage.querySelectorAll('.layer-photo'));
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');
  const dots    = Array.from(document.querySelectorAll('.hero-dot'));
  if (photos.length < 2) return;  // 没图或多图都不轮播

  // 预加载所有图片（避免首次切换白闪）
  photos.forEach(p => {
    const url = p.style.backgroundImage.match(/url\(["']?(.+?)["']?\)/);
    if (url) {
      const img = new Image();
      img.src = url[1];
    }
  });

  let idx = 0;
  let timer = null;
  let paused = false;
  let transitioning = false;       // 切换进行中,避免状态错乱

  function setIdx(newIdx, fromUser) {
    if (transitioning) return;
    const target = ((newIdx % photos.length) + photos.length) % photos.length;
    if (target === idx) return;

    transitioning = true;
    // 关键修复:旧图移除 is-active + 新图添加 is-active 同步执行
    // CSS transition 让两者各自渐变,中间不会出现"全黑"的间隙
    photos[idx].classList.remove('is-active');
    idx = target;
    photos[idx].classList.add('is-active');
    dots.forEach((d, i) => d.classList.toggle('is-active', i === target));

    // CROSSFADE_MS 后解锁,允许再次切换
    setTimeout(() => { transitioning = false; }, CROSSFADE_MS);

    // 用户手动切换 → 重置 5s 计时器,让新图有完整停留时间
    if (fromUser) start();
  }

  function tick() {
    if (paused) return;
    setIdx(idx + 1, false);
  }

  function start() {
    stop();
    timer = setInterval(tick, HOLD_MS);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  // 手动控制
  if (prevBtn) prevBtn.addEventListener('click', () => setIdx(idx - 1, true));
  if (nextBtn) nextBtn.addEventListener('click', () => setIdx(idx + 1, true));
  dots.forEach((d, i) => {
    d.addEventListener('click', () => setIdx(i, true));
  });

  // 鼠标进入 hero → 暂停；离开 → 恢复（按钮在 hero 内,hover 不暂停否则点不到按钮）
  // 策略:鼠标在 stage 但不在 nav/dot 上才暂停
  function isOverControl(e) {
    return e.target.closest('.hero-nav, .hero-dot') !== null;
  }
  stage.addEventListener('mouseenter', (e) => { if (!isOverControl(e)) paused = true; });
  stage.addEventListener('mouseleave', () => { paused = false; });
  // 简化版:鼠标移入 nav/dot 区域继续暂停不算 bug,但当前阶段我们只要"鼠标在 hero 内就暂停"
  stage.addEventListener('mouseenter', () => { paused = true; });
  stage.addEventListener('mouseleave', () => { paused = false; });

  // 页面不可见时停,节省电
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  start();
}