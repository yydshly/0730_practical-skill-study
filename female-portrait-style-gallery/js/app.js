(() => {
'use strict';
const REQUIRED_TEXT_FIELDS = ['description', 'image', 'prompt'];
const REQUIRED_DETAIL_FIELDS = ['scene', 'outfit', 'camera', 'light'];
const TWO_DIGIT_NUMBER = /^\d{2}$/;
const LOCAL_PNG_PATH = /^assets\/styles\/[^/\\]+\.png$/i;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateCatalog(styles, { categories = [] } = {}) {
  if (!Array.isArray(styles)) {
    return { valid: false, errors: ['风格目录必须是数组'] };
  }

  const errors = [];
  const allowedCategories = new Set(categories.map(({ id }) => id));
  const seenIds = new Set();

  styles.forEach((style) => {
    const record = style && typeof style === 'object' ? style : {};
    const label = isNonEmptyString(record.id) ? record.id.trim() : '未命名风格';

    if (!isNonEmptyString(record.id)) {
      errors.push(`${label} 缺少 id`);
    } else if (seenIds.has(record.id)) {
      errors.push(`目录包含重复 id: ${record.id}`);
    } else {
      seenIds.add(record.id);
    }

    if (!isNonEmptyString(record.number)) {
      errors.push(`${label} 缺少 number`);
    } else if (!TWO_DIGIT_NUMBER.test(record.number)) {
      errors.push(`${label} 的 number 必须是两位数字: ${record.number}`);
    }

    if (!isNonEmptyString(record.category)) {
      errors.push(`${label} 缺少 category`);
    } else if (!allowedCategories.has(record.category)) {
      errors.push(`${label} 的 category 不在允许分类中: ${record.category}`);
    }

    if (!isNonEmptyString(record.name)) errors.push(`${label} 缺少 name`);

    if (!Array.isArray(record.keywords)
      || record.keywords.length === 0
      || record.keywords.some((keyword) => !isNonEmptyString(keyword))) {
      errors.push(`${label} 缺少 keywords`);
    }

    REQUIRED_TEXT_FIELDS.forEach((field) => {
      if (!isNonEmptyString(record[field])) errors.push(`${label} 缺少 ${field}`);
    });

    if (isNonEmptyString(record.image) && !LOCAL_PNG_PATH.test(record.image)) {
      errors.push(`${label} 的 image 必须是 assets/styles/ 下的 PNG: ${record.image}`);
    }

    const details = record.details && typeof record.details === 'object'
      ? record.details
      : {};
    REQUIRED_DETAIL_FIELDS.forEach((field) => {
      if (!isNonEmptyString(details[field])) errors.push(`${label} 缺少 details.${field}`);
    });
  });

  return { valid: errors.length === 0, errors };
}

function filterStyles(styles, {
  categories = [],
  category = 'all',
  query = ''
} = {}) {
  const needle = query.trim().toLocaleLowerCase('zh-CN');
  const categoryLabels = new Map(categories.map(({ id, label }) => [id, label]));

  return styles.filter((style) => {
    const haystack = [
      style.name,
      style.category,
      categoryLabels.get(style.category),
      style.description,
      ...style.keywords
    ].filter(Boolean).join(' ').toLocaleLowerCase('zh-CN');

    return (category === 'all' || style.category === category)
      && (!needle || haystack.includes(needle));
  });
}

function formatResultCount(count) {
  return count + ' 个风格';
}


const CATEGORIES = [
  { id: 'lifestyle', label: '生活方式' },
  { id: 'curve', label: '曲线' },
  { id: 'fashion', label: '时尚' },
  { id: 'fantasy', label: '幻想' },
  { id: 'commercial', label: '商业' },
  { id: 'oriental', label: '东方' },
  { id: 'beauty', label: '美妆' },
  { id: 'realism', label: '写实' },
  { id: 'cinematic', label: '电影感' },
];

const SAFETY = '虚构的成年东亚女性，年龄约 25–32 岁，竖幅 2:3，全身着装完整；不出现未成年人、裸露、内衣、性暗示姿势、文字、标志或水印。';

function defineStyle({ id, number, name, category, keywords, description, image, prompt, scene, outfit, camera, light }) {
  return {
    id,
    number,
    name,
    category,
    keywords,
    description,
    image,
    prompt: `${prompt} ${SAFETY}`,
    details: { scene, outfit, camera, light },
  };
}

const STYLES = [
  defineStyle({
    id: 'clean-lifestyle', number: '01', name: '清纯生活照', category: 'lifestyle',
    keywords: ['咖啡馆', '自然光', '清新', '日常', '胶片'],
    description: '像被偶然记录下来的安静午后，干净、亲近而不过度修饰。',
    image: 'assets/styles/01-clean-lifestyle.png',
    prompt: '安静午后的咖啡馆窗边，一位成年东亚女性低头阅读摊开的书，象牙白针织开衫搭配淡蓝上衣，自然松弛的坐姿，窗外街景柔化成背景，真实皮肤质感，轻微 35mm 胶片颗粒，生活方式摄影。',
    scene: '午后咖啡馆窗边', outfit: '象牙白针织开衫、淡蓝上衣', camera: '35mm 纪实视角', light: '柔和侧窗光',
  }),
  defineStyle({
    id: 'pure-desire-curve', number: '02', name: '纯欲曲线生活照', category: 'curve',
    keywords: ['海边', '蓝调', '侧影', '清透', '曲线'],
    description: '克制的蓝调海风与利落侧影，呈现清透而自然的女性线条。',
    image: 'assets/styles/02-pure-desire-curve.png',
    prompt: '蓝调时刻的海边步道，一位成年东亚女性以从容侧身站姿望向远处，雾蓝短袖针织上衣、白色高腰西装长裤与轻薄外搭，服装自然勾勒优雅轮廓，凉雾与海风，清透电影质感，克制高级。',
    scene: '蓝调海边步道', outfit: '雾蓝针织上衣、白色西装长裤', camera: '50mm 侧身中全景', light: '冷调暮色与柔雾',
  }),
  defineStyle({
    id: 'urban-fashion', number: '03', name: '都市时尚写真', category: 'fashion',
    keywords: ['上海', '街拍', '西装', '雨后', '都市'],
    description: '雨后城市的锋利剪影，以步态和反光塑造现代编辑感。',
    image: 'assets/styles/03-urban-fashion.png',
    prompt: '雨后黄昏的上海街头，一位成年东亚女性正阔步穿过画面，炭灰色廓形西装、白色罗纹上衣、剪裁长裤与皮革手提包，湿润路面映出城市灯光，现代时尚杂志摄影，真实自然。',
    scene: '雨后上海街头', outfit: '炭灰廓形西装、白色上衣、剪裁长裤', camera: '35mm 动态街拍', light: '暮色环境光与路面反射',
  }),
  defineStyle({
    id: 'gufeng-xianxia', number: '04', name: '古风仙侠美人图', category: 'fantasy',
    keywords: ['仙侠', '云海', '古风', '长袍', '山景'],
    description: '云海之上的清逸古风肖像，衣袂与留白共同营造仙境气息。',
    image: 'assets/styles/04-gufeng-xianxia.png',
    prompt: '云海之上的高山庭院，一位成年东亚女性身着月白色唐风灵感长袍，银线绣腰带，长袖随风轻扬，倚近石栏但不接触，远山层叠，雅致仙侠氛围，写实服装纹理与电影构图。',
    scene: '云海高山庭院', outfit: '月白唐风长袍、银线绣腰带', camera: '50mm 环境人像', light: '清冷黎明天光',
  }),
  defineStyle({
    id: 'ecommerce-tryon', number: '05', name: '电商服装模特图', category: 'commercial',
    keywords: ['电商', '服装', '棚拍', '全身', '商品'],
    description: '清楚呈现版型、材质与垂坠感的标准化商品视觉。',
    image: 'assets/styles/05-ecommerce-tryon.png',
    prompt: '浅灰无缝影棚背景，一位成年东亚女性自然正面站立展示驼色系带羊毛大衣，内搭白色高领针织与黑色长裤，全身构图，服装边缘清晰，材质和垂坠真实，专业电商目录摄影。',
    scene: '浅灰无缝影棚', outfit: '驼色系带羊毛大衣、白色高领、黑色长裤', camera: '70mm 标准全身照', light: '均匀柔光箱布光',
  }),
  defineStyle({
    id: 'retro-hongkong', number: '06', name: '复古港风写真', category: 'lifestyle',
    keywords: ['港风', '霓虹', '茶餐厅', '胶片', '复古'],
    description: '潮湿霓虹与轻微直闪，让夜色带上九十年代电影温度。',
    image: 'assets/styles/06-retro-hongkong.png',
    prompt: '雨后的霓虹茶餐厅门外，一位成年东亚女性手持红伞，穿深樱桃色衬衫与高腰牛仔裤，琥珀和青绿色招牌光映在湿地面上，轻微相机直闪与胶片颗粒，九十年代香港电影氛围。',
    scene: '雨后霓虹茶餐厅', outfit: '深樱桃色衬衫、高腰牛仔裤', camera: '35mm 胶片快照', light: '琥珀青绿霓虹与轻直闪',
  }),
  defineStyle({
    id: 'french-lazy', number: '07', name: '法式慵懒写真', category: 'lifestyle',
    keywords: ['法式', '公寓', '亚麻', '晨光', '慵懒'],
    description: '松弛的亚麻与缓慢晨光，像一页安静的法国生活杂志。',
    image: 'assets/styles/07-french-lazy.png',
    prompt: '阳光漫入的巴黎风格公寓，一位成年东亚女性倚坐复古木椅，宽松奶油色亚麻衬衫搭配灰褐色长裤，窗帘被微风吹动，自然未刻意摆拍，法式生活杂志质感。',
    scene: '巴黎风格旧公寓', outfit: '奶油色亚麻衬衫、灰褐长裤', camera: '50mm 松弛半身环境照', light: '温柔清晨窗光',
  }),
  defineStyle({
    id: 'new-chinese', number: '08', name: '新中式东方写真', category: 'oriental',
    keywords: ['新中式', '茶室', '竹影', '东方', '留白'],
    description: '以现代剪裁收束传统意象，在竹影和留白中显出东方秩序。',
    image: 'assets/styles/08-new-chinese.png',
    prompt: '极简现代茶室，一位成年东亚女性端坐于低案旁，墨黑色立领真丝上衣搭配玉绿色长裙，手边一只白瓷茶杯，墙面投下竹影，大面积留白，新中式编辑人像，安静端庄。',
    scene: '极简现代茶室', outfit: '墨黑立领真丝上衣、玉绿长裙', camera: '50mm 对称环境构图', light: '柔和天光与竹影',
  }),
  defineStyle({
    id: 'sporty-active', number: '09', name: '活力运动写真', category: 'fashion',
    keywords: ['网球', '运动', '阳光', '活力', '户外'],
    description: '清晨硬朗阳光定格运动间歇，轻盈、健康而有行动感。',
    image: 'assets/styles/09-sporty-active.png',
    prompt: '清晨户外网球场，一位成年东亚女性手持球拍走向边线，白色拉链运动外套与绿色网球裙，裙内有不透明运动短裤，姿态自信自然，明亮阳光和清晰影子，运动品牌画报风格。',
    scene: '清晨户外网球场', outfit: '白色运动外套、绿色网球裙与安全短裤', camera: '35mm 动态全身照', light: '清脆晨间阳光',
  }),
  defineStyle({
    id: 'travel-vacation', number: '10', name: '旅行假日写真', category: 'lifestyle',
    keywords: ['旅行', '地中海', '露台', '海景', '度假'],
    description: '海风、赤陶和蓝色地平线组成明亮松弛的假日记忆。',
    image: 'assets/styles/10-travel-vacation.png',
    prompt: '地中海白色灰泥露台，一位成年东亚女性身穿赤陶色裹身及踝连衣裙，手持编织草帽，远处是蓝色海面，微风吹动裙摆，明亮通透的高端旅行杂志摄影。',
    scene: '地中海白色露台', outfit: '赤陶色及踝裹身裙、编织草帽', camera: '35mm 环境全身照', light: '明亮柔化日光',
  }),
  defineStyle({
    id: 'studio-retouched', number: '11', name: '影楼精修写真', category: 'fashion',
    keywords: ['影棚', '精修', '黑色西装', '专业', '质感'],
    description: '精确布光与克制修饰兼顾高级完成度和真实皮肤质感。',
    image: 'assets/styles/11-studio-retouched.png',
    prompt: '炭灰无缝影棚，一位成年东亚女性身穿黑色缎面西装与象牙白内搭，半身正面肖像，神态沉静自信，皮肤精致但保留自然纹理，轮廓清楚，商业影楼高级精修质感。',
    scene: '炭灰专业影棚', outfit: '黑色缎面西装、象牙白内搭', camera: '85mm 半身肖像', light: '大号八角柔光箱与细微轮廓光',
  }),
  defineStyle({
    id: 'oriental-voluptuous', number: '12', name: '东方丰腴写真', category: 'curve',
    keywords: ['旗袍', '丰腴', '东方', '丝绒', '端庄'],
    description: '丝绒与暖木衬托成熟柔和的自然体态，端庄而富有力量。',
    image: 'assets/styles/12-oriental-voluptuous.png',
    prompt: '暖木色东方沙龙，一位拥有成熟柔和自然体态的成年东亚女性从容站立，穿梅子色长袖丝绒旗袍，端庄低开口领型，剪裁合身但不暴露，神态平静，古典肖像氛围。',
    scene: '暖木色东方沙龙', outfit: '梅子色长袖丝绒旗袍', camera: '70mm 三分之二身肖像', light: '暖侧光与柔和暗部',
  }),
  defineStyle({
    id: 'cold-xianxia-enhanced', number: '13', name: '清冷仙气古风增强版', category: 'fantasy',
    keywords: ['雪山', '冰蓝', '仙侠', '月光', '清冷'],
    description: '冰雾、月色和银饰构成疏离通透的高寒仙侠世界。',
    image: 'assets/styles/13-cold-xianxia-enhanced.png',
    prompt: '覆雪山脊与流动冰雾间，一位成年东亚女性身着冰蓝色古风长袍，银色发饰和淡色披风，衣料被风轻轻扬起，表情清冷克制，远景月色，史诗仙侠电影剧照般的写实画面。',
    scene: '月色雪山与冰雾', outfit: '冰蓝古风长袍、淡色披风、银饰', camera: '65mm 电影环境肖像', light: '冷月光与雾面反射',
  }),
  defineStyle({
    id: 'bright-luxury-gufeng', number: '14', name: '明媚华贵古风增强版', category: 'fantasy',
    keywords: ['宫苑', '华贵', '汉服', '牡丹', '金红'],
    description: '朱红与古金铺陈盛景，让传统华服呈现明艳而不俗艳的贵气。',
    image: 'assets/styles/14-bright-luxury-gufeng.png',
    prompt: '盛放牡丹的宫苑，一位成年东亚女性身着朱红与古金刺绣汉服，佩戴精致金色发簪，姿态端正大方，宫墙与花影形成层次，面容明媚，色彩富丽而克制，高规格古装电影美术。',
    scene: '牡丹盛放的宫苑', outfit: '朱红古金刺绣汉服、金色发簪', camera: '50mm 华丽环境人像', light: '温暖日光与金色反射',
  }),
  defineStyle({
    id: 'ultra-close-real-face', number: '15', name: '超近景真实人脸人像', category: 'realism',
    keywords: ['特写', '真实皮肤', '毛孔', '自然', '人脸'],
    description: '把毛孔、细小绒毛与眼神都留在画面里，真实本身就是风格。',
    image: 'assets/styles/15-ultra-close-real-face.png',
    prompt: '北向窗边的超近景面部肖像，一位成年东亚女性妆容极淡，眼神自然看向镜头，清楚保留真实毛孔、细小绒毛与肤色变化，不做塑料磨皮，背景极简柔化，安静的当代写实摄影。',
    scene: '北向窗边极简背景', outfit: '仅露出简洁中性色领口', camera: '85mm 微距感超近特写', light: '均匀北向窗光',
  }),
  defineStyle({
    id: 'ancient-lady-dewy-makeup', number: '16', name: '古风贵女水光妆', category: 'beauty',
    keywords: ['水光妆', '贵女', '古风', '玉饰', '美妆'],
    description: '莹润妆面、玉饰与漆屏细节，呈现精致又有呼吸感的古典美。',
    image: 'assets/styles/16-ancient-lady-dewy-makeup.png',
    prompt: '深色漆屏前的古风美妆特写，一位成年东亚女性佩戴温润玉饰，玫瑰色唇妆，淡金刺绣衣领，肌肤呈自然水光而非过度磨皮，神态端庄，传统贵女气质与现代美妆广告质感结合。',
    scene: '深色漆屏前', outfit: '淡金刺绣衣领、温润玉饰', camera: '100mm 美妆近景', light: '柔亮主光与精细眼神光',
  }),
  defineStyle({
    id: 'black-pearl-dark-gold-ccd', number: '17', name: '黑珍珠墨金CCD曲线生活照', category: 'curve',
    keywords: ['CCD', '墨金', '夜景', '直闪', '曲线'],
    description: '黑夜、金色倒影和柔化直闪，制造浓郁却仍然生活化的胶片瞬间。',
    image: 'assets/styles/17-black-pearl-dark-gold-ccd.png',
    prompt: '夜晚城市河岸，一位成年东亚女性倚近栏杆站立，珍珠灰衬衫搭配深色长裤，衣着完整并自然呈现柔和轮廓，湿润地面映出金色灯光，消费级 CCD 相机的柔化直闪与轻微噪点，墨黑金色调。',
    scene: '夜晚城市河岸', outfit: '珍珠灰衬衫、深色长裤', camera: 'CCD 35mm 等效生活快照', light: '柔化直闪与湿地金色反光',
  }),
  defineStyle({
    id: 'soft-ccd-energetic-voluptuous', number: '18', name: '元气丰腴柔光CCD生活照', category: 'curve',
    keywords: ['CCD', '花市', '元气', '柔光', '自然笑容'],
    description: '鲜花与自然笑容冲淡摆拍感，柔光 CCD 留下鲜活又亲近的气息。',
    image: 'assets/styles/18-soft-ccd-energetic-voluptuous.png',
    prompt: '白天花市入口，一位拥有健康柔和自然体态的成年东亚女性抱着一束鲜花自然微笑，珊瑚色衬衫和浅色牛仔裤，完整日常穿搭，随手抓拍般的姿态，柔和 CCD 闪光与略微过曝的清新色彩。',
    scene: '白天花市入口', outfit: '珊瑚色衬衫、浅色牛仔裤', camera: 'CCD 生活抓拍', light: '柔和补闪与明亮自然光',
  }),
  defineStyle({
    id: 'cold-white-clear-ccd-curve', number: '19', name: '冷白清透CCD曲线生活照', category: 'curve',
    keywords: ['CCD', '冷白', '画廊', '清透', '极简'],
    description: '冷白空间和青色阴影压低情绪，让日常造型呈现清冽秩序。',
    image: 'assets/styles/19-cold-white-clear-ccd-curve.png',
    prompt: '极简混凝土画廊，一位成年东亚女性肩背小包从容站立，淡灰罗纹针织上衣与白色阔腿长裤，衣着完整并自然呈现身体轮廓，清冷白色调、青色阴影、轻微 CCD 颗粒，通透明快。',
    scene: '极简混凝土画廊', outfit: '淡灰罗纹针织、白色阔腿长裤', camera: 'CCD 40mm 等效全身照', light: '冷白顶光与青色阴影',
  }),
  defineStyle({
    id: 'low-key-cinematic-photography', number: '20', name: '低调电影感摄影', category: 'cinematic',
    keywords: ['电影院', '低调', '电影感', '酒红', '光影'],
    description: '一盏暖灯划开深色空间，像故事开场前停留的一帧。',
    image: 'assets/styles/20-low-key-cinematic.png',
    prompt: '独立电影院大堂，一位成年东亚女性站在酒红天鹅绒帘幕旁，穿端庄黑色长袖连衣裙，视线越过镜头，一盏暖色实景灯照亮侧脸，其余空间沉入炭黑与酒红阴影，低调电影摄影与细腻胶片颗粒。',
    scene: '独立电影院大堂', outfit: '端庄黑色长袖连衣裙', camera: '50mm 电影剧照构图', light: '暖色实景灯与深暗环境',
  }),
];

function getStyleById(id) {
  return STYLES.find((style) => style.id === id);
}




const CATEGORY_LABELS = new Map(CATEGORIES.map(({ id, label }) => [id, label]));
const state = { category: 'all', query: '' };

const elements = {
  categories: document.querySelector('#category-list'),
  search: document.querySelector('#style-search'),
  count: document.querySelector('#result-count'),
  gallery: document.querySelector('#gallery'),
  empty: document.querySelector('#empty-state'),
  reset: document.querySelector('#reset-filters'),
  dialog: document.querySelector('#style-dialog'),
  dialogClose: document.querySelector('#dialog-close'),
  dialogImage: document.querySelector('#dialog-image'),
  dialogFallback: document.querySelector('#dialog-fallback'),
  dialogFallbackNumber: document.querySelector('#dialog-fallback-number'),
  dialogNumber: document.querySelector('#dialog-number'),
  dialogCategory: document.querySelector('#dialog-category'),
  dialogTitle: document.querySelector('#dialog-title'),
  dialogDescription: document.querySelector('#dialog-description'),
  detailScene: document.querySelector('#detail-scene'),
  detailOutfit: document.querySelector('#detail-outfit'),
  detailCamera: document.querySelector('#detail-camera'),
  detailLight: document.querySelector('#detail-light'),
  dialogPrompt: document.querySelector('#dialog-prompt'),
  copy: document.querySelector('#copy-prompt'),
  toast: document.querySelector('#toast'),
};

let activeStyle;
let lastTrigger;
let toastTimer;

function createFilterButton(id, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'filter-button';
  button.dataset.category = id;
  button.setAttribute('aria-pressed', String(id === state.category));
  button.textContent = label;
  button.addEventListener('click', () => {
    state.category = id;
    render();
  });
  return button;
}

function renderFilters() {
  const fragment = document.createDocumentFragment();
  fragment.append(createFilterButton('all', '全部'));
  CATEGORIES.forEach(({ id, label }) => fragment.append(createFilterButton(id, label)));
  elements.categories.replaceChildren(fragment);
}

function updateFilterSelection() {
  elements.categories.querySelectorAll('.filter-button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.category === state.category));
  });
}

function handleImageError(image, fallback) {
  image.hidden = true;
  fallback.hidden = false;
}

function createStyleCard(style, index) {
  const article = document.createElement('article');
  article.className = 'style-card';

  const openButton = document.createElement('button');
  openButton.type = 'button';
  openButton.className = 'style-card__button';
  openButton.setAttribute('aria-label', `查看${style.name}详情`);

  const visual = document.createElement('div');
  visual.className = 'style-card__visual';

  const image = document.createElement('img');
  image.src = style.image;
  image.alt = `${style.name}风格样例`;
  image.loading = index < 4 ? 'eager' : 'lazy';
  image.decoding = 'async';

  const fallback = document.createElement('div');
  fallback.className = 'image-fallback';
  fallback.setAttribute('aria-hidden', 'true');
  const fallbackNumber = document.createElement('span');
  fallbackNumber.textContent = style.number;
  const fallbackText = document.createElement('small');
  fallbackText.textContent = 'IMAGE STUDY PENDING';
  fallback.append(fallbackNumber, fallbackText);
  image.addEventListener('error', () => handleImageError(image, fallback), { once: true });

  const caption = document.createElement('div');
  caption.className = 'style-card__caption';
  const topline = document.createElement('div');
  topline.className = 'style-card__topline';
  const number = document.createElement('span');
  number.textContent = `No. ${style.number}`;
  const category = document.createElement('span');
  category.textContent = CATEGORY_LABELS.get(style.category);
  topline.append(number, category);
  const title = document.createElement('h3');
  title.textContent = style.name;
  const description = document.createElement('p');
  description.className = 'style-card__description';
  description.textContent = style.description;
  caption.append(topline, title, description);
  visual.append(image, fallback);
  openButton.append(visual, caption);
  openButton.addEventListener('click', () => openStyle(style, openButton));

  const promptPanel = document.createElement('div');
  promptPanel.className = 'style-card__prompt';
  const promptText = document.createElement('p');
  promptText.textContent = style.prompt;
  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.className = 'card-copy-button';
  copyButton.textContent = '复制提示词';
  copyButton.addEventListener('click', () => copyText(style.prompt));
  promptPanel.append(promptText, copyButton);

  article.append(openButton, promptPanel);
  return article;
}

function render() {
  updateFilterSelection();
  const matches = filterStyles(STYLES, {
    categories: CATEGORIES,
    category: state.category,
    query: state.query
  });
  const fragment = document.createDocumentFragment();
  matches.forEach((style, index) => fragment.append(createStyleCard(style, index)));
  elements.gallery.replaceChildren(fragment);
  elements.count.textContent = formatResultCount(matches.length);
  elements.gallery.hidden = matches.length === 0;
  elements.empty.hidden = matches.length !== 0;
}

function renderCatalogError(errors) {
  const number = document.createElement('p');
  number.className = 'empty-state__number';
  number.textContent = '!';

  const title = document.createElement('h3');
  title.textContent = '风格目录加载失败';

  const guidance = document.createElement('p');
  guidance.textContent = '目录数据不完整，页面已停止渲染。请修正以下问题后重新打开：';

  const list = document.createElement('ul');
  errors.forEach((error) => {
    const item = document.createElement('li');
    item.textContent = error;
    list.append(item);
  });

  elements.categories.replaceChildren();
  elements.search.disabled = true;
  elements.gallery.replaceChildren();
  elements.gallery.hidden = true;
  elements.count.textContent = '目录加载失败';
  elements.empty.setAttribute('role', 'alert');
  elements.empty.replaceChildren(number, title, guidance, list);
  elements.empty.hidden = false;
}

function openStyle(style, trigger) {
  activeStyle = style;
  lastTrigger = trigger;
  elements.dialogNumber.textContent = `No. ${style.number}`;
  elements.dialogCategory.textContent = CATEGORY_LABELS.get(style.category);
  elements.dialogTitle.textContent = style.name;
  elements.dialogDescription.textContent = style.description;
  elements.detailScene.textContent = style.details.scene;
  elements.detailOutfit.textContent = style.details.outfit;
  elements.detailCamera.textContent = style.details.camera;
  elements.detailLight.textContent = style.details.light;
  elements.dialogPrompt.textContent = style.prompt;
  elements.dialogFallbackNumber.textContent = style.number;
  elements.dialogImage.hidden = false;
  elements.dialogFallback.hidden = true;
  elements.dialogImage.src = style.image;
  elements.dialogImage.alt = `${style.name}风格大图`;
  elements.dialog.showModal();
}

function closeDialog() {
  elements.dialog.close();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 2200);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('提示词已复制');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    showToast(copied ? '提示词已复制' : '复制失败，请手动选择提示词');
  }
}

function copyPrompt() {
  if (activeStyle) return copyText(activeStyle.prompt);
}

elements.search.addEventListener('input', (event) => {
  state.query = event.currentTarget.value;
  render();
});

elements.reset.addEventListener('click', () => {
  state.category = 'all';
  state.query = '';
  elements.search.value = '';
  render();
  elements.search.focus();
});

elements.dialogImage.addEventListener('error', () => {
  handleImageError(elements.dialogImage, elements.dialogFallback);
});

elements.dialogClose.addEventListener('click', closeDialog);
elements.copy.addEventListener('click', copyPrompt);
elements.dialog.addEventListener('click', (event) => {
  if (event.target === elements.dialog) closeDialog();
});
elements.dialog.addEventListener('close', () => lastTrigger?.focus());

document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== elements.search && !elements.dialog.open) {
    event.preventDefault();
    elements.search.focus();
  }
});

const validation = validateCatalog(STYLES, { categories: CATEGORIES });
if (validation.valid) {
  renderFilters();
  render();
} else {
  renderCatalogError(validation.errors);
}

})();
