(async () => {

/* =================== Example data (rich) =================== */
const EXAMPLES = [
  /* ====== Aether ====== */
  {
    file:'aether-cinematic-tech.html',
    name:'Aether',
    sub:'空间智能引擎 · Cinematic Tech',
    register:'brand', theme:'dark',
    persona:'Cinematic Tech',
    engine:'A · Three.js + GLSL',
    accent:'#22e3ff · #ff2d8e',
    paletteFamily:'Cinematic cool',
    fileSize:'340 lines · 8 sections',
    colorTokens:{
      'bg':'#050507',
      'env 青':'#22e3ff',
      'env 品红':'#ff2d8e',
      'env 电蓝':'#4d6bff',
      'env 白高光':'#ffffff',
      'ambient':'#1a1a22',
      'meta cyan':'#22e3ff',
      'meta magenta':'#ff3d8e',
      'meta violet':'#4d6bff'
    },
    layout:{
      'shell':'full-bleed canvas hero',
      'canvas':'fixed inset:0 z-index:0',
      'content':'z-index:5 layer',
      'headline':'clamp(56px,9vw,160px)',
      'section padding':'120px 52px',
      'max-width':'1280px',
      'body weight':'300 (light)',
      'heading weight':'800'
    },
    motion:{
      lib:'three.js + RoomEnvironment + UnrealBloomPass + EffectComposer',
      pattern:'漂浮金属球 + 旋转彩色点光，鼠标旋转，滚动下沉',
      easing:'linear rotation (engineered feel)',
      reduced:'冻结一帧 composed still frame'
    },
    craftMoves:[
      {title:'金属球 + 彩色环境贴图',
       detail:'PMREMGenerator 把彩色平面变成 envMap，让黑色金属球反射出大面积虹彩 — 不需要多个光源就把 "光感" 拉满',
       code:`const pmrem = new THREE.PMREMGenerator(renderer);
function makeColorEnv() {
  const es = new THREE.Scene();
  es.add(new RoomEnvironment());
  const panel = (hex, x, y, z, s, intensity) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(s, s),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(hex).multiplyScalar(intensity)
      }));
    m.position.set(x,y,z); m.lookAt(0,0,0); es.add(m);
  };
  panel('#22e3ff',  6,  3,  3, 7, 2.4); // 青
  panel('#ff2d8e', -6, -2,  4, 7, 2.4); // 品红
  panel('#4d6bff',  0,  5, -5, 7, 2.0); // 电蓝
  return es;
}
scene.environment = pmrem.fromScene(makeColorEnv(), 0.35).texture;

const blob = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1, 48),
  new THREE.MeshStandardMaterial({
    color: '#0c0c14', metalness: 1.0, roughness: 0.3, envMapIntensity: 1.6
  })
);
blob.scale.setScalar(2.0);`},
      {title:'GLSL 噪声位移顶点',
       detail:'在 onBeforeCompile 里注入 snoise 函数，球的顶点被时间驱动的噪声推动 → 表皮持续蠕动但球保持完整',
       code:`const NOISE = 'vec3 mod289(vec3 x){...}\\nfloat snoise(vec3 v){ ... return 42.0*dot(m*m, ...); }';
mat.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = { value: 0 };
  shader.vertexShader = 'uniform float uTime;\\n' + NOISE + shader.vertexShader.replace(
    '#include <begin_vertex>',
    '#include <begin_vertex>\\n     float n = snoise(normalize(position) * 1.5 + uTime * 0.26);\\n     transformed += normal * (n * 0.26);'
  );
};`},
      {title:'滚动下沉 + 鼠标旋转解耦',
       detail:'滚动只控制 sink / scale（动画变安静），鼠标旋转只控制 rotation.xy — 两个交互互不干扰',
       code:`addEventListener('scroll', () => {
  scrollY = window.scrollY / innerHeight;
});
function tick() {
  const sink = Math.min(scrollY, 1.5);
  blob.rotation.y = t * 0.12 + mouse.x * 0.45;
  blob.position.y = Math.sin(t * 0.8) * 0.1 - sink * 1.2;
  blob.scale.setScalar(2.0 - sink * 0.25);
}`}
    ],
    fullPrompt:`为一家 "空间智能" 公司构建 Aether 这类品牌英雄页。要求：

技术栈：three.js (CDN import map) + RoomEnvironment + UnrealBloomPass + EffectComposer。
页面布局：全屏固定 canvas 在 z-index:0，内容在 z-index:5。<section> padding 120px 52px · max-width 1280px · margin 0 auto。

设计 token：
- 背景深色 near-black，rgb(5,5,7)，绝不纯黑
- 主色 cyan #22e3ff，副色 magenta #ff2d8e，第三色 electric blue #4d6bff —— **不许用 AI 紫蓝渐变 glow**，这三个 hue 都是用来照亮金属球的反射
- ambient light #1a1a22，强度 1.0

字体：Inter 300/400/700 + Cormorant Garamond italic + JetBrains Mono。display heading clamp(56px,9vw,160px) weight 800 letter-spacing -.045em line-height .9。body 用 weight 300 形成对比张力。.label 用 11px uppercase letter-spacing .22em。

核心动效 — 必须实现这个：
1. PMREMGenerator + RoomEnvironment + 4 个彩色面板（青/品红/电蓝/白）→ IcosahedronGeometry(1,48) + MeshStandardMaterial(metalness=1.0, roughness=.3) 的反射环境
2. onBeforeCompile 注入 snoise GLSL 函数，让金属球顶点随时间位移（蠕动感）
3. UnrealBloomPass 参数 (strength=0.55, radius=0.42, threshold=0.80)
4. 鼠标控制 blob.rotation.y/x；滚动控制 blob 下沉 + 缩小；点光组旋转
5. 必须有 prefers-reduced-motion fallback：render 一帧后停止

内容结构（8 个 section）：顶部 hero headline · 三个 capability 卡（毫秒级延迟 / 实时构建 / 自适应）· data band（3 个统计数字）· CTA · footer。

关键反 slop：
- 不用 Tailwind/CSS 框架
- 不用任何紫色 / 蓝紫渐变按钮
- 内容 z-index 必须 5，canvas 必须 0
- 移动实现保留（dpr 自适应、相机 aspect）`
  },
  /* ====== Nova ====== */
  {
    file:'nova-brutal-typographic.html',
    name:'Nova',
    sub:'数字时装周 2026 · Brutal Typographic',
    register:'brand', theme:'light',
    persona:'Brutal Typographic',
    engine:'D · GSAP',
    accent:'#FF3B1D',
    paletteFamily:'Bone/black + hot red',
    fileSize:'220 lines · stock photos',
    colorTokens:{
      'bone (bg)':'#ECE7DC',
      'ink':'#14110D',
      'red accent':'#FF3B1D',
      'dim':'#8A8479',
      'card':'#14110D',
      'hairline':'rgba(255,255,255,.18)'
    },
    layout:{
      'shell':'full-width typographic',
      'display size':'clamp(80px,15vw,220px)',
      'tracking':'.11em (Anton)',
      'kicker':'14px uppercase .35em tracking',
      'section':'6 + 5 边距法则',
      'image aspect':'4/5 + 16/9 混合'
    },
    motion:{
      lib:'GSAP + ScrollTrigger',
      pattern:'photo grayscale → scroll-reveal → type effect hero',
      easing:'power3.out (.6s)',
      reduced:'冻结到完全显示状态'
    },
    craftMoves:[
      {title:'mix-blend-mode: difference 导航',
       detail:'导航字体颜色与背景反色叠加 — 移到暗照片上变白，移到亮背景上变骨色。1 行 CSS 制造品牌不可复制性',
       code:`/* 背景是骨色 #ECE7DC，图片是黑白摄影 */
nav {
  mix-blend-mode: difference;
  color: #fff;  /* 显示为骨色，因为 difference 在骨色上 = 白 */
}`},
      {title:'外描边 + 实心字 (outline + fill)',
       detail:'标题用 -webkit-text-stroke 做出空心骨架，再用 z-index + -1 重叠 solid 版本 — 即便一张图也营造"层叠打字机"感',
       code:`.outline {
  -webkit-text-stroke: 1.5px var(--ink);
  color: transparent;
  position: relative;
}
.outline::after {
  content: attr(data-text);
  position: absolute; inset: 0;
  color: var(--ink);
  z-index: -1;
}`},
      {title:'骨色卡片 (ink-over-bone)',
       detail:'黑色卡片背景 + 白色 hairline 边 + Anton 顶部编号 + 中文大标题 — 与骨色页面形成 "骨 vs 墨" 二元张力',
       code:`.ink-card {
  background: var(--ink);
  color: var(--bone);
  border: 1px solid rgba(255,255,255,.18);
  padding: 36px 32px;
}
.ink-card .num {
  font-family: 'Anton', sans-serif;
  font-size: 64px;
  color: var(--red);
  line-height: 1;
}`}
    ],
    fullPrompt:`为一家时装周活动构建 Nova 这类品牌页。要求：

定位：反 editorial-typographic（serif + 米色）+ 反 AI-purple-glow，强制走 brutal typographic 路线（这是 2026 saturated default 之外的 lane）。

技术栈：GSAP + ScrollTrigger。**不**用紫色 / **不**用渐变文字 / **不**用任何圆角卡片。

设计 token：
- 骨色背景 #ECE7DC（不是米色，不是 #F5F1EA，是更"石"一点的色调）
- ink #14110D（接近黑但不到 #000）
- 一个 hot red #FF3B1D 作唯一强调色
- dim #8A8479 作 hairline / muted

字体：Anton 400（display 厚度）+ Inter 400/500 + Cormorant Garamond italic 偶尔用。绝对不能用 Playfair / Cormorant / Instrument Serif 等 reflex serifs。

骨架：
- 顶部导航 position:fixed + mix-blend-mode:difference + color:#fff（在骨色上为白，移到照片上反转）
- 主标题 clamp(80px,15vw,220px) Anton，tracking .11em，颜色 var(--ink)
- 副标题 Cormorant italic，48px
- Hero 用真实 grayscale 摄影（Unsplash hotlink 1-2 张），filter:grayscale(1) contrast(1.06)
- 数据带：3 个黑底卡（var(--ink) bg），每个里面顶部一个红色 Anton 64px 数字编号，下面标题 + 描述

关键反 slop：
- 禁止任何圆角 — border-radius: 0
- 禁止任何阴影
- 禁止任何紫蓝渐变
- 禁止 eyebrow 标签 - 直接用大字体说话
- 一行字一行 em-dash 是禁止的（用句号、逗号、分号断句）

prefers-reduced-motion：冻结整个滚动揭示，所有 section 直接完全显示。`
  },
  /* ====== Offscreen ====== */
  {
    file:'offscreen-editorial.html',
    name:'Offscreen',
    sub:'影像季刊 · Issue 07 · Editorial Publication',
    register:'brand', theme:'light',
    persona:'Editorial Publication',
    engine:'D · GSAP scroll-reveal',
    accent:'#A8331F',
    paletteFamily:'Editorial light',
    fileSize:'183 lines · serif-led',
    colorTokens:{
      'paper':'#F4F1E9',
      'ink':'#1A1714',
      'dim':'#857F7',
      'rust accent':'#A8331F',
      'rule line':'rgba(26,23,20,.12)',
      'figure bg':'#1A1714'
    },
    layout:{
      'shell':'12-column editorial grid',
      'display':'clamp(56px,8.5vw,140px)',
      'body line-length':'60-72ch',
      'drop-cap':'5-line height, Playfair italic',
      'rules':'1px solid rgba(0,0,0,.07)',
      'figure column':'span 5 / 7 of 12'
    },
    motion:{
      lib:'GSAP + ScrollTrigger',
      pattern:'paragraph-stagger reveal · image crossfade',
      easing:'power3.out',
      reduced:'立即显示所有段落和图'
    },
    craftMoves:[
      {title:'首字下沉 (drop cap)',
       detail:`5 行高度的 Playfair Display italic 首字 — \"拉满\" 印刷感而非流媒体感`,
       code:`p.lede::first-letter {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-weight: 900;
  font-size: 6em;
  float: left;
  line-height: .85;
  margin: 8px 12px 0 -4px;
  color: var(--rust);
}`},
      {title:'灰度摄影 + hover 慢揭示颜色',
       detail:`所有图片 filter:grayscale(1) contrast(1.06)，hover 时 transition filter 3s 渐变到 0 — 用\"等待\"制造庄重感`,
       code:`figure img {
  filter: grayscale(1) contrast(1.06);
  transition: filter 3s ease-out;
}
figure:hover img {
  filter: grayscale(0) contrast(1);
}`},
      {title:'12 列 nested grid 配 rule-line',
       detail:`所有章节外层 12 列 grid，每张图用 grid-column: 3 / span 5，制造不对称的"杂志图位"`,
       code:`.editorial {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 24px;
}
.fig-half { grid-column: 3 / span 5; }
.fig-third { grid-column: 5 / span 4; }
.full-rule {
  border: 0;
  border-top: 1px solid rgba(26,23,20,.12);
  margin: 60px 0;
}`}
    ],
    fullPrompt:`为一家影像季刊构建 Offscreen 这种 Editorial Publication 页面。要求：

定位：真正的杂志 / 期刊 / 摄影集，而不是 \"看起来像杂志\" 的 SaaS。利用 Playfair Display + Spectral 的古典排印血统。

技术栈：GSAP + ScrollTrigger。

设计 token：
- paper #F4F1E9（不是纯米色，偏 ink 暖度）
- ink #1A1714（不是纯黑）
- 一个 rust 强调色 #A833F，整页只用这一个
- 规则线 rgba(26,23,20,.12) 1px —— 绝对不能用 #ccc / #ddd

字体：Playfair Display（display italic 强调）+ Spectral（body italic）+ Inter（说明文字与导航）。三种各司其职。

骨架：
- 顶部极简 nav（仅 Issue + Section 链接，无 logo 大字）
- 主标题 \"OFFSCREEN — 影像季刊 · Issue 07\" 三行排版
- 每段长文本带 drop-cap 首字
- 段落间用 1px solid rule 隔开，不用空白代替
- 所有图片 filter:grayscale(1) contrast(1.06)，hover 时 3s 内过渡到 color
- 图位永远非对称：grid-column 占 5/8 或 3/9 之类的不规则比例

内容结构：4 节（导演对话 / 暗房工艺 / 编辑评论 / 后续刊期预告），每节都是文字段落 + 大图 + 引用块。

关键反 slop：
- 不要 eyebrow (tiny uppercase tracking-wide label)
- 不要 playfair 作为 \"premium reflex\" —— 我们用 Spectral + italic 强调是真编辑
- 不要 hover 时弹个浮窗 —— 直接图片去灰

prefers-reduced-motion：所有 GSAP reveal 立即显示，过滤 transition 关闭。`
  },
  /* ====== Signal ====== */
  {
    file:'signal-phosphor-terminal.html',
    name:'Signal',
    sub:'量化交易引擎 · Phosphor Terminal',
    register:'brand', theme:'dark',
    persona:'Phosphor Terminal',
    engine:'B · Canvas 2D',
    accent:'#00DC50',
    paletteFamily:'Phosphor mono',
    fileSize:'389 lines · canvas-driven',
    colorTokens:{
      'bg':'#020806',
      'surface':'#060E0A',
      'ink':'#C8F0D8',
      'phosphor':'#00DC50',
      'border':'rgba(0,220,80,.1)',
      'scanline':'rgba(0,220,80,.05)'
    },
    layout:{
      'shell':'vertical stack with full-bleed canvas hero',
      'canvas':'fixed inset:0 z-index:0',
      'mono size':'clamp(20px,2.4vw,38px) (price)',
      'ticker height':'44px marquee',
      'clock':'JetBrains Mono 32px'
    },
    motion:{
      lib:'Canvas 2D loop + GSAP reveal',
      pattern:'live K-line 数据 ring buffer + 实时 ticker',
      easing:'canvas loop tick rate 60fps',
      reduced:'冻结 K-line 渲染到当前帧，停止 ticker marquee'
    },
    craftMoves:[
      {title:'实时 K-line canvas — trail fade 而非全清',
       detail:`每帧用半透明矩形覆盖而不 clearRect，价格点会留残影。给出真实"屏幕光感"',
       code:`function frame() {
  ctx.fillStyle = 'rgba(2,8,6,.15)';  // 与 bg 同色但半透，制造残影
  ctx.fillRect(0, 0, W, H);
  // 然后画新 K 线点
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = pad + i * (W - 2*pad) / (points.length - 1);
    const y = (H - pad) - (p.v - min) / range * (H - 2*pad);
    i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.strokeStyle = 'rgba(0,220,80,.85)';
  ctx.stroke();
  requestAnimationFrame(frame);
}`},
      {title:'CRT 扫描线 + 闪烁 (每 3px 一条)',
       detail:`三层叠加：背景、半透明扫描线、弱闪烁的\"磷光点\"`,
       code:`// 扫描线层
ctx.fillStyle = 'rgba(0,0,0,.08)';
for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

// 顶角微闪烁
ctx.fillStyle = Math.random() > .95 ? 'rgba(0,220,80,.04)' : 'transparent';
ctx.fillRect(W*.85, H*.1, 60, 20);`},
      {title:'实时 ticker 横向跑马灯',
       detail:`translateX 配合 setInterval，纯 CSS 实现，无需 GSAP`,
       code:`.ticker-track {
  display: flex; gap: 60px;
  animation: tickerScroll 40s linear infinite;
  white-space: nowrap;
}
@keyframes tickerScroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }  /* 复制一份以无缝循环 */
}
.tick-item { padding: 0 30px; }
.tick-up { color: #00DC50; }
.tick-dn { color: #FF5252; }`}
    ],
    fullPrompt:`为一家量化交易机构构建 Signal 这类品牌页。要求：

定位：反 "AI SaaS 紫色渐变 + Inter" 路线，强制走 Phosphor Terminal 单色美学 —— 这是 legal/合规友好的 finance 美学。

技术栈：原生 Canvas 2D + GSAP（仅用于滚动揭示），不引入其它框架。

设计 token：
- bg #020806（不是纯黑，绿调子）
- surface #060E0A（面板比 bg 略亮一档）
- 唯一强调色 phosphor green #00DC50
- ink #C8F0D8（带绿调的浅色文字）
- 网格 / hairline rgba(0,220,80,.1)
- 不用红绿作为通用色，绿是品牌，红仅作语义 down

字体：JetBrains Mono weight 300/400/500/700 + Inter 300/400/700。价格 / 时间戳 / 货币一律等宽。

骨架：
- 顶部 sticky bar：左侧 logo \"SIGNAL\" + 实时时钟（每秒更新，JetBrains Mono 32px）+ 状态灯
- Hero：全屏 canvas（z:0）+ 居中标题 \"SIGNAL — 量化交易引擎\" + 副标题 \"基于多周期动量因子的趋势跟踪\" + CTA
- Ticker 跑马灯（CSS animation，40s 循环，复制一份接龙）
- 3 节内容：策略 / 业绩 / 技术，每节用 .sec-label \"STRATEGY / 01\" 形式分节
- 策略用 α β γ 编号卡片
- 业绩用 .perf-val 大字 + .perf-label 小字 + .perf-sub 二级 metadata
- CTA 末屏 \"APPLY FOR ACCESS →\"

核心动效 — 必须实现：
1. Canvas K-line loop：每帧用 rgba(2,8,6,.15) 残影覆盖 → 画 ring buffer 中 80 个数据点 → scan-line 三像素一行
2. 实时时钟每秒 setInterval 重写 #livetime textContent
3. Ticker 用 CSS animation 跑马灯
4. reduced-motion：冻结 canvas 到当前帧，停 ticker

关键反 slop：
- 不要 \"AI 紫蓝渐变按钮\"——所有按钮都是 phosphor green outline + text
- 不要 \"图标 + 文字\" 的卡片——用 α β γ 等希腊字母编号
- 不要 \"材料感\" 阴影——完全靠 phosphor 色发光撑氛围

页面要\"感觉是给 1990s 量化交易人看的\"，不是\"给 Y Combinator 创业公司看的\"。`
  },
  /* ====== Studio Forma ====== */
  {
    file:'studio-quiet-luxury.html',
    name:'Studio Forma',
    sub:'空间建筑设计 · Quiet Luxury Minimal',
    register:'brand', theme:'light',
    persona:'Quiet Luxury Minimal',
    engine:'E · CSS-only',
    accent:'#2D5A3D',
    paletteFamily:'Quiet luxury light',
    fileSize:'432 lines · CSS-only hero',
    colorTokens:{
      'bg':'#EFEFED',
      'ink':'#141414',
      'muted':'#787878',
      'sage accent':'#2D5A3D',
      'rule':'rgba(20,20,20,.08)',
      'image bg':'#E5E2DA'
    },
    layout:{
      'shell':'typographic hero + project grid',
      'display':'clamp(64px,10vw,180px)',
      'raleway range':'wght 100-900 (7 weights!)',
      'section padding':'140px 60px (extra-generous)',
      'project grid':'repeat(auto-fit,minmax(380px,1fr))',
      'gutters':'80px'
    },
    motion:{
      lib:'纯 CSS —— 零 JS 库',
      pattern:'mouse-mask reveal · reveal-on-scroll (IntersectionObserver)',
      easing:'cubic-bezier(.4,0,.2,1)',
      reduced:'鼠标遮罩关闭，背景图直接显示'
    },
    craftMoves:[
      {title:'双层鼠标遮罩（CSS-only signature）',
       detail:`两个 absolute 层，下层是蓝图照片，上层用 radial-gradient mask 跟随鼠标位置揭示。零 JS 库，0 performance 成本`,
       code:`<div class="hero" id="hero">
  <div class="layer-day"></div>  <!-- base photo -->
  <div class="layer-night" id="nightLayer"></div>  <!-- overlay -->
</div>

.layer-day, .layer-night {
  position: absolute; inset: 0;
}
.layer-night {
  background: url(blueprint.jpg) center/cover;
  -webkit-mask: radial-gradient(circle 200px at -400px -400px, #000 40%, transparent 72%);
          mask: radial-gradient(circle 200px at -400px -400px, #000 40%, transparent 72%);
  backdrop-filter: brightness(2.5) blur(2px);
  will-change: mask;
}
addEventListener('pointermove', e => {
  const m = 'radial-gradient(circle 220px at ' + e.clientX + 'px ' + e.clientY + 'px, #000 40%, transparent 72%)';
  night.style.mask = m;
});`},
      {title:'Raleway 7 字重跨度(100-900)',
       detail:`一种字体承载所有角色：thin 100 用 hero 副标题, 400 项目描述, 800 标题, 900 加粗。所有张力来自一个字族，避免 mix-family 廉价感`,
       code:`@import url('https://fonts.googleapis.com/css2?family=Raleway:wght@100;200;300;400;600;800;900&display=swap');
body { font-family: 'Raleway', sans-serif; font-weight: 300; }
.hero-title-thin { font-weight: 100; letter-spacing: -.04em; }
.project-name { font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
.cta-bold { font-weight: 900; }`},
      {title:'4 个 section 顶部 \"sec-tag\" 编号',
       detail:`\"PHILOSOPHY / 01\" 灰色 11px uppercase tracking .2em —— 不是 eyebrow 而是\"章标\"，与 Sage 极简调性一致`,
       code:`.sec-tag {
  font-size: 11px; letter-spacing: .2em; text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 30px;
}
.philosophy-quote {
  font-family: 'Raleway', sans-serif;
  font-weight: 200;
  font-size: clamp(32px, 4.5vw, 64px);
  line-height: 1.2;
  letter-spacing: -.02em;
}`}
    ],
    fullPrompt:`为一家空间建筑设计工作室构建 Studio Forma 这种 Quiet Luxury Minimal 页面。要求：

定位：建筑 / 酒店 / 静奢 wellness 工作室的官网。绝不能走"米色黄铜"的 reflex 路线 —— 改走 sage + off-white 极简。

技术栈：**纯 CSS + 极少 vanilla JS**。不引入 GSAP / Lenis / Locomotive 等任何运动库。IntersectionObserver 已经够了。

设计 token：
- bg #EFEFED（不是米色 #F5F1EA，偏冷偏灰）
- ink #141414（不是 #000）
- muted #787878
- 强调色 sage #2D5A3D（深绿，不鲜亮）
- 规则线 rgba(20,20,20,.08)
- image placeholder #E5E2DA（照片前用这个填色块）

字体：**单字族跨字重**：Raleway 100/200/300/400/600/800/900 —— 这一种字体搞定所有角色。配 JetBrains Mono 给元数据。

骨架：
- 顶部 sticky 极简 nav：左侧品牌名（轻字重 300），中间 5 个无 hover 装饰的链接，右侧 GET IN TOUCH ↗ 单色描边按钮
- Hero：双层遮罩 = 两个 absolute div（base photo + overlay blueprint），mask 用 radial-gradient 跟随鼠标
- 主标题 \"FORMA\" 紧接一个超细 100 字重的中文 \"空间\" 跟随
- 下方跑马灯 SPATIAL DESIGN · INTERIOR ARCHITECTURE · ...
- 4 节内容：PHILOSOPHY / 01、SELECTED WORKS / 02、PROCESS / 03、CLIENTS MARQUEE
- 项目网格 repeat(auto-fit,minmax(380px,1fr))，gap 80px
- 工艺流程用数字 01/02/03/04 编号 + 200 字重章节标题 + 描述

核心动效：
1. **双层鼠标遮罩** —— 这是招牌，必须有。10 行 vanilla JS，0 行库代码
2. 极简 reveal stagger：IntersectionObserver entry 时 opacity 0→1 + translateY 24→0, cubic-bezier(.4,0,.2,1) .8s
3. Ticker 用 CSS animation

关键反 slop：
- 禁止任何边框圆角（border-radius: 0）
- 禁止任何阴影
- 禁止 emoji / icon font
- 禁止在首页放 contact form
- 禁止用 mix-blend / gradient text 等花哨技巧

prefers-reduced-motion：关闭鼠标遮罩（变成静态遮罩在 off-screen），滚动揭示立即显示。`
  },

  /* ====== Buildly ====== */
  {
    file:'buildly-growth-dashboard.html',
    name:'Buildly',
    sub:'AI Growth Intelligence · Growth dashboard (dark)',
    register:'product', theme:'dark',
    persona:'—',
    engine:'— (GSAP + SVG)',
    accent:'#ff6a2b',
    paletteFamily:'Amber Ops · dark',
    fileSize:'278 lines · self-contained',
    colorTokens:{
      'bg':'#08080a',
      'panel':'#141417',
      'panel-2':'#1a1a1e',
      'line':'rgba(255,255,255,.08)',
      'line-2':'rgba(255,255,255,.05)',
      'ink':'#f4f4f5',
      'ink-2':'#a1a1aa',
      'ink-3':'#6b6b73',
      'accent':'#ff6a2b',
      'accent-2':'#ff9152',
      'up':'#34d399',
      'down':'#f87171'
    },
    layout:{
      'shell':'canonical sidebar 240px + topbar 56px',
      'kpi row':'grid 5 列',
      'main padding':'20-22px 26-28px 40px',
      'card radius':'16px (--r)',
      'gap':'14-18px',
      'max-width':'none (absorbs full)'
    },
    motion:{
      lib:'GSAP 3 + ScrollTrigger (local ./lib/)',
      pattern:'reveal stagger + number roll-up + SVG draw-in',
      easing:'power3.out (.7s) + power2.out chart',
      reduced:'reveal 立即显示 + 数据立即填充 + chart 直接显示不动画'
    },
    craftMoves:[
      {title:'5 KPI 数字从 0 计数 GSAP roll-up',
       detail:`每个 KPI 用 data-to + data-dec + data-suffix 配置目标值和格式，GSAP onUpdate 实时格式化到 textContent`,
       code:`function rollNums() {
  document.querySelectorAll('.val[data-to]').forEach(el => {
    const to = parseFloat(el.dataset.to);
    const dec = +(el.dataset.dec || 0);
    const suf = el.dataset.suffix || '';
    const fmt = v => Math.round(v).toLocaleString() + suf;
    const o = { v: 0 };
    gsap.to(o, {
      v: to, duration: 1.4, ease: 'power2.out',
      onUpdate: () => el.textContent = fmt(o.v)
    });
  });
}
// HTML: <div class="val num" data-to="248320">0</div>
// HTML: <div class="val num" data-to="3.8" data-dec="1" data-suffix="%">0%</div>`},
      {title:'SVG 双折线 overlay (Sessions vs Conversion)',
       detail:`compute path 字符串 → stroke-dasharray = path 总长度 → 初始 dashoffset = 总长 → gsap.to(dashoffset, 0)`,
       code:`const svg = document.getElementById('chart');
const W=760, H=280, pad=8;
const [rev, con] = [[130,...], [120,...]];  // 数据
const X = i => pad + i * (W - pad*2) / (rev.length - 1);
const Y = v => H - pad - ((v - min) / (max - min)) * (H - pad*2 - 20);
const path = arr => arr.map((v, i) => (i ? 'L' : 'M') + X(i) + ' ' + Y(v)).join(' ');
const lineRev = document.getElementById('lr');
const len = lineRev.getTotalLength();
lineRev.style.strokeDasharray = len;
lineRev.style.strokeDashoffset = reduce ? 0 : len;
if (!reduce) {
  gsap.to([lr, lc], { strokeDashoffset: 0, duration: 1.6, ease: 'power2.out', stagger: .15 });
}`},
      {title:'Donut 多段 arc circumference 数学',
       detail:`三个并列 <circle>，每个 stroke-dasharray 设 \"arc C / 剩余\"；rotate(-90 + off*360) 让每段从 12 点起算`,
       code:`const C = 2 * Math.PI * 48;  // r=48
document.querySelectorAll('.arc').forEach(a => {
  const frac = parseFloat(a.dataset.frac);
  const off = parseFloat(a.dataset.offset || 0);
  a.setAttribute('transform', 'rotate(' + (-90 + off*360) + ' 60 60)');
  const len = frac * C - 3;  // -3 让段间留缝
  if (reduce) { a.style.strokeDasharray = len + ' ' + C; return; }
  a.style.strokeDasharray = '0 ' + C;
  gsap.to(a, { strokeDasharray: len + ' ' + C, duration: 1.1, delay: .3, ease: 'power2.out' });
});`}
    ],
    fullPrompt:`为一家名为 Buildly 的 AI Growth 产品构建这种 dashboard。要求：

定位：通用 SaaS dashboard，非任何具体行业专属——但**必须**避开 "\`#3B82F6\` blue + \`#22C55E\` green + \`#F97316\` orange" 通用三件套。本作选 Amber Ops dark — 暖橙色品牌 + 黄昏灰阶。

技术栈：vanilla JS + GSAP 3 + ScrollTrigger（必须 self-host 到 ./lib/，体积小）。不引入 Chart.js / ECharts / D3。

设计 token：
- bg #08080a（绝对不要用 #000 或 #0a0a0a 蓝调）
- panel #141417 / panel-2 #1a1a1e（暗面板向上变亮）
- hairline rgba(255,255,255,.08) 不用 #333
- ink #f4f4f5 / ink-2 #a1a1aa / ink-3 #6b6b73
- accent #ff6a2b（**禁用任何紫蓝**）
- accent-2 #ff9152（partner hue）
- up #34d399 / down #f87171

字体：Inter 单字族。tabular-nums 在所有数字上。

骨架：
- 经典 shell：左侧 240px 侧栏（logo + 团队名 + 8 项导航 + pro upsell 卡） + 右侧 56px topbar + main content 区域
- 顶栏：搜索框 + Add Data 主按钮 + 通知 + 用户 avatar
- hello 区：左\"Welcome back, [名]\" + 右 3 个工具按钮
- 5 个 KPI 瓦片（`repeat(5,1fr)`）：顶 icon chip + status chip (▲/▼%) → label → 大数字 → prev subtext
- 双图 grid-2：左 Sessions vs Conversion 双折线 + 24H/7D/30D/90D 切换，右 Traffic Sources donut + Strategy Simulator 滑块卡
- AI Recommendations 三列 + confidence 百分比
- Top Performing Products 表（数字右对齐，tabular-nums）+ status pill

核心动效（必须实现）：
1. reveal stagger: opacity 0→1 + y 18→0, ease:power3.out, stagger:.08, onStart 触发 rollNums
2. KPI roll-up: GSAP to v target, onUpdate 格式化
3. SVG 双折线: stroke-dashoffset 从 path 总长度 → 0, stagger .15s, 1.6s power2.out
4. 峰值圆点: scale 0→1 with back.out(2), delay 1.5s
5. Donut 3 段: 顺序 dasharray 0→len, stagger .15s

prefers-reduced-motion fallback（关键合规）：
- reveal 立即 opacity 1
- 数字立即 fmt(target)
- chart 直接显示不动画
- donut 直接显示最终 stroke-dasharray

关键反 slop：
- **不能**用蓝+绿+橙通用 triad
- **不能**有 hard border 1px solid #333（永远 alpha 边）
- **不能**用纯白 #fff 卡片
- **不能**硬编码 hex 在非 :root 变量（grep 防 `#3B82F6`）

数据：KPI 值用真实的 mock（如 Total Sessions 248320、▲ 18%），但加 footnote 标 "illustrative data" 不要假装是真产品。`
  },

  /* ====== Stakent ====== */
  {
    file:'stakent-monitoring-dashboard.html',
    name:'Pulsegrid',
    sub:'Infrastructure Monitoring · NOC dashboard (dark)',
    register:'product', theme:'dark',
    persona:'—',
    engine:'— (GSAP + SVG)',
    accent:'#a78bfa',
    paletteFamily:'Steel Cyan / Violet dark',
    fileSize:'304 lines · self-contained',
    colorTokens:{
      'bg':'#0a0a10',
      'panel':'#13131c',
      'panel-2':'#1a1a26',
      'line':'rgba(255,255,255,.07)',
      'line-2':'rgba(255,255,255,.045)',
      'ink':'#f5f4fb',
      'ink-2':'#a5a3b8',
      'ink-3':'#6b6980',
      'violet':'#a78bfa',
      'violet-2':'#8b5cf6',
      'violet-3':'#c4b5fd',
      'up':'#4ade80',
      'down':'#fb7185'
    },
    layout:{
      'shell':'canonical sidebar + topbar',
      'hero KV':'28-32px display font',
      'sparkline width':'60-120px inline',
      'card radius':'18px (--r)',
      'topbar':'56px'
    },
    motion:{
      lib:'GSAP + 自定义',
      pattern:'glowing sparklines (feGaussianBlur filter) + 自定义 slider',
      easing:'power2.out',
      reduced:'关掉所有 glow 滤镜的 blur 动画'
    },
    craftMoves:[
      {title:'SVG feGaussianBlur 滤镜制造 glowing sparklines',
       detail:`每个 sparkline 套一层 feGaussianBlur filter，原 stroke 再叠一遍——产生\"磷光描边\"。这个 chart-crafting.md 没写的隐藏 polish`,
       code:`<svg width="120" height="36">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <polyline filter="url(#glow)" stroke="var(--violet)" fill="none"
    points="..." vector-effect="non-scaling-stroke" stroke-width="1.6"/>
</svg>`},
      {title:'Premium 自定义 slider（旋钮 + 填充轨 + 标签）',
       detail:`input[type=range] 隐藏 native thumb，placeholder ::-webkit-slider-thumb 自定义——这是 NOC 仪表盘的灵魂',
       code:`input[type=range] {
  -webkit-appearance: none;
  height: 4px;
  background: linear-gradient(90deg, var(--violet) var(--v,50%), var(--line) var(--v,50%));
  border-radius: 999px;
}
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px; height: 16px;
  background: var(--ink);
  border: 3px solid var(--violet);
  border-radius: 999px;
  box-shadow: 0 0 0 3px rgba(167,139,250,.18);
  cursor: grab;
}`},
      {title:'监控指标条状\"live 状态条\"(白底进度)',
       detail:`进度条 height 8px + 灰底白 fill + 在 fill 上 margin label + 实时数值百分比 — 比 donut 更易读',
       code:'.sla-bar { display:flex; align-items:center; gap:8px; }
.sla-bar .track { flex:1; height:6px; background: var(--line-2); border-radius:999px; overflow:hidden; }
.sla-bar .fill { height:100%; background: var(--violet); border-radius:999px; transform-origin:left; transform:scaleX(0); transition: transform .8s cubic-bezier(.2,.8,.2,1); }
.sla-bar.on .fill { transform:scaleX(1); } /* 数字 % 存 dataset  */'}
    ],
    fullPrompt:`为一家 NOC（网络运营中心）监控产品构建这种夜间 dashboard。要求：

定位：基础设施监控 / 实时 SLO / 异常告警场景。比 Buildly 更\"工程感\"。

技术栈：vanilla JS + GSAP + SVG（手作，不引入 Chart.js）。SVG 自定义是这个 page 的灵魂。

设计 token：
- bg #0a0a10（不是 #000 或 #08080a；偏蓝灰）
- panel #13131c / panel-2 #1a1a26
- hairline rgba(255,255,255,.07)
- ink #f5f4fb / ink-2 #a5a3b8 / ink-3 #6b6980
- **强调色用 violet #a78bfa**（不是被禁的 AI 紫，亮度高 + chroma ≤ 0.23）
- 三个 violet 阶：a78bfa / 8b5cf6 / c4b5fd
- up #4ade80 / down #fb7185

字体：Inter + JetBrains Mono（数据 / 编号）。

骨架：
- 经典 shell（同 Buildly），但顶部 metric strip 4 个并列 KV（uptime / latency / incidents / spend）
- 中部大图：6 个 SLA-bar（live 状态条），每个有 6px 圆角白底进度 + 实时 % + 误差
- 下部：4 sparkline 卡（CPU/Mem/Net/Lat）—— **这就是签名招**
- 自定义 slider 组：threshold 调节器 + 实时反馈

核心动效（必须实现）：
1. SVG \`<filter id="glow">\` 用 feGaussianBlur(stdDeviation=2.5) 套 polyline
2. 自定义 range slider：input[type=range] + ::-webkit-slider-thumb 圆形金钮
3. Reveal stagger + counter roll-up（同 Buildly）

prefers-reduced-motion：移除 SVG filter（关闭 blur）、slider snap 立即到位。

关键反 slop：
- 不能用 AI 紫色 glow on dark（violet #a78bfa 是合规的——亮度高，chroma 在 0.18 以下）
- 不能用 hard border 1px #333
- 不能用纯 white card on dark（要用 panel #13131c）
- \"磷光 sparkline\" 是必须 —— 没有这个就不像 NOC 仪表盘

数据：所有数值带 .unm 或 \"mock\" 标记，这是数据集（不能假装是真实生产）。`
  },

  /* ====== Acru ====== */
  {
    file:'acru-financial-dashboard.html',
    name:'Acru',
    sub:'Team Productivity · Finance dashboard (light)',
    register:'product', theme:'light',
    persona:'—',
    engine:'— (vanilla JS + CSS)',
    accent:'#8bc34a',
    paletteFamily:'Sage Ledger · light',
    fileSize:'325 lines · self-contained',
    colorTokens:{
      'page':'#eef0ec',
      'card':'#ffffff',
      'ink-1':'#1a1c19',
      'ink-2':'#6b6f68',
      'ink-3':'#9a9e96',
      'line':'#e7e9e4',
      'line-2':'#eef0eb',
      'green':'#8bc34a',
      'green-d':'#6fa838',
      'lime':'#aee15a',
      'yellow':'#f2d63f',
      'orange2':'#f4a94b',
      'red':'#e56a5a'
    },
    layout:{
      'shell':'canonical sidebar 240px + topbar (light variant)',
      'page':'tinted off-white #eef0ec 不要纯 #f5f5f5',
      'card radius':'20px (--r)',
      'control radius':'14px (--r-sm)',
      'gap':'16-18px'
    },
    motion:{
      lib:'vanilla JS （不用 GSAP）',
      pattern:'CSS class toggle + requestAnimationFrame counter',
      easing:'cubic-bezier(.4,0,.2,1)',
      reduced:'立即显示所有数值'
    },
    craftMoves:[
      {title:'堆叠柱状图：height = value/max from zero baseline',
       detail:`**这是 dashboard 最高失败率点**。bar 必须从 0 开始（不裁切基线），height = v/max × 容器高度，**不能**全部顶到容器顶部',
       code:`/* Each col: outer flex, bar inside scaleY */
.col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}
.bar {
  width: 100%;
  max-width: 18px;
  /* height 由 JS 计算: v / max * 100% —— 必须从 0 基线起算 */
  background: linear-gradient(to top, var(--green), var(--lime));
  border-radius: 3px 3px 0 0;
}
.lab {
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--ink-3);
  margin-top: 4px;
}`},
      {title:'半环仪表数学 C × 270/360',
       detail:`用 circumference 数学做半环：dasharray = \"arcLen C\"，起点从 -135° (7 点位置)`,
       code:`const R = 54, arcLen = 2 * Math.PI * R * 270/360;  // 半环 270°
svg.setAttribute('transform', 'rotate(-135 60 60)');
const arc = document.getElementById('arc');
arc.style.strokeDasharray = reduce ? arcLen + ' ' + 2*Math.PI*R : '0 ' + 2*Math.PI*R;
if (!reduce) {
  gsap.to(arc, { strokeDasharray: arcLen + ' ' + 2*Math.PI*R, duration: 1.4, ease:'power2.out' });
}
/* 中央数字 + needle 从 -135 + pct*270° */`},
      {title:'Tooltip 按 chart container 定位，非 viewport',
       detail:`tooltip absolute 坐标用 chart's boundingClientRect 计算 —— viewport 坐标在 chart 不在页面原点时会错位`,
       code:`tooltip.addEventListener('mouseenter', e => {
  const bar = e.currentTarget;
  const barRect = bar.getBoundingClientRect();
  const chartRect = chart.getBoundingClientRect();
  tip.style.left = (barRect.left - chartRect.left + barRect.width/2 - tipW/2) + 'px';
  tip.style.top = (barRect.top - chartRect.top - tipH - 8) + 'px';
});`}
    ],
    fullPrompt:`为一家财务/团队生产力 SaaS 构建 Acru 这种 light-sidebar dashboard。要求：

定位：浅色调金融/团队生产力场景（非 SaaS 蓝），选用 Sage Ledger —— 浅鼠尾草灰底 + 鲜绿强调色。

技术栈：纯 vanilla JS + CSS。**不**用 GSAP / ScrollTrigger（page 是 light + 轻动效，完全原生够用）。

设计 token：
- page #eef0ec（不是 #f5f5f5 要 tinge 向 accent hue）
- card #ffffff
- ink-1 #1a1c19（深墨绿黑） / ink-2 #6b6f68 / ink-3 #9a9e96
- line #e7e9e4 / line-2 #eef0eb（**永不**用 #ccc）
- **green accent #8bc34a**（不是 SaaS 蓝）
- green-d #6fa838（深主按钮）
- lime #aee15a / yellow #f2d63f / orange #f4a94b / red #e56a5a（多层辅助）

字体：Inter 单字族，tabular-nums 在数字上。

骨架：
- 经典 shell（左 240 sidebar + topbar 56 + content）
- 顶部 metric strip（4 个并列 KP）
- 中段 grid-2：左堆叠柱状图（季度 + 3 层堆叠）+ 右 半环仪表（中央一个 78% 大数字 + needle）
- 下段 grid-3：1 个信用卡样式 widget + 2 个紧凑卡

核心动效（必须实现）：
1. 数字从 0 计数：用 requestAnimationFrame 而非 GSAP
2. 堆叠柱：height = v/max × 100%（从 0 基线，不是 v-min/max）
3. 半环仪表：circumference × 270/360 + rotate(-135) + needle -135+pct×270
4. hover tooltip：定位用 chart.getBoundingClientRect() 而非 viewport

prefers-reduced-motion：所有数字立即到目标，柱图与半环立即显示。

关键反 slop（**这是 chart 章节最常考题**）：
- **不能**所有柱子等高（height 必须由 v/max 计算）
- **不能**柱子顶到容器顶部（除非 v 等于 max）
- **不能**柱 ≤ 12 列（再多就改 line chart）
- **不能**柱太细 < gap（barcode 失败）
- **不能**无 x 轴 label

数字格式：Currency 右对齐 tabular-nums，Date 左对齐。`
  },

  /* ====== Pawcare ====== */
  {
    file:'pawcare-adaptive-health.html',
    name:'PawCare+',
    sub:'Pet Health Companion · Health app (floating)',
    register:'product', theme:'light',
    persona:'—',
    engine:'— (vanilla JS)',
    accent:'#1f8a86',
    paletteFamily:'Mint & Coral · light',
    fileSize:'505 lines · self-contained',
    colorTokens:{
      'page':'#e6e9df',
      'bg':'#f5f6f0',
      'card':'#ffffff',
      'ink-1':'#181a10',
      'ink-2':'#6a6f5f',
      'ink-3':'#a0a492',
      'accent':'#1f8a86',
      'accent-l':'#d7f0ee',
      'accent-d':'#0f5f5c',
      'coral':'#ef6b4d',
      'neutral':'#7b8064'
    },
    layout:{
      'shell':'floating rounded panel (整个 dashboard 是个 28px 圆角大卡)',
      'panel':'max-width 1380, margin 18px auto',
      'panel radius':'28px (--r-lg)',
      'panel shadow':'0 40px 90px -50px rgba(20,24,20,.35)',
      'inner layout':'grid 3-col (280/1fr/320) with hotspots'
    },
    motion:{
      lib:'vanilla JS + CSS',
      pattern:'hotspot 注解 staggered fade-in + ECG scaleY 0→1',
      easing:'cubic-bezier(.2,.8,.2,1)',
      reduced:'hotspot 立即显示，ECG 满波形'
    },
    craftMoves:[
      {title:'图片上的 hotspot 注解（percentage 定位）',
       detail:`hotspot div 绝对定位 top/left 用 percentage（不是 px），让热点在不同图片尺寸下都跟随。配 staggered 120-150ms 延迟逐个出现`,
       code:`.hero-img { position: relative; }
.hotspot {
  position: absolute;
  display: inline-flex; align-items: center; gap: 7px;
  background: rgba(21,23,14,.62);
  backdrop-filter: blur(6px);
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 11px; color: #fff;
  opacity: 0;
  animation: fadeIn .5s cubic-bezier(.2,.8,.2,1) forwards;
}
.hs-1 { top: 14%; left: 52%; animation-delay: 1.0s; }
.hs-2 { top: 44%; left: 16%; animation-delay: 1.2s; }
.hs-3 { top: 72%; left: 58%; animation-delay: 1.4s; }`},
      {title:'accent-picker + dark-mode toggle 互不依赖',
       detail:`这是 theming.md 的招牌——两个变量独立变化：data-accent 修改 --accent, data-mode 翻转整个 :root 字典。组合 = 4 个变体`,
       code:`/* 重音通过 [data-accent] 修改 */
[data-accent="coral"] { --accent: #ef6b4d; --accent-l: #fde3da; --accent-d: #a5451f; }
[data-accent="neutral"] { --accent: #7b8064; --accent-l: #eef0e2; --accent-d: #4f5440; }

/* 模式通过 [data-mode] 整 root */
[data-mode="dark"] { --bg: #181a10; --ink: #f4f4f5; --card: #23261c; ... }

/* JS 独立切换两者 */
document.querySelectorAll('[data-accent]').forEach(b => b.addEventListener('click', () => {
  document.body.dataset.accent = b.dataset.accent;
  document.body.dataset.mode = currentMode;  // 保持模式不变
}));`},
      {title:'ECG 波形 + scaleY 0→1 动画',
       detail:`手绘 SVG polyline 模拟心电图，配合 transform-origin bottom 的 scaleY 心电图 \"画线\" 效果`,
       code:`<svg class="ecg" viewBox="0 0 200 50">
  <polyline fill="none" stroke="var(--accent)" stroke-width="1.6"
    points="0,25 20,25 25,15 30,40 35,10 40,35 45,25 60,25 80,25 85,15 90,40 95,10 100,35 105,25 200,25"/>
</svg>

.ecg polyline {
  transform-origin: center;
  animation: ecgDraw 1.6s cubic-bezier(.2,.8,.2,1) 1s backwards;
}
@keyframes ecgDraw {
  from { transform: scaleY(0); opacity: 0; }
  to   { transform: scaleY(1); opacity: 1; }
}`}
    ],
    fullPrompt:`为一家宠物健康 App 构建 PawCare+ 这种浮动面板的健康 dashboard。要求：

定位：health / wellness app，浅色调 + sage 半浮起面板。**这是 product-ui.md §0.1 的"floating panel"形态**。

技术栈：vanilla JS + CSS。**不**用 GSAP（伪"flight 重量" = 反高频动效）。

设计 token（来自 Mint & Coral 集合）：
- page #e6e9df（页面是 tinted off-white，向 sage 偏）
- bg #f5f6f0（卡片浮起的 page 是淡 sage）
- card #ffffff（卡片白色）
- ink-1 #181a10 / ink-2 #6a6f5f / ink-3 #a0a492
- accent #1f8a86（teal 主重音） + accent-l #d7f0ee + accent-d #0f5f5c
- coral #ef6b4d（第二重音 / 警示）
- neutral #7b8064（备用）

字体：Inter + JetBrains Mono。

骨架（**floating panel 是关键**）：
- 整个 dashboard 是一个 <div class="panel"> 容器：max-width 1380 · margin 18px auto · padding 30px · border-radius 28px · background rgba(255,255,255,.96) · box-shadow 0 40px 90px -50px
- 顶栏：logo + 标签 + 4 个 tab 链接 + 搜索 + accent picker + 通知 + 用户
- hero img：占满宽的宠物照片，**3 个 hotspot pill 注解**叠加在身体特定位置（百分比定位）
- 三栏布局：左 280px 信息 / 中 1fr 日期 + 心率 / 右 320px appointments

核心动效：
1. hotspot pill background rgba(21,23,14,.62) backdrop-filter:blur(6px) · opacity 0 → 1 · staggered 120-150ms · delay 1-1.5s
2. ECG polyline scaleY 0→1 · 1.6s cubic-bezier(.2,.8,.2,1)
3. accent picker 切换 [data-accent] 属性，dark-mode 切换 [data-mode]，**两者独立**

关键反 slop：
- **不能** 边框硬 1px solid #ccc（用 line #eceee3 4% alpha 代替）
- **不能** 阴影纯黑 0,0,0（hue-matched shadow）
- **不能** eyebrow 顶部小标签
- hotspot pill 必须通过 rgba(0,0,0,.62) backdrop-filter 加 sm 玻璃感，而不是 box-shadow

prefers-reduced-motion：hotspot 立即全显示，ECG 满波形。`
  },

  /* ====== Nodeflux ====== */
  {
    file:'nodeflux-api-console.html',
    name:'Postline',
    sub:'Email Delivery Console · API console (re-themed)',
    register:'product', theme:'light',
    persona:'—',
    engine:'— (vanilla JS + GSAP)',
    accent:'#0d9488',
    paletteFamily:'Teal & Clay · light',
    fileSize:'404 lines · self-contained',
    colorTokens:{
      'page':'#e9e6dd',
      'bg':'#f6f4ef',
      'card':'#ffffff',
      'ink-1':'#191a19',
      'ink-2':'#5f6660',
      'ink-3':'#94998f',
      'accent':'#0d9488',
      'accent-d':'#0b7a70',
      'accent-l':'#ccfbf1',
      'accent-2':'#f59e0b',
      'accent-2-l':'#fef3c7',
      'black':'#161816'
    },
    layout:{
      'shell':'floating panel + TRUE bento',
      'bento cols':'2.15fr 1.7fr 1fr 1fr 1fr',
      'panel radius':'32px',
      'panel padding':'26px 30px 38px',
      'shadow':'0 40px 90px -50px rgba(20,24,20,.35)'
    },
    motion:{
      lib:'vanilla JS + GSAP',
      pattern:'staggered scale-in for concentric ring cluster + line/area draw-in',
      easing:'cubic-bezier(.2,.8,.2,1) + back.out',
      reduced:'同前，所有 scale/draw 直接最终态'
    },
    craftMoves:[
      {title:'真正的 bento grid 配方: 2.15fr 1.7fr 1fr 1fr 1fr',
       detail:`**不是** 6 个 1fr 均匀网格——宽度编码 importance。最左占 2.15fr 是 hero key-card，中间 1.7fr 是关键 metric，右 4 个 1fr 是 utility tile`,
       code:'.bento {
  display: grid;
  grid-template-columns: 2.15fr 1.7fr 1fr 1fr 1fr;
  gap: 18px;
  /* 顺序: hero | metric | stat | stat | stat */
}
.bento > .key-card {  /* 列 1 */
  background: linear-gradient(160deg, var(--black) 0%, var(--accent-d) 100%);
  color: #fff;
  grid-column: span 1;
}
.bento > .metrics-stack {  /* 列 2 */
  display: flex; flex-direction: column; gap: 18px;
}
.bento > .util-1, .util-2, .util-3, .util-4 { /* 列 3-6 */
  background: var(--card);
}'},
      {title:'Concentric ring cluster (嵌套 div 而非 arc)',
       detail:'用嵌套 div + decreasing opacity，比 donut 更易读 + 更能表达 hierarchical cumulative 数据',
       code:'.rings { position: relative; width: 160px; height: 160px; }
.ring {
  position: absolute;
  width: 160px; height: 160px;
  border-radius: 999px;
  display: grid; place-items: center;
  opacity: 0;
}
.ring:nth-child(1) {  /* outermost: 100% */
  width: 160px; height: 160px;
  background: var(--accent); opacity: .65;
  transform: scale(.4);
  animation: ringIn .8s cubic-bezier(.2,.8,.2,1) .1s forwards;
}
.ring:nth-child(2) { /* inner: 78% */
  width: 132px; height: 132px;
  inset: 14px;
  background: var(--accent-2); opacity: .65;
  animation-delay: .22s;
}
/* ... 嵌套 5 圈, 每层更小更深 */

@keyframes ringIn {
  from { transform: scale(.4); opacity: 0; }
  to   { transform: scale(1); opacity: .65; }
}'},
      {title:'Activity waveform (canvas trail fade)',
       detail:`64 个柱条用 canvas 画，每帧 rgba trail fade 实现流动感`,
       code:`const cv = canvas.getContext('2d');
function frame() {
  cv.fillStyle = 'rgba(246,244,239,.15)';  // 与 bg 同色但半透
  cv.fillRect(0, 0, w, h);
  // 更新最新柱条高度
  bars.shift();
  bars.push(Math.random() * .8 + .2);
  bars.forEach((v, i) => {
    const x = i * (w / bars.length);
    const y = h - v * h;
    cv.fillStyle = 'hsla(173, 80%, 38%, ' + (.4 + v * .5) + ')';
    cv.fillRect(x + 1, y, w/bars.length - 2, v * h);
  });
  requestAnimationFrame(frame);
}`}
    ],
    fullPrompt:`为一家邮件投递 API 构建 Postline 这种 console 类 dashboard。要求：

定位：API / 中后台产品，技术感强 + 信息层级清晰。**不是**通用 SaaS 灰蓝，选用 Teal & Clay —— 深 teal + 暖琥珀。

技术栈：vanilla JS + GSAP + 自定义 canvas。

设计 token（来自 Teal & Clay 集合）：
- page #e9e6dd（暖 page，偏 cream 但有热度）
- bg #f6f4ef（浮起 panel 的浅米色）
- card #ffffff
- ink #191a19 / ink-2 #5f6660 / ink-3 #94998f
- accent #0d9488（teal 品牌色） + accent-d #0b7a70 + accent-l #ccfbf1
- accent-2 #f59e0b（partner hue，琥珀） + accent-2-l #fef3c7
- black #161816（深 key-card 用）

字体：Inter + JetBrains Mono。

骨架（**bento + floating panel 的合体**）：
- 整个 <main> 在 <div class="panel"> 内（floating panel 同 PawCare）
- panel 内 grid 是真正的 bento: grid-template-columns: 2.15fr 1.7fr 1fr 1fr 1fr
- 列 1: 大深 key-card（API Key 区，黑底 + teal 渐变）
- 列 2: multi-stat stack（4 个堆叠的 stat）
- 列 3-5: utility tile 网格
- 列 6: activity 实时 waveform + latency sparkline

核心动效：
1. concentric ring cluster: 5 个嵌套 div，每层尺寸递减 14px，opacity 0→.65，staggered 120ms，scale .4→1, cubic-bezier(.2,.8,.2,1)
2. canvas waveform: trail fade rgba + 64 bar 实时滚动
3. latency sparkline: SVG stroke-dasharray draw-in，0.8s

prefers-reduced-motion：ring cluster 不 scale（直接最终态 + opacity 1），waveform 静止到最后一个截图，sparkline 直接显示最终 dashoffset。

关键反 slop：
- **不能**用 6 列 1fr（失去 bento 的灵魂）；必须用 2.15fr 1.7fr 1fr 1fr 1fr
- **不能**每张卡都长方形面积相等
- **不能**key-card 用纯色而非渐变
- **不能**紫色 / 蓝紫渐变
- concentric rings **不要**用 SVG <circle> dashoffset（用 div 嵌套）—— SVG 难读层级，div 更优`
  },

  /* ====== Inkline ====== */
  {
    file:'inkline-publishing-cms.html',
    name:'Helphub',
    sub:'Knowledge Base Console · Publishing CMS (re-themed)',
    register:'product', theme:'light',
    persona:'—',
    engine:'— (vanilla JS)',
    accent:'#6d28d9',
    paletteFamily:'Violet Console · light',
    fileSize:'375 lines · self-contained',
    colorTokens:{
      'page':'#e9e9ec',
      'card':'#ffffff',
      'ink-1':'#1b1b1d',
      'ink-2':'#616166',
      'ink-3':'#96969c',
      'line':'#e2e2e7',
      'line-2':'#ececef',
      'accent':'#6d28d9',
      'accent-2':'#f59e0b',
      'accent-soft':'#efe7fc',
      'green':'#16a34a',
      'amber-soft':'#fdf1dd'
    },
    layout:{
      'shell':'top-nav **triptych** 296px 1fr 320px',
      'align-items':'start (masonry)',
      'panel radius':'20px',
      'topbar height':'64px',
      'browse gap':'16px'
    },
    motion:{
      lib:'vanilla JS + GSAP',
      pattern:'staggered hotspot fade-in + line chart draw-in',
      easing:'cubic-bezier(.2,.8,.2,1) + power2.out',
      reduced:'hotspot 直接显示，chart 不动画'
    },
    craftMoves:[
      {title:'Triptych 网格: 296px 1fr 320px + align-items: start',
       detail:`**这是 product-ui.md §1 三列非对称的精确配方**。align-items: start 让三列内容独立高度（如 masonry），不用 flexbox',
       code:`.triptych {
  display: grid;
  grid-template-columns: 296px 1fr 320px;
  gap: 20px;
  align-items: start;  /* 关键！让三列高度独立 */
}
/* 左: 工具列表 (296) */
/* 中: 内容 / 数据图表 (1fr) */
/* 右: workspace / 提示 (320) */

/* mobile fallback */
@media (max-width: 980px) {
  .triptych { grid-template-columns: 1fr; }
}`},
      {title:'CSS 浏览器预览 mockup (圆角顶部 chrome)',
       detail:`制作一个假浏览器窗口：圆角顶部 + 三个彩色按钮 (模拟 macOS 红黄绿) + 中间是\"网页内容\"。**注意**：这是组件本体而非赝品截图',
       code:`.browser-mock {
  background: var(--card);
  border-radius: 14px 14px 8px 8px;
  overflow: hidden;
  box-shadow: 0 12px 40px -10px rgba(20,20,20,.15);
}
.browser-chrome {
  background: var(--panel-2);
  padding: 10px 14px;
  display: flex; align-items: center; gap: 8px;
}
.browser-chrome .dot {
  width: 11px; height: 11px; border-radius: 999px;
}
.browser-chrome .dot:nth-child(1) { background: #ff5f57; }
.browser-chrome .dot:nth-child(2) { background: #febc2e; }
.browser-chrome .dot:nth-child(3) { background: #28c840; }
.browser-body {
  padding: 24px;
  /* 这里面再放 hotspot */
}
.hotspot {
  position: absolute;
  /* percentage 定位 */
  animation: fadeUp .5s cubic-bezier(.2,.8,.2,1) backwards;
}
.hs-1 { top: 18%; left: 28%; animation-delay: .4s; }
.hs-2 { top: 52%; left: 64%; animation-delay: .52s; }
.hs-3 { top: 78%; left: 32%; animation-delay: .64s; }`},
      {title:'Top-nav (无侧栏) + 4 个 tab 链接',
       detail:`这种场景 IA 浅（≤5 节），用 pill nav 替代侧栏。顶部 sticky，链接按钮式 selected',
       code:`.topbar {
  display: flex; align-items: center;
  gap: 20px; padding: 16px 32px;
  border-bottom: 1px solid var(--line);
}
.tabs { display: flex; gap: 4px; }
.tab-link {
  padding: 8px 16px; border-radius: 999px;
  font-size: 13px; color: var(--ink-2);
  transition: .2s;
}
.tab-link.on {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}`}
    ],
    fullPrompt:`为一家知识库/内容发布控制台构建 Helphub 这种 triptych 形态。要求：

定位：内容平台 / publishing CMS / knowledge base —— 信息密度中等、需要"读"的页面。

技术栈：vanilla JS + GSAP（不引入 Chart 库；用 SVG 手作 line chart）。

设计 token（Violet Console 集合）：
- page #e9e9ec（冷灰色 page）
- card #ffffff
- ink-1 #1b1b1d / ink-2 #616166 / ink-3 #96969c
- line #e2e2e7 / line-2 #ececef
- accent #6d28d9（深紫罗兰，不是 AI 紫蓝 glow）
- accent-2 #f59e0b（琥珀 partner hue）
- accent-soft #efe7fc
- green #16a34a（用于 success）

字体：Inter + JetBrains Mono。

骨架（**核心：triptych**）：
- 顶部 sticky topbar: logo + brand line + 4 个 pill tabs + 搜索 + 通知 + avatar
- 主页 **triptych**：
  - 左 296px: 工具列表（章节索引、过滤器）
  - 中 1fr: 内容 / 数据图（line chart、weekly trend）
  - 右 320px: workspace 笔记 / 最近编辑
- **align-items: start**（关键，否则被最高列强制对齐）
- 一张**浏览器预览 mockup** 在中部——这是组件本体而非赝品截图：圆角 + 3 个 chrome dot + 内含 hotspot pin

核心动效：
1. line chart draw-in: SVG path stroke-dasharray 总长度 → 0
2. 浏览器 mockup 内 3 个 hotspot pin：percentage 定位 + staggered 120ms fade-up
3. reveal stagger on viewport

prefers-reduced-motion：所有 fade/draw 直接显示，无 hotspot 动画

关键反 slop：
- **不能** triptych 用 align-items: stretch（会强制对齐，毁掉 masonry 感）
- **不能** 浏览器 mockup 没有 chrome
- **不能** eyebrow 顶部小标签
- **不能** line chart 用 Chart.js / ECharts（手画以保灵魂）`
  },

  /* ====== Huddle ====== */
  {
    file:'huddle-team-workspace.html',
    name:'Skillhub',
    sub:'Course Learning Console · Team workspace (re-themed)',
    register:'product', theme:'light',
    persona:'—',
    engine:'— (vanilla JS)',
    accent:'#6c5ce7',
    paletteFamily:'Violet & Coral · light',
    fileSize:'340 lines · self-contained',
    colorTokens:{
      'page':'#eef1fb',
      'card':'#ffffff',
      'ink-1':'#1c1d2b',
      'ink-2':'#63647a',
      'ink-3':'#9797ac',
      'line':'#e7e9f6',
      'line-2':'#f0f1fa',
      'accent':'#6c5ce7',
      'accent-2':'#ff8b6b',
      'accent-soft':'#efeaff',
      'blue':'#5b8def',
      'blue-soft':'#e4edff',
      'coral-soft':'#ffe6da',
      'violet-soft':'#eae4fb',
      'up':'#2fb680',
      'down':'#f0616a'
    },
    layout:{
      'shell':'top-nav centered bento (no sidebar)',
      'bento':'repeat(auto-fit, minmax(280px, 1fr))',
      'gap':'18px',
      'card radius':'20px',
      'panel padding':'24px'
    },
    motion:{
      lib:'vanilla JS',
      pattern:'grouped bars 0→1 + chat bubble fade-in + voice waveform live',
      easing:'cubic-bezier(.4,0,.2,1)',
      reduced:'所有 bar/waveform 直接最终态'
    },
    craftMoves:[
      {title:'多弧段 donut 用 arc 累计 start angle',
       detail:`每个 segment rotate start angle 是前面所有段弧度之和（累加器），不是独立的 -90°',
       code:`function renderDonut(segments, cx, cy, r) {
  let acc = 0;  // 累加器
  const total = segments.reduce((a,s) => a + s.v, 0);
  const C = 2 * Math.PI * r;
  segments.forEach((s, i) => {
    const arc = (s.v / total) * C;
    const startAngle = -90 + acc * 360 / C;  // 累加！
    acc += s.v / total;
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"'
      + ' stroke="' + s.color + '" stroke-width="11" fill="none"'
      + ' stroke-linecap="butt" stroke-dasharray="' + arc + ' ' + C + '"'
      + ' transform="rotate(' + startAngle + ' ' + cx + ' ' + cy + ')"'
      + ' class="seg" data-final="' + arc + '"/>';
  }).join('');
}`},
      {title:'Voice waveform canvas 实时模拟 (16 柱随机)',
       detail:`模拟语音消息的实时波形。柱条高度随机，每帧 shift 一位并填充。这比静态柱更\"live\"',
       code:`const cv = canvas.getContext('2d');
const bars = new Array(16).fill(0).map(() => Math.random());
function frame() {
  cv.fillStyle = 'rgba(238,241,251,.4)';  // bg 同色 trail fade
  cv.fillRect(0, 0, w, h);
  bars.shift();
  bars.push(Math.random() * .8 + .2);
  bars.forEach((v, i) => {
    const x = i * (w / bars.length);
    const h2 = v * 18;
    cv.fillStyle = 'rgba(108,92,231,' + (.5 + v * .5) + ')';
    cv.fillRect(x + 1, h/2 - h2/2, w/bars.length - 2, h2);
  });
  requestAnimationFrame(frame);
}`},
      {title:'Chat bubbles 配不同 user avatar',
       detail:`聊天气泡内嵌 inline `,
       code:`.bubble {
  background: var(--card);
  border-radius: 16px;
  padding: 12px 14px;
  font-size: 13px;
  position: relative;
}
.bubble.me {
  background: var(--accent);
  color: #fff;
  margin-left: auto;
}
.bubble + .bubble { margin-top: 8px; }
.avatar {
  width: 30px; height: 30px;
  border-radius: 999px;
  background: var(--coral-soft);
  display: grid; place-items: center;
  font-size: 12px; font-weight: 600;
  color: var(--accent-2);
  flex-shrink: 0;
}`}
    ],
    fullPrompt:`为一家在线课程学习平台构建 Skillhub 这种 centered-bento 工作台。要求：

定位：team workspace / 在线学习 / 协作 —— **top-nav 没有侧栏**因为 IA 浅（≤5 节）。

技术栈：纯 vanilla JS（不引入 GSAP）。

设计 token（Violet & Coral 集合）：
- page #eef1fb（lilac 染色的 page，不是 #f5f5f5）
- card #ffffff
- ink #1c1d2b / ink-2 #63647a / ink-3 #9797ac
- accent #6c5ce7（深紫罗兰） + accent-soft #efeaff
- accent-2 #ff8b6b（coral partner hue） + coral-soft #ffe6da
- blue #5b8def + blue-soft #e4edff（用于 link / info chip）
- violet-soft #eae4fb（用于 stat）
- up #2fb680 / down #f0616a

字体：Inter + JetBrains Mono。

骨架（**centered bento, no sidebar**）：
- 顶部 sticky topbar: logo + 4 个 tab + 搜索 + 通知 + avatar
- 主区 bento: \`grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))\`
- 不对称内容：彩色 task card · multi-arc donut · grouped bar · leaderboard · chat bubbles · voice waveform

核心动效：
1. donut 多弧段：start angle 累加器管理（不要每个独立 -90°）
2. voice waveform：canvas 16 柱随机 + rgba trail fade
3. chat bubble 渐现
4. reveal stagger

prefers-reduced-motion：donut 直接最终 dasharray；voice waveform 静止到最后一帧；chat 直接显示

关键反 slop：
- centered bento 不能每张卡都长方形面积相等
- 不要用 SaaS 紫蓝（这是合规紫罗兰 #6c5ce7）
- chat 中不能用 emoji 头像替代（用 inline SVG avatar）`
  },

  /* ====== Ledgerio ====== */
  {
    file:'ledgerio-treasury-console.html',
    name:'Subhub',
    sub:'Subscription Analytics Console · Treasury (re-themed)',
    register:'product', theme:'light',
    persona:'—',
    engine:'— (vanilla JS + GSAP)',
    accent:'#5b3fd6',
    paletteFamily:'Mint & Lavender · light',
    fileSize:'437 lines · self-contained',
    colorTokens:{
      'page':'#dee2d4',
      'bg':'#eef1e6',
      'card':'#ffffff',
      'ink-1':'#161710',
      'ink-2':'#63665a',
      'ink-3':'#9a9c8e',
      'line':'#e7e9dd',
      'line-2':'#f0f2e7',
      'mint':'#b6f6c4',
      'mint-d':'#0f8a3e',
      'mint-ink':'#0c3d1f',
      'lav':'#cdc0f7',
      'lav-d':'#5b3fd6',
      'lav-ink':'#2b1c66',
      'black':'#15140f'
    },
    layout:{
      'shell':'floating panel + asymmetric bento 1fr 1.35fr',
      'panel radius':'32px',
      'panel padding':'30px 36px 44px',
      'bento gap':'20px',
      'detail width':'1.35fr（更宽的右列承载详情）'
    },
    motion:{
      lib:'vanilla JS + GSAP',
      pattern:'stacked bar grow + table mini-bar scaleX 0→1 + timeline dot in',
      easing:'cubic-bezier(.2,.8,.2,1) + power2.out',
      reduced:'所有 bar/table 直接最终态'
    },
    craftMoves:[
      {title:'表格里嵌动画 mini-bar (allocation table)',
       detail:`每个表格行最后一列放 8px 圆角进度条，transform: scaleX 0→1 动画。**这是 chart-crafting.md §6 招牌招** — 把表格转成\"半图半表\"',
       code:'.alloc-bar {
  height: 8px; border-radius: 999px;
  background: var(--line-2);
  overflow: hidden;
}
.alloc-bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--mint-d);
  transform-origin: left;
  transform: scaleX(0);
  transition: transform .8s cubic-bezier(.2,.8,.2,1);
}
.alloc-bar.is-in i { transform: scaleX(1); }
/* trigger via IO when table in view */'},
      {title:'不对称 bento 1fr 1.35fr（左详情型布局）',
       detail:`**不是** 2 个 1fr / 4 个 1fr，是 1fr 1.35fr——让右列承载详情，左列保留概要',
       code:`.asym-bento {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 20px;
}
.alloc-table {
  grid-column: 1 / 2;  /* 左: 概要表 */
}
.detail-stack {
  grid-column: 2 / 3;  /* 右: 详情（更宽）*/
  display: flex; flex-direction: column; gap: 20px;
}
@media (max-width: 980px) {
  .asym-bento { grid-template-columns: 1fr; }
}`},
      {title:'色块分隔卡片 (dark pulse · mint gauge · mint/lav price)',
       detail:'整个 page 用强饱和色块做卡片：深色 pulse（左 mint 进度）、mint 完整色 gauge、lav 紫色 price card——用\"色色相异\"区分卡片类型',
       code:`.pulse {
  background: var(--black);
  color: var(--mint);
  border-radius: 22px;
  padding: 24px;
  position: relative;
  overflow: hidden;
}
.pulse::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(280px 200px at 90% -10%, var(--mint-glow), transparent 60%);
  pointer-events: none;
}

.mint-price {
  background: var(--mint); color: var(--mint-ink);
}
.lav-cap {
  background: var(--lav); color: var(--lav-ink);
}
.pricecard .pval {
  font-size: 24px; font-weight: 800; letter-spacing: -.02em;
}`}
    ],
    fullPrompt:`为一家订阅分析 SaaS（重命名为 Subhub）构建这种不对称 bento 财务 console。要求：

定位：subscription analytics —— **不要**用 green-on-black 那套（被 Vercel / Supabase 占了），改用 Mint & Lavender —— 鲜薄荷 + 薰衣草紫。

技术栈：vanilla JS + GSAP。

设计 token（Mint & Lavender 集合）：
- page #dee2d4（sage 偏冷的 page）
- bg #eef1e6（floating panel 用）
- card #ffffff
- ink #161710 / ink-2 #63665a / ink-3 #9a9c8e
- mint #b6f6c4 / mint-d #0f8a3e / mint-ink #0c3d1f
- lav #cdc0f7 / lav-d #5b3fd6 / lav-ink #2b1c66
- black #15140f（深 key-card）

字体：Inter + JetBrains Mono。

骨架（**asymmetric bento 1fr 1.35fr**）：
- floating panel：max-width 1420px, margin 14px auto, padding 30 36 44, radius 32px
- 顶栏 + hero bar
- **asym-bento**：
  - 左 1fr: pulse key-card (黑底 mint 暗角 + radial glow) + multi-stat stack + allocation table
  - 右 1.35fr: mint-price card + lav-cap card + 4-3 split grid + forecast timeline

核心动效：
1. allocation table 内 mini-bar scaleX 0→1, staggered, cubic-bezier(.2,.8,.2,1), .8s
2. stacked bar column grow：height = total / max × 100%
3. forecast timeline 各 .on dot 渐入
4. reveal stagger 全局

prefers-reduced-motion：所有 scale/height 直接最终态；timeline 静态；table bar 满宽度。

关键反 slop：
- 不能用蓝绿通用三件套（用 mint + lavender）
- asymmetric 不能是 1fr 1fr（失去"右详左概"灵魂）
- mini-bar 必须 scaleX 而非 width transition（保证 transform-only 60fps）
- 不能用 eyebrow`
  }
];

/* =================== Card rendering =================== */
function card(ex){
  const isProduct = ex.register === 'product';
  const safeId = ex.file.replace(/[^a-z0-9]/gi,'-');
  const swatches = Object.entries(ex.colorTokens).slice(0,12).map(([k,v])=>{
    const isLight = isColorLight(v);
    return `<div class="swatch"><div class="swatch-color ${isLight?'dark-text':''}" style="background:${v}">${v}</div><div class="swatch-meta"><b>${k}</b>${v}</div></div>`;
  }).join('');
  const layoutCells = Object.entries(ex.layout).map(([k,v])=>
    `<div class="layout-cell"><label>${k}</label><b>${v}</b></div>`).join('');
  const codeSnippets = ex.craftMoves.map((m,i)=>`
    <div class="code-meta" style="margin-top:${i?'24px':'0'}"><b>招式 ${i+1} — ${m.title}</b><br>${m.detail}</div>
    <pre class="code-block">${highlightCode(m.code)}</pre>
  `).join('');
  const craftList = ex.craftMoves.map(m=>`<li style="padding:8px 0;border-bottom:1px dashed var(--border);font-size:13.5px;color:var(--ink-2);line-height:1.5"><b style="color:var(--ink-1)">${m.title}</b> — ${m.detail.split('。')[0]}。</li>`).join('');

  return `
    <article class="card" data-register="${ex.register}" data-theme="${ex.theme}" data-search="${(ex.file+' '+ex.name+' '+ex.sub+' '+ex.persona+' '+ex.engine+' '+(ex.craftMoves||[]).map(m=>m.title).join(' ')).toLowerCase()}" data-id="${safeId}">
      <div class="thumb">
        <div class="thumb-frame">
          <iframe data-src-iframe="skills/finesse-ui/examples/${ex.file}" loading="lazy" sandbox="allow-same-origin" scrolling="no" tabindex="-1"></iframe>
        </div>
        <div class="thumb-overlay">
          <span class="file">${ex.file}</span>
          <span class="extbadge">${isProduct ? 'PRODUCT' : 'BRAND'}</span>
        </div>
      </div>
      <div class="card-body">
        <span class="register-tag ${isProduct ? 'product' : ''}">${ex.register}</span>
        <h3 class="card-title">${ex.name}</h3>
        <div class="card-sub">${ex.sub}</div>
        <div class="meta-row">
          ${ex.persona && ex.persona !== '—' ? `<span class="meta-tag">${ex.persona}</span>` : ''}
          ${ex.engine && ex.engine !== '—' ? `<span class="meta-tag engine">${ex.engine}</span>` : ''}
          ${ex.accent ? `<span class="meta-tag acc">${ex.accent}</span>` : ''}
        </div>

        <div style="margin-top:6px">
          <b style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-1);font-weight:600;display:block;margin-bottom:6px">核心招式</b>
          <ul style="list-style:none;padding:0;margin:0">${craftList}</ul>
        </div>

        <div class="expand-row">
          <button class="expand-btn" data-target="${safeId}">
            <span class="label">展开详情 · AI 复刻 Prompt</span>
            <span class="chev">▼</span>
          </button>
          <a class="open-link" href="skills/finesse-ui/examples/${ex.file}" target="_blank" rel="noopener">在新标签打开 ↗</a>
        </div>
      </div>

      <div class="detail-panel" id="panel-${safeId}">
        <div class="tab-bar">
          <button class="tab is-on" data-tab="prompt-${safeId}" data-pane="pane-prompt-${safeId}">AI 复刻 Prompt</button>
          <button class="tab" data-tab="colors-${safeId}" data-pane="pane-colors-${safeId}">真实色板 (${Object.keys(ex.colorTokens).length})</button>
          <button class="tab" data-tab="layout-${safeId}" data-pane="pane-layout-${safeId}">布局参数 (${Object.keys(ex.layout).length})</button>
          <button class="tab" data-tab="code-${safeId}" data-pane="pane-code-${safeId}">核心代码 (${ex.craftMoves.length} 招)</button>
        </div>

        <div class="tab-content is-on" id="pane-prompt-${safeId}">
          <h5>AI 复刻 Prompt — 复制到 Claude/Codex</h5>
          <div class="prompt-text" id="prompt-${safeId}">${ex.fullPrompt}</div>
          <div class="copy-row">
            <span class="copy-hint">结构化指令 · 直接粘贴到任何 AI 编程助手</span>
            <button class="copy-btn" data-copy="prompt-${safeId}">📋 复制 Prompt</button>
          </div>
        </div>

        <div class="tab-content" id="pane-colors-${safeId}">
          <h5>真实 :root 设计 token</h5>
          <p style="font-size:13px;color:var(--ink-3);margin-bottom:16px">从源文件 \`:root\` 块提取的色值 —— 鼠标悬停色块复制 hex。</p>
          <div class="swatch-grid">${swatches}</div>
        </div>

        <div class="tab-content" id="pane-layout-${safeId}">
          <h5>关键布局参数</h5>
          <p style="font-size:13px;color:var(--ink-3);margin-bottom:16px">源文件量到的像素 / fr / em 值 —— 复制时按此输出 CSS。</p>
          <div class="layout-grid">${layoutCells}</div>
        </div>

        <div class="tab-content" id="pane-code-${safeId}">
          <h5>${ex.craftMoves.length} 个招牌招式的核心代码</h5>
          <p style="font-size:13px;color:var(--ink-3);margin-bottom:16px">每招都是这个范例"为什么看上去贵"的具体代码。</p>
          ${codeSnippets}
        </div>
      </div>
    </article>
  `;
}

/* Tiny syntax highlighter — keywords only, no full library */
function highlightCode(s){
  return s
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/(\/\/[^\n]*)/g, '<span class="comment">$1</span>')
    .replace(/\/\*[\s\S]*?\*\//g, m=>`<span class="comment">${m}</span>`)
    .replace(/(`[^`]*`)/g, '<span class="str">$1</span>')
    .replace(/(['"])(?:\\.|(?!\1)[^\\])*\1/g, m=>`<span class="str">${m}</span>`)
    .replace(/\b(const|let|var|function|return|if|else|new|this|true|false|null|undefined|for|while|class)\b/g, '<span class="kw">$1</span>')
    .replace(/(\$\{[^}]+\})/g, '<span class="key">$1</span>');
}

function isColorLight(hex){
  if(!hex.startsWith('#') || hex.length !== 7) return false;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
  return lum > 0.65;
}

const gridBrand = document.getElementById('grid-brand');
const gridProduct = document.getElementById('grid-product');
gridBrand.innerHTML = EXAMPLES.filter(e=>e.register==='brand').map(card).join('');
gridProduct.innerHTML = EXAMPLES.filter(e=>e.register==='product').map(card).join('');

/* =================== Expand panel =================== */
document.addEventListener('click', e=>{
  const btn = e.target.closest('.expand-btn');
  if(btn){
    const id = btn.dataset.target;
    const panel = document.getElementById('panel-'+id);
    const isOn = panel.classList.toggle('is-on');
    btn.classList.toggle('is-on', isOn);
    btn.querySelector('.label').textContent = isOn ? '收起详情' : '展开详情 · AI 复刻 Prompt';
    return;
  }
  const tab = e.target.closest('.tab');
  if(tab){
    const card = tab.closest('.card');
    card.querySelectorAll('.tab').forEach(t=>t.classList.toggle('is-on', t===tab));
    card.querySelectorAll('.tab-content').forEach(p=>p.classList.toggle('is-on', p.id === tab.dataset.pane));
    return;
  }
  const cbtn = e.target.closest('.copy-btn');
  if(cbtn){
    const target = document.getElementById(cbtn.dataset.copy);
    const text = target.innerText;
    navigator.clipboard.writeText(text).then(()=>{
      const orig = cbtn.innerHTML;
      cbtn.innerHTML = '✓ 已复制到剪贴板';
      cbtn.classList.add('copied');
      setTimeout(()=>{ cbtn.innerHTML = orig; cbtn.classList.remove('copied'); }, 2200);
    }).catch(()=>{
      cbtn.innerHTML = '复制失败 — 请手动选择文本';
    });
    return;
  }
  const sw = e.target.closest('.swatch');
  if(sw){
    const color = sw.querySelector('.swatch-meta b').nextSibling.textContent.trim();
    navigator.clipboard.writeText(color).then(()=>{
      sw.style.outline = '2px solid var(--accent)';
      setTimeout(()=>{ sw.style.outline = ''; }, 800);
    });
  }
});

/* =================== Filtering =================== */
const state = { register:'all', theme:'all', q:'' };
function applyFilters(){
  const cards = document.querySelectorAll('.card');
  let anyOn=false;
  cards.forEach(c=>{
    const r = state.register==='all' || c.dataset.register===state.register;
    const t = state.theme==='all' || c.dataset.theme===state.theme;
    const q = !state.q || c.dataset.search.includes(state.q);
    const show = r && t && q;
    c.style.display = show ? '' : 'none';
    if(show) anyOn=true;
  });
  document.getElementById('emptyState').classList.toggle('is-on', !anyOn);
}

document.querySelectorAll('[data-filter]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const f = btn.dataset.filter;
    const v = btn.dataset.val;
    state[f] = v;
    document.querySelectorAll(`[data-filter="${f}"]`).forEach(b=>b.classList.toggle('is-on', b===btn));
    applyFilters();
  });
});
document.getElementById('searchInput').addEventListener('input', e=>{
  state.q = e.target.value.trim().toLowerCase();
  applyFilters();
});

/* =================== Lazy iframe loads =================== */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{
    const f = en.target.querySelector('iframe[data-src-iframe]');
    if(!f) return;
    if(en.isIntersecting && !f.src){
      f.src = f.dataset.srcIframe;
    }
  });
},{rootMargin:'200px'});
document.querySelectorAll('.card').forEach(c=>io.observe(c));

window.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.thumb-frame iframe').forEach((f,i)=>{
    if(i < 4){ if(!f.src) f.src = f.dataset.srcIframe; }
    else { /* lazy */ }
  });
});

})();