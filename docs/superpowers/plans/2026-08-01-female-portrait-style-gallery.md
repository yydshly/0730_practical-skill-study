# Female Portrait Style Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Build an independent responsive static gallery that presents all 20 Female Portrait Director styles with newly generated Codex image assets and inspectable prompts.

**Architecture:** The project is a dependency-free static site. js/styles.js is the sole style-content source, js/gallery.js supplies testable catalog/search/filter utilities, and js/main.js renders the UI and owns interactive state. Generated assets are checked into the project, so the site makes no MiniMax or runtime image API calls.

**Tech Stack:** HTML5, CSS3, native ES modules, Node.js built-in test runner, Codex built-in image generation.

## Global Constraints

- Create a sibling project at female-portrait-style-gallery; do not modify or depend on female-portrait-director-demo.
- Use twenty project-local images under female-portrait-style-gallery/assets/styles/, generated with Codex built-in image generation.
- Every subject is fictional and clearly adult. Avoid minors, nudity, lingerie, explicit/sexualized posing, watermark, logo, and embedded text.
- Keep every sample as a 2:3 vertical image and make the visual language distinct for every library route.
- Do not add an API key, runtime network request, framework, package dependency, build requirement, or remote font.
- Support nine category filters, keyword search, card detail dialog, prompt copying, image-error feedback, and search-empty feedback.
- Layout must be four columns on desktop, two on tablets, and one on phones.
- Apply TDD to JavaScript behavior: write the test first, observe the expected failure, implement the minimum production code, then rerun all tests.
- Do not stage the root README.md modification or the existing untracked female-portrait-director-demo/ directory.

---

## File Structure

