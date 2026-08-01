// 20 种已实现风格定义
// 基于 upstream skill/style-registry.md

const STYLES = [
  // ============ lifestyle ============
  {
    id: 'clean-lifestyle',
    name: '清纯生活照',
    category: 'lifestyle',
    keywords: ['清纯', '温柔', '自然', '咖啡馆', '窗边'],
    description: '温和、自然、生活剧照感的真实摄影风格',
    reference: 'assets/cases/01-clean-lifestyle.png'
  },
  {
    id: 'pure-desire-curve',
    name: '纯欲曲线生活照',
    category: 'curve',
    keywords: ['纯欲', '曲线', '锁骨', '腰线', '贴身吊带'],
    description: '安静、克制但带有吸引力的曲线生活照风格',
    reference: 'assets/cases/06-pure-desire-curve.png'
  },
  {
    id: 'urban-fashion',
    name: '都市时尚写真',
    category: 'fashion',
    keywords: ['都市', '街拍', 'OOTD', '通勤', '西装', '风衣'],
    description: '现代都市女性的时尚街拍风格',
    reference: 'assets/cases/02-urban-fashion.png'
  },
  {
    id: 'gufeng-xianxia',
    name: '古风仙侠美人图',
    category: 'fantasy',
    keywords: ['古风', '仙侠', '唐风', '古偶', '披帛', '云雾山水'],
    description: '东方幻想唐风审美的仙侠角色写真',
    reference: 'assets/cases/03-gufeng-xianxia.png'
  },
  {
    id: 'ecommerce-tryon',
    name: '电商服装模特图',
    category: 'commercial',
    keywords: ['电商', '主图', '详情页', '试衣', '不要色差'],
    description: '电商商品展示服装，保留服装展示优先级',
    reference: 'assets/cases/04-ecommerce-model.png'
  },
  {
    id: 'retro-hongkong',
    name: '复古港风写真',
    category: 'lifestyle',
    keywords: ['港风', '港片女主', '旧香港', '茶餐厅', '霓虹', '胶片'],
    description: '复古港片质感的胶片摄影风格',
    reference: 'assets/cases/04-retro-hongkong-street.png'
  },
  {
    id: 'french-lazy',
    name: '法式慵懒写真',
    category: 'lifestyle',
    keywords: ['法式', '慵懒', '松弛', '公寓', '阳台', '奶油暖白'],
    description: '法式慵懒质感的奶油暖白调摄影',
    reference: 'assets/cases/05-french-lazy.png'
  },
  {
    id: 'new-chinese',
    name: '新中式东方写真',
    category: 'oriental',
    keywords: ['新中式', '东方美学', '茶室', '屏风', '竹影', '留白'],
    description: '新中式东方美学与现代审美的融合',
    reference: 'assets/cases/06-new-chinese.png'
  },
  {
    id: 'sporty-active',
    name: '活力运动写真',
    category: 'fashion',
    keywords: ['运动', '活力', '网球', '跑道', '健身', '健康线条'],
    description: '充满活力的运动场景人像风格',
    reference: 'assets/cases/07-sporty-active.svg'
  },
  {
    id: 'travel-vacation',
    name: '旅行假日写真',
    category: 'lifestyle',
    keywords: ['旅行', '假日', '度假', '酒店阳台', '民宿', '海岛'],
    description: '旅行度假场景的明亮清新摄影风格',
    reference: 'assets/cases/08-travel-vacation.svg'
  },
  {
    id: 'studio-retouched',
    name: '影楼精修写真',
    category: 'fashion',
    keywords: ['影楼', '精修', '棚拍', '写真馆', '社交头像'],
    description: '影楼棚拍质感的精修人像风格',
    reference: 'assets/cases/09-studio-retouched.svg'
  },
  {
    id: 'oriental-voluptuous',
    name: '东方丰腴写真',
    category: 'curve',
    keywords: ['东方丰腴', '丰润', '柔润', '成熟曲线', '旗袍曲线'],
    description: '东方丰腴美的成熟曲线写真',
    reference: 'assets/cases/10-oriental-voluptuous.svg'
  },
  {
    id: 'cold-xianxia-enhanced',
    name: '清冷仙气古风增强版',
    category: 'fantasy',
    keywords: ['清冷仙气', '冷白', '疏离', '空灵', '月白', '冰蓝'],
    description: '清冷疏离的仙气古风增强版',
    reference: 'assets/cases/11-cold-xianxia.svg'
  },
  {
    id: 'bright-luxury-gufeng',
    name: '明媚华贵古风增强版',
    category: 'fantasy',
    keywords: ['明媚华贵', '盛唐', '红金', '宫廷', '华服', '重工头饰'],
    description: '盛唐红金宫廷风华贵古风增强版',
    reference: 'assets/cases/12-bright-luxury-gufeng.svg'
  },
  {
    id: 'ultra-close-real-face',
    name: '超近景真实人脸人像',
    category: 'realism',
    keywords: ['超近景', '怼脸', '未修图原片', '真实皮肤', '毛孔', '微纹理'],
    description: '超近景怼脸、真实皮肤微纹理质感',
    reference: 'assets/cases/13-ultra-close-face.svg'
  },
  {
    id: 'ancient-lady-dewy-makeup',
    name: '古风贵女水光妆',
    category: 'beauty',
    keywords: ['古风贵女', '水光妆', '玻璃唇', '贵女美妆特写', '富养感'],
    description: '古风贵女身份的水光妆美妆特写',
    reference: 'assets/cases/14-dewy-makeup.svg'
  },
  {
    id: 'black-pearl-dark-gold-ccd',
    name: '黑珍珠墨金CCD曲线生活照',
    category: 'curve',
    keywords: ['黑珍珠', '墨金', '暗金反光', '夜间', '柔和直闪', 'CCD'],
    description: '夜间黑珍珠墨金暗部 CCD 风格',
    reference: 'assets/cases/15-black-pearl-ccd.svg'
  },
  {
    id: 'soft-ccd-energetic-voluptuous',
    name: '元气丰腴柔光CCD生活照',
    category: 'curve',
    keywords: ['柔光CCD', '元气', '丰腴自然曲线', '亮色夏日', '柔闪'],
    description: '元气丰腴柔光 CCD 夏日生活照',
    reference: 'assets/cases/16-soft-ccd.svg'
  },
  {
    id: 'cold-white-clear-ccd-curve',
    name: '冷白清透CCD曲线生活照',
    category: 'curve',
    keywords: ['冷白清透', '日间CCD', '高色温', '纤细曲线', '贴身针织'],
    description: '冷白清透日间 CCD 纤细曲线风格',
    reference: 'assets/cases/17-cold-white-ccd.svg'
  },
  {
    id: 'low-key-cinematic-photography',
    name: '低调电影感摄影',
    category: 'cinematic',
    keywords: ['低照度', '暗背景', '局部连续光', '可读暗部', '低饱和电影静帧'],
    description: '低调电影感的局部连续光摄影风格',
    reference: 'assets/cases/18-low-key-cinematic.svg'
  }
];

// 用于按照分类排序的颜色
const CATEGORY_COLORS = {
  lifestyle: '#10b981',
  curve: '#ec4899',
  fashion: '#3b82f6',
  fantasy: '#a855f7',
  commercial: '#f59e0b',
  oriental: '#84cc16',
  beauty: '#f43f5e',
  realism: '#64748b',
  cinematic: '#0f172a'
};