| Path | Responsibility |
|---|---|
| female-portrait-style-gallery/index.html | Semantic page shell, controls, gallery region, dialog and toast region. |
| female-portrait-style-gallery/styles.css | Dark editorial visual design, responsive layout, cards, dialog, focus and fallback states. |
| female-portrait-style-gallery/js/styles.js | Immutable catalog of twenty style records and nine category labels. |
| female-portrait-style-gallery/js/gallery.js | Testable catalog validation, search, filtering and result-count behavior. |
| female-portrait-style-gallery/js/main.js | DOM rendering, dialog/focus state, clipboard feedback, image-failure feedback. |
| female-portrait-style-gallery/assets/styles/*.png | Twenty final Codex-generated samples. |
| female-portrait-style-gallery/tests/gallery.test.mjs | Node tests for gallery behavior. |
| female-portrait-style-gallery/package.json | ESM test command with no dependency. |
| female-portrait-style-gallery/README.md | Local preview, testing and asset-use documentation. |

## Image Prompt Manifest

Append this shared constraint to each row before using one built-in image-generation call:

> Fictional, clearly adult East Asian woman aged 25–32; editorial photographic realism; correct face and hands; natural skin texture; no minor, nudity, lingerie, explicit or sexualized pose, watermark, logo, typography, or embedded text; vertical 2:3 frame with crop-safe margins.

| Filename | Final prompt |
|---|---|
| 01-clean-lifestyle.png | Clean lifestyle portrait, quiet afternoon café window seat, ivory knit cardigan over pale blue top, open paperback, relaxed three-quarter seated pose, creamy neutral palette, 35mm fine grain, soft window light, intimate everyday editorial. |
| 02-pure-desire-curve.png | Elegant curve-focused lifestyle portrait on a seaside promenade at blue hour, mist-blue fitted short-sleeve knit top, high-waisted white tailored trousers, light overshirt, poised side profile, subtle shoulder and waist silhouette, cool sea haze, restrained cinematic color. |
| 03-urban-fashion.png | Contemporary urban fashion portrait on a rain-cleaned Shanghai street at dusk, charcoal oversized blazer, white ribbed tee, tailored trousers, leather bag, confident walking gesture, reflective pavement, muted city lights, 50mm street-style editorial. |
| 04-gufeng-xianxia.png | East Asian xianxia portrait in a mountain courtyard above clouds, moon-white Tang-inspired robe, pale silver embroidered belt, drifting sleeves, woman turning by weathered stone balustrade, layered misty mountains, luminous cool dawn, Chinese fantasy film still. |
| 05-ecommerce-tryon.png | Premium e-commerce model photo: full-length adult woman on warm light-gray seamless studio backdrop, camel belted wool coat over white turtleneck and straight black trousers, clear garment drape and stitching, soft even studio lighting, quiet-luxury catalog image. |
| 06-retro-hongkong.png | 1990s Hong Kong film street portrait outside a neon cha chaan teng after rain, dark cherry blouse and high-waisted denim, holding a closed red umbrella, amber and teal practical lights, subtle direct flash, analog film grain. |
| 07-french-lazy.png | French lazy Sunday portrait in a sunlit Paris-style apartment, cream linen shirt and soft taupe trousers, vintage wood chair, balcony door and white curtains, relaxed seated posture, warm cream palette, softly textured film photo. |
| 08-new-chinese.png | Modern Chinese editorial portrait in a minimalist tea room, ink-black mandarin-collar silk blouse and jade-green skirt, arranging a porcelain cup beside a wood table, bamboo shadow on plaster wall, balanced negative space, quiet side light. |
| 09-sporty-active.png | Energetic tennis portrait on an outdoor hard court in early morning, white zip athletic jacket and forest-green tennis skirt over opaque shorts, racquet at side after a rally, sunlight, long shadows, healthy editorial sports photography. |
| 10-travel-vacation.png | Bright travel portrait on a Mediterranean hotel terrace, terracotta wrap dress, woven sun hat held at side, distant blue sea and white stucco, fabric moving in the breeze, clean sunlit color, polished vacation editorial. |
| 11-studio-retouched.png | High-end studio portrait, tailored black satin blazer over sculptural ivory top, deep charcoal seamless background, forward-facing half length, soft octabox key light and fine rim light, true skin detail, fashion magazine lighting with no text. |
| 12-oriental-voluptuous.png | Graceful mature Eastern fashion portrait celebrating a soft natural silhouette, deep plum long-sleeve velvet cheongsam with modest neckline, warm wood-paneled salon, hand on lacquer cabinet, diffused lamp light, dignified posture. |
| 13-cold-xianxia-enhanced.png | Cool distant xianxia heroine on a snow-dusted mountain ridge, ice-blue layered robe, silver hair ornament, pale cloak lifted by wind, composed gaze away from camera, icy mist, clean moonlight, cold-white cinematic fantasy key art. |
| 14-bright-luxury-gufeng.png | Bright luxurious Tang-inspired portrait in an open palace garden, vermilion and antique-gold embroidered hanfu, balanced golden hairpin, blooming peonies, silk-canopy sun, celebratory red-gold palette, historical-fantasy editorial. |
| 15-ultra-close-real-face.png | Ultra-close realistic beauty portrait at a north-facing window, clean makeup, visible pores and peach fuzz, natural brows, calm direct gaze, 85mm macro-like shallow depth, neutral background, documentary beauty photography. |
| 16-ancient-lady-dewy-makeup.png | Ancient noblewoman beauty close-up with dewy makeup, pale jade hair ornament, soft rose lip tint, luminous realistic complexion, pale-gold embroidered collar, warm lacquer-screen backdrop, gentle frontal beauty light. |
| 17-black-pearl-dark-gold-ccd.png | Night CCD-inspired portrait by a dark riverfront, black pearl-gray blouse and tailored dark trousers, wet dark-gold reflections, softened compact-camera flash, relaxed standing pose, intentional CCD texture, inky black and warm gold. |
| 18-soft-ccd-energetic-voluptuous.png | Cheerful summer CCD portrait in a small flower market, coral short-sleeve blouse and pale denim, paper-wrapped bouquet, natural smile, soft direct flash, lifted highlights, lively yet modest full-body composition. |
| 19-cold-white-clear-ccd-curve.png | Cool-white daylight CCD portrait at a concrete gallery exterior, pale-gray ribbed knit and wide-leg white trousers, small shoulder bag, reserved standing pose, high-color-temperature light, pale cyan shadows, crisp compact-camera texture. |
| 20-low-key-cinematic.png | Low-key cinematic portrait in a dark independent-cinema lobby, black long-sleeve dress with modest high neckline, seated by a velvet curtain, single warm practical light shaping one side of face, readable shadows, burgundy-charcoal 35mm film still. |

## Task 1: Establish testable catalog utilities

**Files:**

- Create: female-portrait-style-gallery/package.json
- Create: female-portrait-style-gallery/tests/gallery.test.mjs
- Create: female-portrait-style-gallery/js/gallery.js

**Interfaces:**

- Produces validateCatalog(styles), filterStyles(styles, category, query), and formatResultCount(count).
- validateCatalog returns { valid: boolean, errors: string[] }.
- filterStyles returns a new array without changing its input.

- [ ] **Step 1: Write failing tests**

~~~js
import test from 'node:test';
import assert from 'node:assert/strict';
import { filterStyles, formatResultCount, validateCatalog } from '../js/gallery.js';

const fixture = [
  { id: 'clean-lifestyle', category: 'lifestyle', name: '清纯生活照', keywords: ['咖啡馆'], description: '温和自然', image: 'assets/styles/01.png', prompt: 'sample', details: { scene: '咖啡馆', outfit: '针织衫', camera: '半身', light: '窗光' } },
  { id: 'urban-fashion', category: 'fashion', name: '都市时尚写真', keywords: ['街拍'], description: '现代都市', image: 'assets/styles/02.png', prompt: 'sample', details: { scene: '街道', outfit: '西装', camera: '全身', light: '黄昏' } }
];

test('rejects a catalog record with an empty prompt', () => {
  assert.deepEqual(validateCatalog([{ ...fixture[0], prompt: '' }]), {
    valid: false, errors: ['clean-lifestyle 缺少 prompt']
  });
});

test('matches category and Chinese keyword without changing the input array', () => {
  const source = [...fixture];
  assert.deepEqual(filterStyles(source, 'lifestyle', '咖啡'), [fixture[0]]);
  assert.deepEqual(source, fixture);
});

test('uses the same result label for one and many styles', () => {
  assert.equal(formatResultCount(1), '1 个风格');
  assert.equal(formatResultCount(20), '20 个风格');
});
~~~

- [ ] **Step 2: Run test and verify the expected red failure**

Run: npm test --prefix female-portrait-style-gallery

Expected: FAIL because js/gallery.js does not exist.

- [ ] **Step 3: Write minimal package configuration and utility code**

~~~json
{
  "name": "female-portrait-style-gallery",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test tests/*.test.mjs" }
}
~~~

~~~js
const REQUIRED_FIELDS = ['id', 'category', 'name', 'image', 'prompt', 'details'];

export function validateCatalog(styles) {
  const errors = styles.flatMap((style) => REQUIRED_FIELDS
    .filter((field) => !style[field] || (typeof style[field] === 'object' && Object.keys(style[field]).length === 0))
    .map((field) => (style.id || '未命名风格') + ' 缺少 ' + field));
  return { valid: errors.length === 0, errors };
}

export function filterStyles(styles, category = 'all', query = '') {
  const needle = query.trim().toLocaleLowerCase('zh-CN');
  return styles.filter((style) => {
    const haystack = [style.name, style.category, style.description, ...style.keywords]
      .join(' ').toLocaleLowerCase('zh-CN');
    return (category === 'all' || style.category === category) && (!needle || haystack.includes(needle));
  });
}

export function formatResultCount(count) {
  return count + ' 个风格';
}
~~~

- [ ] **Step 4: Run test and verify green**

Run: npm test --prefix female-portrait-style-gallery

Expected: PASS, 3 tests passed.

- [ ] **Step 5: Commit**

~~~bash
git add female-portrait-style-gallery/package.json female-portrait-style-gallery/tests/gallery.test.mjs female-portrait-style-gallery/js/gallery.js
git commit -m "feat: add gallery catalog utilities"
~~~

## Task 2: Generate and validate twenty final local image assets

**Files:**

- Create: female-portrait-style-gallery/assets/styles/01-clean-lifestyle.png through 20-low-key-cinematic.png

**Interfaces:**

- Consumes: one prompt-manifest row plus the shared constraint per built-in generation call.
- Produces: exactly 20 inspected local PNG files whose names match the catalog image values in Task 3.

- [ ] **Step 1: Generate all assets with the built-in image tool**

Make one Codex built-in image-generation call for each manifest row. Select the strongest result and copy it into the matching assets/styles filename. Do not use MiniMax, external image URLs, a runtime request, or a source asset left only outside the project.

- [ ] **Step 2: Inspect every saved image**

Open each local PNG at full detail. Confirm: a fictional clearly adult subject; the specified setting/outfit/light; a 2:3 vertical crop; no watermarks or text; plausible face/hands; and a style visibly distinct from the other nineteen samples. Regenerate only a failed row with one explicit corrective sentence, then replace that same asset.

- [ ] **Step 3: Verify image count and portrait ratio**

~~~powershell
$assets = Get-ChildItem 'female-portrait-style-gallery/assets/styles' -Filter '*.png'
if ($assets.Count -ne 20) { throw "Expected 20 PNG files, found $($assets.Count)" }
$assets | ForEach-Object {
  $image = [System.Drawing.Image]::FromFile($_.FullName)
  try {
    $ratio = $image.Height / $image.Width
    if ($ratio -lt 1.45 -or $ratio -gt 1.55) { throw "Unexpected portrait ratio: $($_.Name)" }
  } finally { $image.Dispose() }
}
~~~

Expected: no error; all twenty files are approximately 2:3 vertical.

- [ ] **Step 4: Commit**

~~~bash
git add female-portrait-style-gallery/assets/styles
git commit -m "feat: add generated portrait style samples"
~~~

## Task 3: Implement and validate the single-source style catalog

**Files:**

- Create: female-portrait-style-gallery/js/styles.js
- Modify: female-portrait-style-gallery/tests/gallery.test.mjs

**Interfaces:**

- Produces CATEGORIES, STYLES, getStyleById(id).
- STYLES has exactly 20 complete records, each with id, number, name, category, keywords, description, image, prompt, and details.
- getStyleById returns the record or undefined.

- [ ] **Step 1: Add the failing catalog tests**

~~~js
import { CATEGORIES, STYLES, getStyleById } from '../js/styles.js';

test('contains twenty valid styles across the nine library categories', () => {
  assert.equal(STYLES.length, 20);
  assert.deepEqual(CATEGORIES.map((category) => category.id), [
    'lifestyle', 'curve', 'fashion', 'fantasy', 'commercial',
    'oriental', 'beauty', 'realism', 'cinematic'
  ]);
  assert.deepEqual(validateCatalog(STYLES), { valid: true, errors: [] });
});

test('resolves a known style image and returns undefined for unknown id', () => {
  assert.equal(getStyleById('gufeng-xianxia').image, 'assets/styles/04-gufeng-xianxia.png');
  assert.equal(getStyleById('missing-style'), undefined);
});
~~~

- [ ] **Step 2: Run tests and verify red**

Run: npm test --prefix female-portrait-style-gallery

Expected: FAIL because js/styles.js does not exist.

- [ ] **Step 3: Implement the complete catalog**

Create the following exports. The prompt field in every row is the matching Final prompt text in the Image Prompt Manifest above, prefixed by the shared safety constraint. The tuple list explicitly defines all remaining metadata and image paths.

~~~js
export const CATEGORIES = [
  { id: 'lifestyle', label: '生活方式' }, { id: 'curve', label: '曲线' },
  { id: 'fashion', label: '时尚' }, { id: 'fantasy', label: '幻想' },
  { id: 'commercial', label: '商业' }, { id: 'oriental', label: '东方' },
  { id: 'beauty', label: '美妆' }, { id: 'realism', label: '写实' },
  { id: 'cinematic', label: '电影感' }
];

const styleRows = [
  ['clean-lifestyle', '01', '清纯生活照', 'lifestyle', ['清纯', '温柔', '自然', '咖啡馆', '窗边'], '温和、自然、生活剧照感的真实摄影风格', '01-clean-lifestyle.png', ['午后咖啡馆窗边', '象牙白针织开衫', '35mm 三分之四身', '柔和窗光']],
  ['pure-desire-curve', '02', '纯欲曲线生活照', 'curve', ['曲线', '克制', '海边', '针织', '蓝调时刻'], '克制优雅的曲线生活照风格', '02-pure-desire-curve.png', ['海边步道蓝调时刻', '雾蓝针织上衣与白色西裤', '侧身中景', '冷调海雾柔光']],
  ['urban-fashion', '03', '都市时尚写真', 'fashion', ['都市', '街拍', '西装', '黄昏', '通勤'], '现代都市女性的时尚街拍风格', '03-urban-fashion.png', ['雨后上海街头', '炭灰廓形西装', '50mm 行走抓拍', '黄昏环境光']],
  ['gufeng-xianxia', '04', '古风仙侠美人图', 'fantasy', ['古风', '仙侠', '云雾', '月白', '山水'], '东方幻想唐风审美的仙侠角色写真', '04-gufeng-xianxia.png', ['云海山庭', '月白唐风长袍', '三分之四身回望', '清冷黎明光']],
  ['ecommerce-tryon', '05', '电商服装模特图', 'commercial', ['电商', '服装', '模特', '棚拍', '主图'], '服装展示优先的清晰商业模特图', '05-ecommerce-tryon.png', ['浅灰无缝影棚', '驼色羊毛大衣', '全身正侧面', '均匀柔光']],
  ['retro-hongkong', '06', '复古港风写真', 'lifestyle', ['港风', '港片', '霓虹', '茶餐厅', '胶片'], '复古港片质感的胶片摄影风格', '06-retro-hongkong.png', ['雨后茶餐厅街口', '樱桃红衬衫与牛仔裤', '环境人像中景', '霓虹与柔闪']],
  ['french-lazy', '07', '法式慵懒写真', 'lifestyle', ['法式', '慵懒', '公寓', '亚麻', '奶油色'], '松弛温暖的法式居家摄影风格', '07-french-lazy.png', ['法式公寓阳台门边', '奶油亚麻衬衫', '自然坐姿半身', '晨间柔光']],
  ['new-chinese', '08', '新中式东方写真', 'oriental', ['新中式', '茶室', '竹影', '丝绸', '留白'], '新中式东方美学与现代审美的融合', '08-new-chinese.png', ['极简茶室', '墨黑立领丝绸上衣与玉绿长裙', '桌边中景', '侧向静光']],
  ['sporty-active', '09', '活力运动写真', 'fashion', ['运动', '网球', '活力', '球场', '晨光'], '健康明快的运动场景人像风格', '09-sporty-active.png', ['清晨网球场', '白色运动夹克与森林绿网球裙', '全身动态抓拍', '清晰日光']],
  ['travel-vacation', '10', '旅行假日写真', 'lifestyle', ['旅行', '假日', '海岛', '露台', '阳光'], '明亮清新的旅行度假摄影风格', '10-travel-vacation.png', ['地中海酒店露台', '陶土色裹身裙', '全身环境人像', '通透日光']],
  ['studio-retouched', '11', '影楼精修写真', 'fashion', ['影楼', '精修', '棚拍', '礼服', '杂志'], '自然质感保留的高端棚拍人像风格', '11-studio-retouched.png', ['深炭灰无缝棚', '黑色缎面西装与象牙白上衣', '正面半身', '柔光主灯与轮廓光']],
  ['oriental-voluptuous', '12', '东方丰腴写真', 'curve', ['东方', '丰润', '旗袍', '天鹅绒', '成熟'], '东方丰润美的优雅成熟写真', '12-oriental-voluptuous.png', ['暖木质沙龙', '深梅色长袖天鹅绒旗袍', '站姿中景', '柔和灯光']],
  ['cold-xianxia-enhanced', '13', '清冷仙气古风增强版', 'fantasy', ['清冷', '仙气', '雪山', '冰蓝', '月光'], '清冷疏离的仙气古风增强版', '13-cold-xianxia-enhanced.png', ['雪覆山脊', '冰蓝层叠长袍与银饰', '远望中景', '月白冷光']],
  ['bright-luxury-gufeng', '14', '明媚华贵古风增强版', 'fantasy', ['华贵', '盛唐', '红金', '宫廷', '牡丹'], '盛唐红金宫廷风的华贵古风写真', '14-bright-luxury-gufeng.png', ['宫苑牡丹花下', '朱红与古金刺绣汉服', '仪态站姿', '丝幕过滤日光']],
  ['ultra-close-real-face', '15', '超近景真实人脸人像', 'realism', ['近景', '真实皮肤', '毛孔', '窗光', '素颜感'], '真实皮肤微纹理的超近景人脸摄影', '15-ultra-close-real-face.png', ['北向窗边', '自然淡妆与中性色上衣', '85mm 超近景', '均匀漫射窗光']],
  ['ancient-lady-dewy-makeup', '16', '古风贵女水光妆', 'beauty', ['古风', '贵女', '水光妆', '玉饰', '特写'], '古风身份感与水光妆容的美妆特写', '16-ancient-lady-dewy-makeup.png', ['暖漆屏风前', '淡金刺绣衣领与玉簪', '脸部特写', '柔和正面美容光']],
  ['black-pearl-dark-gold-ccd', '17', '黑珍珠墨金CCD曲线生活照', 'curve', ['黑珍珠', '墨金', '夜景', 'CCD', '直闪'], '夜间墨金暗部 CCD 人像风格', '17-black-pearl-dark-gold-ccd.png', ['暗色河岸夜景', '珍珠灰上衣与深色长裤', '站姿中景', '柔化直闪与金色反光']],
  ['soft-ccd-energetic-voluptuous', '18', '元气丰腴柔光CCD生活照', 'curve', ['元气', '花市', '夏日', 'CCD', '柔闪'], '明亮元气的柔光 CCD 夏日生活照', '18-soft-ccd-energetic-voluptuous.png', ['夏日花市', '珊瑚色短袖与浅色牛仔', '全身动态人像', '柔闪与抬高高光']],
  ['cold-white-clear-ccd-curve', '19', '冷白清透CCD曲线生活照', 'curve', ['冷白', 'CCD', '针织', '建筑', '清透'], '冷白清透的日间 CCD 曲线生活照', '19-cold-white-clear-ccd-curve.png', ['混凝土画廊外立面', '浅灰针织与白色阔腿裤', '全身建筑人像', '高色温日光']],
  ['low-key-cinematic-photography', '20', '低调电影感摄影', 'cinematic', ['电影感', '低照度', '影院', '天鹅绒', '35mm'], '局部连续光下的低调电影感摄影风格', '20-low-key-cinematic.png', ['独立影院大堂', '黑色高领长袖连衣裙', '坐姿半身', '单点暖实景光']]
];

const sharedConstraint = 'Fictional clearly adult East Asian woman aged 25–32; editorial photographic realism; correct face and hands; natural skin texture; no minor, nudity, lingerie, explicit or sexualized pose, watermark, logo, typography, or embedded text; vertical 2:3 frame with crop-safe margins.';

const finalPrompts = {
  'clean-lifestyle': 'Clean lifestyle portrait, quiet afternoon café window seat, ivory knit cardigan over pale blue top, open paperback, relaxed three-quarter seated pose, creamy neutral palette, 35mm fine grain, soft window light, intimate everyday editorial.',
  'pure-desire-curve': 'Elegant curve-focused lifestyle portrait on a seaside promenade at blue hour, mist-blue fitted short-sleeve knit top, high-waisted white tailored trousers, light overshirt, poised side profile, subtle shoulder and waist silhouette, cool sea haze, restrained cinematic color.',
  'urban-fashion': 'Contemporary urban fashion portrait on a rain-cleaned Shanghai street at dusk, charcoal oversized blazer, white ribbed tee, tailored trousers, leather bag, confident walking gesture, reflective pavement, muted city lights, 50mm street-style editorial.',
  'gufeng-xianxia': 'East Asian xianxia portrait in a mountain courtyard above clouds, moon-white Tang-inspired robe, pale silver embroidered belt, drifting sleeves, woman turning by weathered stone balustrade, layered misty mountains, luminous cool dawn, Chinese fantasy film still.',
  'ecommerce-tryon': 'Premium e-commerce model photo: full-length adult woman on warm light-gray seamless studio backdrop, camel belted wool coat over white turtleneck and straight black trousers, clear garment drape and stitching, soft even studio lighting, quiet-luxury catalog image.',
  'retro-hongkong': '1990s Hong Kong film street portrait outside a neon cha chaan teng after rain, dark cherry blouse and high-waisted denim, holding a closed red umbrella, amber and teal practical lights, subtle direct flash, analog film grain.',
  'french-lazy': 'French lazy Sunday portrait in a sunlit Paris-style apartment, cream linen shirt and soft taupe trousers, vintage wood chair, balcony door and white curtains, relaxed seated posture, warm cream palette, softly textured film photo.',
  'new-chinese': 'Modern Chinese editorial portrait in a minimalist tea room, ink-black mandarin-collar silk blouse and jade-green skirt, arranging a porcelain cup beside a wood table, bamboo shadow on plaster wall, balanced negative space, quiet side light.',
  'sporty-active': 'Energetic tennis portrait on an outdoor hard court in early morning, white zip athletic jacket and forest-green tennis skirt over opaque shorts, racquet at side after a rally, sunlight, long shadows, healthy editorial sports photography.',
  'travel-vacation': 'Bright travel portrait on a Mediterranean hotel terrace, terracotta wrap dress, woven sun hat held at side, distant blue sea and white stucco, fabric moving in the breeze, clean sunlit color, polished vacation editorial.',
  'studio-retouched': 'High-end studio portrait, tailored black satin blazer over sculptural ivory top, deep charcoal seamless background, forward-facing half length, soft octabox key light and fine rim light, true skin detail, fashion magazine lighting with no text.',
  'oriental-voluptuous': 'Graceful mature Eastern fashion portrait celebrating a soft natural silhouette, deep plum long-sleeve velvet cheongsam with modest neckline, warm wood-paneled salon, hand on lacquer cabinet, diffused lamp light, dignified posture.',
  'cold-xianxia-enhanced': 'Cool distant xianxia heroine on a snow-dusted mountain ridge, ice-blue layered robe, silver hair ornament, pale cloak lifted by wind, composed gaze away from camera, icy mist, clean moonlight, cold-white cinematic fantasy key art.',
  'bright-luxury-gufeng': 'Bright luxurious Tang-inspired portrait in an open palace garden, vermilion and antique-gold embroidered hanfu, balanced golden hairpin, blooming peonies, silk-canopy sun, celebratory red-gold palette, historical-fantasy editorial.',
  'ultra-close-real-face': 'Ultra-close realistic beauty portrait at a north-facing window, clean makeup, visible pores and peach fuzz, natural brows, calm direct gaze, 85mm macro-like shallow depth, neutral background, documentary beauty photography.',
  'ancient-lady-dewy-makeup': 'Ancient noblewoman beauty close-up with dewy makeup, pale jade hair ornament, soft rose lip tint, luminous realistic complexion, pale-gold embroidered collar, warm lacquer-screen backdrop, gentle frontal beauty light.',
  'black-pearl-dark-gold-ccd': 'Night CCD-inspired portrait by a dark riverfront, black pearl-gray blouse and tailored dark trousers, wet dark-gold reflections, softened compact-camera flash, relaxed standing pose, intentional CCD texture, inky black and warm gold.',
  'soft-ccd-energetic-voluptuous': 'Cheerful summer CCD portrait in a small flower market, coral short-sleeve blouse and pale denim, paper-wrapped bouquet, natural smile, soft direct flash, lifted highlights, lively yet modest full-body composition.',
  'cold-white-clear-ccd-curve': 'Cool-white daylight CCD portrait at a concrete gallery exterior, pale-gray ribbed knit and wide-leg white trousers, small shoulder bag, reserved standing pose, high-color-temperature light, pale cyan shadows, crisp compact-camera texture.',
  'low-key-cinematic-photography': 'Low-key cinematic portrait in a dark independent-cinema lobby, black long-sleeve dress with modest high neckline, seated by a velvet curtain, single warm practical light shaping one side of face, readable shadows, burgundy-charcoal 35mm film still.'
};

export const STYLES = styleRows.map(([id, number, name, category, keywords, description, filename, [scene, outfit, camera, light]]) => ({
  id, number, name, category, keywords, description,
  image: 'assets/styles/' + filename,
  prompt: sharedConstraint + ' ' + finalPrompts[id],
  details: { scene, outfit, camera, light }
}));

export function getStyleById(id) {
  return STYLES.find((style) => style.id === id);
}
~~~

Keep the tuple array, image file mapping, category assignment, prompt text, and four details exactly as shown.

- [ ] **Step 4: Run full suite and verify green**

Run: npm test --prefix female-portrait-style-gallery

Expected: PASS, 5 tests passed.

- [ ] **Step 5: Commit**

~~~bash
git add female-portrait-style-gallery/js/styles.js female-portrait-style-gallery/tests/gallery.test.mjs
git commit -m "feat: add portrait style catalog"
~~~

## Task 4: Build the responsive dark editorial gallery and detail dialog

**Files:**

- Create: female-portrait-style-gallery/index.html
- Create: female-portrait-style-gallery/styles.css
- Create: female-portrait-style-gallery/js/main.js

**Interfaces:**

- Consumes CATEGORIES, STYLES, getStyleById, filterStyles and formatResultCount.
- Requires DOM hooks #category-filters, #style-search, #result-count, #gallery, #empty-state, #style-dialog, #dialog-content and #toast-region.

- [ ] **Step 1: Establish manual red state**

Attempt to open female-portrait-style-gallery/index.html through a static server. Record the missing-file response before adding it.

- [ ] **Step 2: Implement semantic markup and interaction code**

In index.html, build: a labelled masthead; a nav with aria-label="按类别筛选"; search input; role=status result count; aria-live=polite empty state with reset control; section#gallery; native dialog#style-dialog; and toast region. Link styles.css and type=module js/main.js.

In main.js, set initial state to { category: 'all', query: '', activeDialogId: null }. Render category buttons from CATEGORIES and cards from filterStyles(STYLES, state.category, state.query). Use this card structure:

~~~js
function styleCard(style) {
  return '<article class="style-card" data-style-id="' + style.id + '">' +
    '<button class="style-card__button" type="button" aria-label="查看 ' + style.name + ' 的详情">' +
    '<img src="' + style.image + '" alt="' + style.name + '样例" loading="lazy">' +
    '<span class="style-card__overlay"><span>' + style.number + '</span><strong>' +
    style.name + '</strong><em>' + categoryLabel(style.category) + '</em></span>' +
    '</button></article>';
}
~~~

On image error, add style-card--missing-image to the nearest card, change alt text to the style name plus “图片加载失败”, and retain card text. Build dialog content from getStyleById with a close button, large image, description, four labelled details, readonly prompt text and copy button. Preserve the opening button, focus close after showModal(), and return focus after close; support close button, backdrop close, native Esc cancel, and Escape.

For copying, call navigator.clipboard.writeText(style.prompt). Announce “已复制完整提示词” when successful. On rejection announce “无法自动复制提示词，请手动复制” and select the prompt text.

- [ ] **Step 3: Implement the CSS system**

Use these values consistently: --ink #0d0d0d, --surface #171717, --surface-raised #22201d, --text #f4efe8, --muted #aea69d, --line #3a352f, --copper #c68b55, --copper-light #e3b184. Use four grid columns above 1180px, two columns from 680px to 1179px, and one column below 680px. Set cards to aspect-ratio: 2 / 3; use object-fit: cover and a dark gradient label overlay. Provide visible keyboard focus and scale motion that is disabled by prefers-reduced-motion. Keep dialog image/content within the phone viewport and retain legibility if backdrop-filter is unavailable.

- [ ] **Step 4: Run browser green check**

Run: python -m http.server 4173 --directory female-portrait-style-gallery

Open: http://localhost:4173/

Expected at 1440px: twenty cards in four columns, all filters, no console error. Expected at 390px: one-column cards, horizontally usable filters, dialog constrained inside viewport.

- [ ] **Step 5: Commit**

~~~bash
git add female-portrait-style-gallery/index.html female-portrait-style-gallery/styles.css female-portrait-style-gallery/js/main.js
git commit -m "feat: build portrait style gallery interface"
~~~

## Task 5: Validate requested browser interactions and correct discovered defects

**Files:**

- Modify only the smallest of female-portrait-style-gallery/js/main.js, styles.css and tests/gallery.test.mjs when a verified defect requires it.

**Interfaces:**

- Consumes the runnable site from Task 4.
- Produces browser evidence for all requested desktop and mobile flows.

- [ ] **Step 1: Verify filters, search and empty state**

At 1440px, select fantasy and confirm exactly three cards. Search 咖啡 and confirm only 清纯生活照 remains. Search 不存在的风格 and confirm zero cards, a visible empty state, and a reset action that restores all twenty cards.

- [ ] **Step 2: Verify dialog, keyboard and copy action**

Open 古风仙侠美人图 and verify local image, all four detail fields and full prompt. Press Esc and verify focus returns to the card. Reopen and copy; either confirm success feedback or, if the browser denies clipboard permission, confirm the stated manual-copy fallback.

- [ ] **Step 3: Apply the smallest focused correction if an observed check fails**

For a gallery-utility bug, first add a specific Node test that fails because of the observed user-visible break, then implement the smallest correction and rerun npm test --prefix female-portrait-style-gallery. For a DOM-only bug, record the exact failing browser interaction, change only the responsible main.js or styles.css code, then repeat that interaction successfully.

- [ ] **Step 4: Commit a correction only if one was needed**

~~~bash
git add female-portrait-style-gallery/js/main.js female-portrait-style-gallery/styles.css female-portrait-style-gallery/tests/gallery.test.mjs
git commit -m "fix: refine gallery interactions"
~~~

Do not create an empty commit when every verification already passed.

## Task 6: Document the gallery and perform delivery audit

**Files:**

- Create: female-portrait-style-gallery/README.md

**Interfaces:**

- Consumes final project layout and canonical preview/test commands.
- Produces standalone handoff documentation.

- [ ] **Step 1: Write the README**

Create these sections: # 女性人像风格样例画廊, ## 内容, ## 本地预览, ## 测试, ## 资源说明. State that all twenty samples use Codex built-in generation, depict fictional clearly adult subjects, are static assets in assets/styles/, and need no API key.

~~~bash
python -m http.server 4173 --directory female-portrait-style-gallery
npm test --prefix female-portrait-style-gallery
~~~

- [ ] **Step 2: Run engineering checks**

~~~bash
npm test --prefix female-portrait-style-gallery
git diff --check
git status --short
~~~

Expected: tests pass, no whitespace errors, and no unrelated root README.md or female-portrait-director-demo/ change is staged.

- [ ] **Step 3: Run terminal browser audit**

On canonical URL http://localhost:4173/, recheck desktop 1440px and phone 390px. Confirm all twenty local images load, no console errors occur, filter/search/dialog/copy flows function, and image/copy failures have understandable fallbacks.

- [ ] **Step 4: Commit README**

~~~bash
git add female-portrait-style-gallery/README.md
git commit -m "docs: document portrait style gallery"
~~~

## Plan Self-Review

| Spec requirement | Implemented by |
|---|---|
| Independent static site, no MiniMax/API key | Global constraints; Tasks 1, 4, 6 |
| Twenty new local Codex samples | Image manifest and Task 2 |
| Nine filters and keyword search | Tasks 1, 3, 4, 5 |
| High-end dark editorial visual direction | Task 4 |
| Detail view, prompt copy, keyboard focus/close | Tasks 4, 5 |
| Desktop/tablet/phone responsiveness | Tasks 4, 6 |
| Data, image, copy and empty states | Tasks 1, 4, 5 |
| Automated behavior tests and real browser checks | Tasks 1, 3, 4, 5, 6 |
| Preserve unrelated workspace content | Global constraints and Task 6 |

The plan names every generated asset and assigns all producer/consumer interfaces consistently. It is limited to one static gallery system; it requires no separate subsystem plan.
