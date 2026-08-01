// 提示词生成引擎
// 根据风格和参数生成五段式提示词 + 负面约束
// 基于 upstream skill/skill.md 的导演式工作流

const PROMPT_TEMPLATES = {
  // ============ 清纯生活照 ============
  'clean-lifestyle': {
    defaults: {
      age: '24-28 岁年轻成年东方女性，成年气质明确',
      face: '柔和流畅的鹅蛋脸，眉形自然舒展，眼神干净温柔，鼻型秀气，唇形柔软，唇色清淡',
      body: '自然协调身形',
      camera: '半身到大腿以上构图，平视略偏侧前方机位，自然浅景深',
      light: '柔和窗光从侧前方落在脸侧、发丝和服装纹理',
      filter: '真实电影生活剧照滤镜，中性略暖、低饱和、中低对比度，高光柔和，暗部保留层次'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect} 竖幅、真实摄影质感的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '温柔、自然、安静'}气质明确，清透淡妆保留真实皮肤纹理。`,

        `${p.time_hint || '午后'}时分，她身处${p.scene}，${p.action_hint || '刚刚放下手中的书，手指仍停留在书页边缘，肩颈放松，身体略微侧向窗边，视线越过物体看向远方，没有刻意看镜头'}。${p.body || defaults.body}，坐姿或站姿稳定而松弛。`,

        `${p.outfit}，${p.outfit_detail || '材质与层次自然协调，袖口与领口细节清晰'}。${p.mood || '自然、安静'}气质通过服饰质感和肢体语言自然呈现。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景只保留${p.env_detail || '少量关键环境细节'}。背景虚化自然，不抢主体。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '肤色真实通透，带极轻微电影颗粒，自然浅景深'}。`
      ];
    },
    negative: '未成年感，幼态化，学生感，儿童化，网红整容脸，假面感，过度磨皮，僵硬摆拍，道具堆砌，背景杂乱，廉价影楼风，强 AI 感，肢体畸形，手部畸形，过曝，过暗，裸露，色情'
  },

  // ============ 纯欲曲线生活照 ============
  'pure-desire-curve': {
    defaults: {
      age: '24-28 岁年轻成年东方女性，成年状态明确',
      face: '自然柔和的清秀脸型，眉眼舒展，眼神安静干净，鼻型秀气，唇色清透，妆容克制',
      body: '自然吸引力曲线，身形吸引力强度为中',
      camera: '大腿以上构图，平视略偏侧前方机位',
      light: '柔和傍晚光落在脸侧、肩颈、锁骨和衣料褶皱',
      filter: '冷白纯欲生活照滤镜，冷白色温、低饱和、中低对比度，高光干净，阴影柔和'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect} 竖幅、真实摄影质感的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '安静、克制、有吸引力'}气质。`,

        `${p.time_hint || '傍晚散步途中'}，她身处${p.scene}，${p.action_hint || '短暂停下，身体轻微侧向远处，肩膀放松，重心自然落在后侧腿，视线越过物体望向远方'}。${p.line_focus || '肩颈舒展，锁骨线条清晰，腰线自然收束'}。`,

        `${p.outfit}，${p.outfit_detail || '形成清爽层次，海风或微风轻轻带起衣料边缘'}。${p.line_focus || '肩颈、锁骨、腰线和腿部比例'}自然呈现。`,

        `采用${p.camera || defaults.camera}和自然浅景深。背景只保留${p.env_detail || '少量环境投影与光影细节'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；肤质清透但不过度磨皮。`
      ];
    },
    negative: '年龄模糊，未成年感，幼态化，裸露，色情，情趣化，刻意挑逗，局部凝视式特写，夸张比例，僵硬摆拍，塑料皮肤，背景杂乱，廉价影楼风，强 AI 感，肢体畸形，手部畸形'
  },

  // ============ 都市时尚写真 ============
  'urban-fashion': {
    defaults: {
      age: '24-30 岁年轻成年东方女性',
      face: '清晰立体的五官，眉眼间带着都市气场，唇色为高级哑光',
      body: '都市职业女性身形，姿态挺拔',
      camera: '中景半身或全身构图，平视或略仰视机位',
      light: '城市环境光，结合橱窗或建筑反光',
      filter: '高级都市街拍滤镜，中性色温或偏冷，中等对比度'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、真实摄影质感的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '自信、都市、干练'}气质。`,

        `都市街拍场景中，她在${p.scene}，${p.action_hint || '步履自然地行走或短暂停留，手插口袋或拎包，视线自然'}。${p.body || defaults.body}，气场稳定。`,

        `${p.outfit}，${p.outfit_detail || '服装剪裁精良，材质与版型展现都市高级感'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景保留${p.env_detail || '建筑线条、橱窗、街景层次'}。`,

        `${p.light || defaults.light}落在她身上。整体采用${p.filter || defaults.filter}；保留真实摄影的城市氛围与时尚质感。`
      ];
    },
    negative: '未成年感，幼态化，廉价快时尚感，僵硬摆拍，塑料皮肤，背景杂乱，强 AI 感，肢体畸形，手部畸形，网红整容脸，过度磨皮'
  },

  // ============ 古风仙侠美人图 ============
  'gufeng-xianxia': {
    defaults: {
      age: '24-28 岁年轻成年东方女性',
      face: '柔和端庄的古典东方轮廓，眉眼含蓄，眼神清冷克制，妆容精细',
      body: '纤细清瘦身形，仪态稳定',
      camera: '半身到大腿构图，平视略偏侧前方机位，柔和浅景深',
      light: '冷调柔光落在脸侧、衣料褶皱和披帛边缘',
      filter: '清冷仙气古风滤镜，冷白色温、低饱和、中低对比度、柔雾高光和轻微轮廓光'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、真实摄影质感的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '清冷、疏离、仙气'}气质。`,

        `她刚穿过${p.scene}，${p.action_hint || '在廊柱或山石之间短暂停步，身体轻微转向，眼神越过镜头落向远处'}。${p.body || defaults.body}，披帛或衣料被薄风带起。`,

        `${p.outfit}，${p.outfit_detail || '形成层次，刺绣腰封收束轮廓，少量发饰提供细微光泽'}。月白/浅色为主色，金属色为辅色，珍珠光泽作为点缀。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景只保留${p.env_detail || '虚化柱廊、薄雾和淡远山水'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；呈现角色海报完成度。`
      ];
    },
    negative: '未成年感，现代服装，现代妆造，廉价 cosplay 感，喜庆婚服感，头饰堆叠，配色杂乱，过度仙光，背景拥挤，塑料皮肤，服装结构混乱，强 AI 感，肢体畸形，手部畸形'
  },

  // ============ 电商服装模特图 ============
  'ecommerce-tryon': {
    defaults: {
      age: '24-30 岁年轻成年东方女性',
      face: '干净自然的商业模特脸，五官清晰，妆容清透',
      body: '标准电商模特身形，比例协调',
      camera: '全身或大腿以上正面站姿，背景纯净',
      light: '均匀棚拍柔光，无明显阴影',
      filter: '电商无色差滤镜，色彩还原真实'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、电商商品展示风格的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}。`,

        `她在${p.scene || '纯色或简洁背景前'}，${p.action_hint || '正面站姿展示服装，姿态自然稳重'}。${p.body || defaults.body}。`,

        `${p.outfit}作为核心展示对象，${p.outfit_detail || '服装版型、剪裁、颜色、材质和图案必须清晰可辨，不要色差'}。`,

        `采用${p.camera || defaults.camera}。背景简洁干净，不抢服装主体；${p.env_detail || '纯色或轻微渐变背景'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '服装颜色与图片保持一致，不偏色'}。`
      ];
    },
    negative: '未成年感，背景杂乱，背景抢戏，过度滤镜，色差变形，服装结构模糊，姿态扭曲，肢体畸形，手部畸形，强 AI 感，廉价影楼风'
  },

  // ============ 复古港风写真 ============
  'retro-hongkong': {
    defaults: {
      age: '24-28 岁年轻成年东方女性',
      face: '精致立体的五官，眉眼间带着慵懒风情，妆容浓郁但不过分，唇色为复古正红',
      body: '港风女性身形，姿态慵懒',
      camera: '半身构图，平视机位',
      light: '暖黄霓虹光从侧面打在脸上，暗部保留细节',
      filter: '港风胶片滤镜，高对比、低饱和、暖黄偏色、适度颗粒感'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、复古港风胶片质感的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '慵懒、风情、复古'}气质。`,

        `她站在${p.scene}，${p.action_hint || '肩颈放松，身体轻微侧转，手指随意搭在门框或栏杆边缘，视线越过镜头落向街道方向'}。${p.body || defaults.body}。`,

        `${p.outfit}，${p.outfit_detail || '勾勒出优雅轮廓，复古配饰在霓虹光下微微反光'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景保留${p.env_detail || '霓虹灯牌、斑驳墙面、街灯或茶餐厅玻璃'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；营造旧香港电影氛围。`
      ];
    },
    negative: '未成年感，幼态化，过度磨皮，僵硬摆拍，现代建筑背景，过亮场景，廉价影楼风，强 AI 感，肢体畸形，手部畸形，过度曝光'
  },

  // ============ 法式慵懒写真 ============
  'french-lazy': {
    defaults: {
      age: '24-30 岁年轻成年女性',
      face: '自然舒展的五官，带着慵懒优雅',
      body: '自然协调身形',
      camera: '半身中景，平视机位',
      light: '午后斜阳暖光从侧面落在发丝、侧脸和服装褶皱',
      filter: '法式奶油暖白滤镜，高光柔和不过曝，低对比度，中性偏暖色温'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、法式慵懒风格的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '松弛、自然、优雅'}气质。`,

        `她身处${p.scene}，${p.action_hint || '一手端着咖啡杯或书，另一只手轻轻搭在阳台栏杆或门框上，身体微微侧靠，视线落向远处'}。${p.body || defaults.body}。`,

        `${p.outfit}，${p.outfit_detail || '袖口随意卷起，下装休闲，材质柔软'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景保留${p.env_detail || '复古阳台、铸铁栏杆、远处屋顶或植物'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '保留皮肤和面料的真实质感，营造慵懒松弛的氛围'}。`
      ];
    },
    negative: '过度精致，僵硬摆拍，过度磨皮，浓重妆容，现代建筑，塑料感，强 AI 感，肢体畸形，手部畸形，过曝或过暗'
  },

  // ============ 新中式东方写真 ============
  'new-chinese': {
    defaults: {
      age: '24-28 岁年轻成年东方女性',
      face: '清秀的东方五官，妆容淡雅，眉眼含蓄',
      body: '自然协调身形，姿态舒展',
      camera: '半身构图，平视或略俯视',
      light: '自然柔光，结合竹影或屏风的光影',
      filter: '新中式留白滤镜，低饱和，中性偏冷，柔和影调'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、新中式东方美学风格的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '清雅、含蓄、东方'}气质。`,

        `她身处${p.scene}，${p.action_hint || '安静地坐在茶案前或站在屏风旁，手指轻抚茶具或书页，视线柔和'}。${p.body || defaults.body}。`,

        `${p.outfit}，${p.outfit_detail || '材质含蓄，剪裁简洁'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景保留${p.env_detail || '茶室、屏风、竹影、留白墙面或水墨元素'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '体现东方美学的留白与禅意'}。`
      ];
    },
    negative: '未成年感，浓重妆容，廉价影楼风，现代建筑，过度堆砌，强 AI 感，肢体畸形，手部畸形，背景杂乱，过度饱和'
  },

  // ============ 活力运动写真 ============
  'sporty-active': {
    defaults: {
      age: '24-28 岁年轻成年东方女性',
      face: '清爽有活力的五官，妆容淡雅，唇色自然',
      body: '健康有线条感的身形',
      camera: '中景或全身构图，平视或跟随视角',
      light: '明亮自然光，结合运动场景反光',
      filter: '运动活力滤镜，色彩明亮，中高对比度'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、充满活力的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '活力、健康、运动'}气质。`,

        `她身处${p.scene}，${p.action_hint || '正在运动或刚刚停下，姿态带有自然动感'}。${p.body || defaults.body}。`,

        `${p.outfit}，${p.outfit_detail || '运动装或休闲运动混搭，材质贴合身形'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景保留${p.env_detail || '运动场地、健身器械或户外环境'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '体现健康阳光的氛围'}。`
      ];
    },
    negative: '未成年感，僵硬摆拍，过度修图，背景杂乱，强 AI 感，肢体畸形，手部畸形，夸张身材比例'
  },

  // ============ 旅行假日写真 ============
  'travel-vacation': {
    defaults: {
      age: '24-28 岁年轻成年东方女性',
      face: '放松自然的表情，妆容清透',
      body: '自然协调身形',
      camera: '中景或半身，平视或略仰视',
      light: '明亮户外光，结合度假场景自然光',
      filter: '旅行明亮滤镜，色彩饱和但不过度，中高对比度'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、旅行度假风格的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '放松、明朗、度假'}气质。`,

        `她身处${p.scene}，${p.action_hint || '正在度假中漫步、眺望或停留，神情轻松'}。${p.body || defaults.body}。`,

        `${p.outfit}，${p.outfit_detail || '度假风穿搭，材质轻盈'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景保留${p.env_detail || '酒店阳台、海岛、民宿或远方风景'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '体现旅行的明亮与放松'}。`
      ];
    },
    negative: '未成年感，僵硬摆拍，背景杂乱，强 AI 感，肢体畸形，手部畸形，廉价影楼感，浓重妆容'
  },

  // ============ 影楼精修写真 ============
  'studio-retouched': {
    defaults: {
      age: '24-28 岁年轻成年东方女性',
      face: '精致立体的五官，妆容精致',
      body: '标准模特身形',
      camera: '半身或全身棚拍构图',
      light: '棚拍柔光或蝴蝶光',
      filter: '影楼精修滤镜，中高对比度，肤色均匀'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、影楼精修质感的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '精致、优雅'}气质。`,

        `棚拍环境中，她在${p.scene || '纯色或渐变背景前'}，${p.action_hint || '姿态端庄稳重'}。${p.body || defaults.body}。`,

        `${p.outfit}，${p.outfit_detail || '服装精致，妆容完整'}。`,

        `采用${p.camera || defaults.camera}。背景纯净简洁，${p.env_detail || '棚拍布光或渐变背景'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '呈现写真馆精修完成度'}。`
      ];
    },
    negative: '未成年感，背景杂乱，廉价影楼风，强 AI 感，肢体畸形，手部畸形，过度失真'
  },

  // ============ 东方丰腴写真 ============
  'oriental-voluptuous': {
    defaults: {
      age: '28-35 岁成熟东方女性',
      face: '丰润的东方五官，妆容温润',
      body: '东方丰腴成熟曲线',
      camera: '半身或全身构图',
      light: '柔和漫射光，保留皮肤质感',
      filter: '东方丰腴滤镜，柔润肤质，色调温暖'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、东方丰腴风格的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '丰润、优雅、成熟'}气质。`,

        `她身处${p.scene}，${p.action_hint || '姿态端庄稳重'}。${p.body || defaults.body}。`,

        `${p.outfit}，${p.outfit_detail || '如旗袍或东方丰润剪裁，体现成熟曲线'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景保留${p.env_detail || '东方古典元素'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '保留真实皮肤质感，不油光'}。`
      ];
    },
    negative: '未成年感，刻意挑逗，裸露，色情，夸张比例，塑料皮肤，强 AI 感，肢体畸形，手部畸形'
  },

  // ============ 清冷仙气古风增强版 ============
  'cold-xianxia-enhanced': {
    defaults: {
      age: '24-28 岁年轻成年东方女性',
      face: '清冷疏离的古典五官，眉眼冷峻，妆容清淡冰蓝调',
      body: '纤细清瘦身形',
      camera: '半身或全身构图，平视机位',
      light: '冷调柔光，月白或冰蓝光晕',
      filter: '清冷仙气滤镜，冷白色温，低饱和，柔雾高光'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、清冷仙气古风增强版的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '清冷、疏离、空灵'}气质。`,

        `她身处${p.scene}，${p.action_hint || '宛如独立于世的仙侠角色，姿态清冷'}。${p.body || defaults.body}。`,

        `${p.outfit}，${p.outfit_detail || '月白、冰蓝为主，材质飘逸'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景保留${p.env_detail || '云雾、月色、空灵山水'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '呈现仙气古风的疏离美感'}。`
      ];
    },
    negative: '未成年感，浓重妆容，现代服装，头饰堆砌，过度仙光，塑料皮肤，强 AI 感，肢体畸形，手部畸形，背景杂乱'
  },

  // ============ 明媚华贵古风增强版 ============
  'bright-luxury-gufeng': {
    defaults: {
      age: '24-28 岁年轻成年东方女性',
      face: '明媚华贵的古典五官，妆容盛唐风格',
      body: '丰润端庄身形',
      camera: '半身或全身构图，平视机位',
      light: '明亮暖调光线，体现华贵感',
      filter: '明媚华贵滤镜，暖金调，中高饱和度'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、明媚华贵古风增强版的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '明媚、华贵、盛唐'}气质。`,

        `她身处${p.scene}，${p.action_hint || '宛如盛唐宫廷贵女，姿态端庄华贵'}。${p.body || defaults.body}。`,

        `${p.outfit}，${p.outfit_detail || '红金宫廷华服，重工头饰，刺绣精美'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景保留${p.env_detail || '宫殿、华丽屏风、繁复背景'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '呈现盛唐宫廷的华贵感'}。`
      ];
    },
    negative: '未成年感，廉价 cosplay 感，头饰堆砌过度，塑料感，背景杂乱，强 AI 感，肢体畸形，手部畸形'
  },

  // ============ 超近景真实人脸人像 ============
  'ultra-close-real-face': {
    defaults: {
      age: '24-28 岁年轻成年东方女性',
      face: '真实皮肤质感，毛孔微纹理可见',
      body: '自然协调身形',
      camera: '超近景怼脸构图，从额头到下巴',
      light: '窗边柔光，自然真实',
      filter: '未修图原片质感，保留皮肤纹理'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、超近景怼脸的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '真实、自然、不修饰'}质感。`,

        `她身处${p.scene}，${p.action_hint || '面部表情自然，未刻意修饰'}。`,

        `${p.outfit || '服饰自然简约'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景极简化或虚化，${p.env_detail || '焦点完全在脸部与皮肤纹理'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '保留皮肤毛孔和微小纹理'}。`
      ];
    },
    negative: '过度磨皮，幼态化，网红整容脸，塑料皮肤，假面感，强 AI 感，五官畸形，过度美颜'
  },

  // ============ 古风贵女水光妆 ============
  'ancient-lady-dewy-makeup': {
    defaults: {
      age: '25 岁年轻成年东方女性',
      face: '古典鹅蛋脸，细腻水光底妆，玻璃唇',
      body: '自然协调身形',
      camera: '胸部以上近景，轻微侧身',
      light: '阴天窗边柔光，水润高光',
      filter: '低饱和月白水青，保留真实皮肤纹理'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、古风贵女水光妆风格的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '知性、温柔、富养感'}气质。`,

        `她身处${p.scene}，${p.action_hint || '宛如被静谧捕捉的贵女日常'}。`,

        `${p.outfit}，${p.outfit_detail || '月白交领、水青披帛、珍珠发簪'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景保留${p.env_detail || '半开花窗、书案茶盏、江南元素'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '水光不等于油光，保留真实皮肤纹理'}。`
      ];
    },
    negative: '未成年感，幼态化，网红整容脸，塑料皮肤，过度磨皮，面部油光，满脸镜面高光，水光妆变成湿脸，夸张玻璃唇，浓重舞台妆，廉价影楼古装，cosplay 塑料材质，头饰堆叠，宫廷排场抢戏，仙侠法术特效，现代礼服结构，强 AI 感'
  },

  // ============ 黑珍珠墨金 CCD 曲线 ============
  'black-pearl-dark-gold-ccd': {
    defaults: {
      age: '24-28 岁年轻成年东方女性',
      face: '暗金调妆容，五官精致',
      body: '自然曲线身形',
      camera: '夜间 CCD 直闪构图',
      light: '夜间柔和直闪，暗金反光',
      filter: '黑珍珠墨金 CCD 滤镜，暗部浓郁，暗金高光'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、黑珍珠墨金 CCD 风格的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '神秘、高级、夜间'}质感。`,

        `她身处${p.scene}，${p.action_hint || '夜间场景，姿态自然'}。${p.body || defaults.body}。`,

        `${p.outfit}，${p.outfit_detail || '暗金或黑珍珠配饰，体现夜间高级感'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景保留${p.env_detail || '夜间暗部与墨金反光'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || 'CCD 柔和直闪质感'}。`
      ];
    },
    negative: '未成年感，过度曝光，白天场景，塑料皮肤，强 AI 感，肢体畸形，手部畸形'
  },

  // ============ 元气丰腴柔光 CCD ============
  'soft-ccd-energetic-voluptuous': {
    defaults: {
      age: '24-28 岁年轻成年东方女性',
      face: '元气明亮的五官，妆容清透',
      body: '丰腴自然曲线',
      camera: '柔光 CCD 中景构图',
      light: '柔和直闪，亮色夏日光',
      filter: '柔光 CCD 滤镜，柔闪质感，亮色饱和'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、元气丰腴柔光 CCD 风格的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '元气、明亮、夏日'}气质。`,

        `她身处${p.scene}，${p.action_hint || '夏日场景，姿态轻盈'}。${p.body || defaults.body}。`,

        `${p.outfit}，${p.outfit_detail || '亮色夏日穿搭，体现元气活力'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景保留${p.env_detail || '夏日明亮场景，柔光 CCD 直闪质感'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '呈现柔闪 CCD 质感'}。`
      ];
    },
    negative: '未成年感，幼态化，僵硬摆拍，塑料皮肤，强 AI 感，肢体畸形，手部畸形'
  },

  // ============ 冷白清透 CCD 曲线 ============
  'cold-white-clear-ccd-curve': {
    defaults: {
      age: '24-28 岁年轻成年东方女性',
      face: '冷白清透五官，妆容克制',
      body: '纤细自然曲线',
      camera: '日间 CCD 中景构图',
      light: '日间高色温冷白光',
      filter: '冷白清透 CCD 滤镜，高色温冷白调'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、冷白清透 CCD 风格的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '冷白、清透、知性'}气质。`,

        `她身处${p.scene}，${p.action_hint || '日间场景，姿态克制'}。${p.body || defaults.body}。`,

        `${p.outfit}，${p.outfit_detail || '贴身针织或浅色穿搭，纤细自然曲线'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景保留${p.env_detail || '日间明亮冷白场景'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '冷白清透 CCD 质感'}。`
      ];
    },
    negative: '未成年感，暖色调，塑料皮肤，强 AI 感，肢体畸形，手部畸形'
  },

  // ============ 低调电影感摄影 ============
  'low-key-cinematic-photography': {
    defaults: {
      age: '24-28 岁年轻成年东方女性',
      face: '克制有故事感的五官，妆容低饱和',
      body: '自然协调身形',
      camera: '50mm 半身中景，平视机位',
      light: '窗边弱连续光作为主光，镜头侧前方极弱面部补光',
      filter: '暖棕低饱和电影色彩，暗部保留木纹与服装层次，细腻胶片颗粒'
    },
    buildPrompt: (p, style, defaults) => {
      return [
        `生成一张 ${p.aspect}、低调电影感摄影风格的${style.name}。画面中的人物是一位虚构、${p.age || defaults.age}。她拥有${p.face || defaults.face}，${p.mood || '清冷、知性、克制、有故事感'}气质。`,

        `她身处${p.scene}，${p.action_hint || '宛如电影静帧中的角色，神情克制'}。${p.body || defaults.body}。`,

        `${p.outfit}，${p.outfit_detail || '深色哑光质感服装，体现低调电影感'}。`,

        `采用${p.camera || defaults.camera}。${p.scene}场景保留${p.env_detail || '低照度暗背景，局部连续光可读暗部，电影静帧叙事'}。`,

        `${p.light || defaults.light}。整体采用${p.filter || defaults.filter}；${p.filter_detail || '眼神与五官必须可读，不要直闪，不要纯黑背景，不要青橙滤镜'}。`
      ];
    },
    negative: '未成年感，过度曝光，纯黑背景，直闪，青橙滤镜，过度磨皮，塑料皮肤，强 AI 感，肢体畸形，手部畸形，背景杂乱'
  }
};

// 示例数据 - 用于快速测试
const EXAMPLES = {
  'clean-lifestyle': {
    scene: '午后安静的咖啡馆靠窗座位',
    outfit: '米白针织开衫 + 浅色内搭',
    mood: '温柔、自然、明确成年',
    age: '24-28 岁年轻成年东方女性',
    face: '柔和流畅的鹅蛋脸',
    body: '自然协调身形',
    camera: '半身到大腿构图，平视略偏侧前方机位',
    light: '柔和窗光',
    filter: '真实电影生活剧照滤镜',
    aspect: '3:4',
    action_hint: '刚把翻到一半的书轻轻合上，手指仍停留在书页边缘',
    outfit_detail: '材质柔软细腻，自然贴合肩线',
    env_detail: '书页一角、玻璃上的淡淡雨痕和远处模糊街景',
    filter_detail: '中性略暖色温，自然低饱和，带极轻微电影颗粒'
  },

  'pure-desire-curve': {
    scene: '傍晚海边步道',
    outfit: '雾蓝色贴身短款吊带 + 白色轻薄开衫 + 浅色短裤',
    mood: '安静、克制、有吸引力',
    age: '24-28 岁年轻成年东方女性',
    face: '邻家清秀脸',
    body: '自然吸引力曲线，身形吸引力强度为中',
    camera: '大腿以上构图，平视机位',
    light: '傍晚柔和自然光',
    filter: '冷白纯欲生活照滤镜',
    aspect: '9:16',
    action_hint: '短暂停下，身体轻微侧向海面，视线越过栏杆望向远处',
    outfit_detail: '形成清爽层次，海风轻轻带起开衫边缘',
    env_detail: '栏杆投影与海面反光',
    filter_detail: '冷白色温、低饱和、中低对比度，肤质清透但不过度磨皮'
  },

  'gufeng-xianxia': {
    scene: '云雾山水间的古风庭院回廊',
    outfit: '月白色唐风幻想大袖衫 + 轻盈披帛 + 银色刺绣腰封',
    mood: '清冷、疏离、仙气',
    age: '24-28 岁年轻成年东方女性',
    face: '古典东方美人脸',
    body: '纤细清瘦身形',
    camera: '轻侧身站姿，半身到大腿构图',
    light: '冷调柔光',
    filter: '清冷仙气古风滤镜',
    aspect: '9:16',
    action_hint: '在廊柱之间短暂停步，身体轻微转向，眼神越过镜头落向远处',
    outfit_detail: '银色刺绣腰封收束轮廓，轻盈披帛被薄风带起',
    env_detail: '虚化柱廊、薄雾和淡远山水',
    filter_detail: '冷白色温、低饱和、中低对比度、柔雾高光和轻微轮廓光'
  },

  'retro-hongkong': {
    scene: '霓虹灯光的老街茶餐厅',
    outfit: '红色吊带裙 + 复古珍珠耳环',
    mood: '慵懒、风情、复古',
    age: '24-28 岁年轻成年东方女性',
    face: '精致立体的五官',
    body: '港风女性身形',
    camera: '半身构图，平视机位',
    light: '暖黄霓虹 + 暗部细节',
    filter: '港风胶片感，高对比，低饱和',
    aspect: '3:4',
    action_hint: '肩颈放松，身体轻微侧转，手指随意搭在门框边缘',
    outfit_detail: '勾勒出优雅轮廓，珍珠耳环在霓虹光下微微反光',
    env_detail: '霓虹灯牌和斑驳墙面',
    filter_detail: '暖黄偏色、适度颗粒感，营造旧香港电影氛围'
  },

  'low-key-cinematic-photography': {
    scene: '夜晚旧书店的深木书架与窄窗',
    outfit: '深灰哑光针织上衣 + 黑色长裙',
    mood: '清冷、知性、克制、有故事感',
    age: '24-28 岁年轻成年东方女性',
    face: '克制有故事感的五官',
    body: '自然协调身形',
    camera: '50mm 半身中景',
    light: '窗边弱连续光作为主光',
    filter: '暖棕低饱和电影色彩',
    aspect: '3:4',
    action_hint: '从书架旁侧身站立，眼神沉静',
    outfit_detail: '深色哑光质感服装',
    env_detail: '低照度暗背景，局部连续光可读暗部',
    filter_detail: '细腻胶片颗粒，不要直闪，不要纯黑背景，不要青橙滤镜'
  },

  'urban-fashion': {
    scene: '城市 CBD 的玻璃幕墙与街角',
    outfit: '米色西装外套 + 黑色高领 + 阔腿裤',
    mood: '自信、都市、干练',
    age: '25-30 岁年轻成年东方女性',
    face: '清晰立体的五官，眉眼间带着都市气场',
    body: '都市职业女性身形，姿态挺拔',
    camera: '中景半身，平视略仰视机位',
    light: '城市环境光，结合橱窗反光',
    filter: '高级都市街拍滤镜，中性色温',
    aspect: '3:4',
    action_hint: '步履自然地行走，手拎公文包',
    outfit_detail: '服装剪裁精良，材质与版型展现都市高级感',
    env_detail: '建筑线条、橱窗、街景层次',
    filter_detail: '保留真实摄影的城市氛围'
  },

  'ecommerce-tryon': {
    scene: '纯色背景前',
    outfit: '米色针织连衣裙（电商上传款）',
    mood: '自然、亲和',
    age: '24-28 岁年轻成年东方女性',
    face: '干净自然的商业模特脸',
    body: '标准电商模特身形',
    camera: '全身正面站姿',
    light: '均匀棚拍柔光',
    filter: '电商无色差滤镜，色彩还原真实',
    aspect: '3:4',
    action_hint: '正面站姿展示服装，姿态自然稳重',
    outfit_detail: '服装版型、剪裁、颜色必须清晰可辨',
    env_detail: '纯色或轻微渐变背景',
    filter_detail: '服装颜色与图片保持一致，不偏色'
  },

  'french-lazy': {
    scene: '巴黎公寓的复古铸铁阳台',
    outfit: '米色亚麻衬衫 + 浅蓝牛仔裤卷边',
    mood: '松弛、自然、优雅',
    age: '24-30 岁年轻成年女性',
    face: '自然舒展的五官，带着慵懒优雅',
    body: '自然协调身形',
    camera: '半身中景，平视机位',
    light: '午后斜阳暖光',
    filter: '法式奶油暖白滤镜',
    aspect: '3:4',
    action_hint: '一手端咖啡杯，另一只手搭在阳台栏杆',
    outfit_detail: '袖口随意卷起，下装休闲',
    env_detail: '复古阳台、铸铁栏杆、远处屋顶',
    filter_detail: '保留皮肤和面料的真实质感'
  },

  'new-chinese': {
    scene: '新中式茶室的留白空间',
    outfit: '雾蓝色新中式上衣 + 米白阔腿裤',
    mood: '清雅、含蓄、东方',
    age: '24-28 岁年轻成年东方女性',
    face: '清秀的东方五官，妆容淡雅',
    body: '自然协调身形，姿态舒展',
    camera: '半身构图，平视机位',
    light: '自然柔光，结合竹影光影',
    filter: '新中式留白滤镜，低饱和',
    aspect: '3:4',
    action_hint: '安静地坐在茶案前，手指轻抚茶具',
    outfit_detail: '材质含蓄，剪裁简洁',
    env_detail: '茶室、屏风、竹影、留白墙面',
    filter_detail: '体现东方美学的留白与禅意'
  },

  'sporty-active': {
    scene: '城市网球场的红土场地',
    outfit: '白色网球连衣裙 + 运动鞋',
    mood: '活力、健康、运动',
    age: '24-28 岁年轻成年东方女性',
    face: '清爽有活力的五官，妆容淡雅',
    body: '健康有线条感的身形',
    camera: '中景构图，平视机位',
    light: '明亮自然光，结合运动场景反光',
    filter: '运动活力滤镜，色彩明亮',
    aspect: '3:4',
    action_hint: '刚刚停下击球动作，姿态带有自然动感',
    outfit_detail: '运动装材质贴合身形',
    env_detail: '运动场地、网球拍',
    filter_detail: '体现健康阳光的氛围'
  },

  'travel-vacation': {
    scene: '海岛度假酒店的阳台',
    outfit: '白色蕾丝长裙 + 草编帽',
    mood: '放松、明朗、度假',
    age: '24-28 岁年轻成年东方女性',
    face: '放松自然的表情，妆容清透',
    body: '自然协调身形',
    camera: '中景构图，平视略仰视',
    light: '明亮户外海岛光',
    filter: '旅行明亮滤镜，色彩饱和但不过度',
    aspect: '3:4',
    action_hint: '在阳台边眺望海景，神情轻松',
    outfit_detail: '度假风穿搭，材质轻盈',
    env_detail: '酒店阳台、海岛、远处海面',
    filter_detail: '体现旅行的明亮与放松'
  },

  'studio-retouched': {
    scene: '棚拍纯色背景前',
    outfit: '黑色修身礼服',
    mood: '精致、优雅',
    age: '24-28 岁年轻成年东方女性',
    face: '精致立体的五官，妆容精致',
    body: '标准模特身形',
    camera: '半身棚拍构图',
    light: '棚拍柔光或蝴蝶光',
    filter: '影楼精修滤镜，中高对比度',
    aspect: '3:4',
    action_hint: '姿态端庄稳重',
    outfit_detail: '服装精致，妆容完整',
    env_detail: '棚拍布光或渐变背景',
    filter_detail: '呈现写真馆精修完成度'
  },

  'oriental-voluptuous': {
    scene: '江南水乡的青瓦白墙',
    outfit: '墨绿色旗袍 + 珍珠耳环',
    mood: '丰润、优雅、成熟',
    age: '28-35 岁成熟东方女性',
    face: '丰润的东方五官，妆容温润',
    body: '东方丰腴成熟曲线',
    camera: '半身构图，平视机位',
    light: '柔和漫射光，保留皮肤质感',
    filter: '东方丰腴滤镜，柔润肤质',
    aspect: '3:4',
    action_hint: '姿态端庄稳重，手指轻抚旗袍盘扣',
    outfit_detail: '旗袍剪裁体现成熟曲线',
    env_detail: '青瓦白墙、小桥流水',
    filter_detail: '保留真实皮肤质感，不油光'
  },

  'cold-xianxia-enhanced': {
    scene: '月色下的雪山之巅',
    outfit: '月白冰蓝渐变大袖衫 + 银色发冠',
    mood: '清冷、疏离、空灵',
    age: '24-28 岁年轻成年东方女性',
    face: '清冷疏离的古典五官，眉眼冷峻',
    body: '纤细清瘦身形',
    camera: '全身构图，平视机位',
    light: '冷调柔光，月白冰蓝光晕',
    filter: '清冷仙气滤镜，冷白色温',
    aspect: '9:16',
    action_hint: '宛如独立于世的仙侠角色，姿态清冷',
    outfit_detail: '月白冰蓝为主，材质飘逸',
    env_detail: '云雾、月色、空灵山水',
    filter_detail: '呈现仙气古风的疏离美感'
  },

  'bright-luxury-gufeng': {
    scene: '盛唐宫廷的雕梁画栋',
    outfit: '红金刺绣华服 + 重工金步摇',
    mood: '明媚、华贵、盛唐',
    age: '24-28 岁年轻成年东方女性',
    face: '明媚华贵的古典五官，盛唐妆容',
    body: '丰润端庄身形',
    camera: '半身构图，平视机位',
    light: '明亮暖调光线',
    filter: '明媚华贵滤镜，暖金调',
    aspect: '3:4',
    action_hint: '宛如盛唐宫廷贵女，姿态端庄华贵',
    outfit_detail: '红金宫廷华服，重工头饰',
    env_detail: '宫殿、华丽屏风、繁复背景',
    filter_detail: '呈现盛唐宫廷的华贵感'
  },

  'ultra-close-real-face': {
    scene: '窗边自然光环境',
    outfit: '简约白T恤',
    mood: '真实、自然、不修饰',
    age: '24-28 岁年轻成年东方女性',
    face: '真实皮肤质感，毛孔微纹理可见',
    body: '自然协调身形',
    camera: '超近景怼脸构图',
    light: '窗边柔光，自然真实',
    filter: '未修图原片质感',
    aspect: '3:4',
    action_hint: '面部表情自然，未刻意修饰',
    outfit_detail: '服饰自然简约',
    env_detail: '焦点完全在脸部与皮肤纹理',
    filter_detail: '保留皮肤毛孔和微小纹理'
  },

  'ancient-lady-dewy-makeup': {
    scene: '江南水榭旁的半开花窗',
    outfit: '月白色交领长衫 + 水青披帛 + 珍珠流苏发簪',
    mood: '知性、温柔、富养感',
    age: '25 岁年轻成年东方女性',
    face: '古典鹅蛋脸，细腻水光底妆',
    body: '自然协调身形，仪态舒展',
    camera: '胸部以上近景，轻微侧身',
    light: '阴天窗边柔光',
    filter: '低饱和月白水青',
    aspect: '3:4',
    action_hint: '宛如被静谧捕捉的贵女日常',
    outfit_detail: '领缘袖口浅金细绣，发簪固定发髻',
    env_detail: '半开花窗、书案茶盏',
    filter_detail: '水光不等于油光，保留真实皮肤纹理'
  },

  'black-pearl-dark-gold-ccd': {
    scene: '夜晚酒吧的暗金灯光',
    outfit: '黑色缎面吊带裙 + 暗金配饰',
    mood: '神秘、高级、夜间',
    age: '24-28 岁年轻成年东方女性',
    face: '暗金调妆容，五官精致',
    body: '自然曲线身形',
    camera: '夜间 CCD 直闪构图',
    light: '夜间柔和直闪，暗金反光',
    filter: '黑珍珠墨金 CCD 滤镜',
    aspect: '3:4',
    action_hint: '夜间场景，姿态自然',
    outfit_detail: '暗金或黑珍珠配饰',
    env_detail: '夜间暗部与墨金反光',
    filter_detail: 'CCD 柔和直闪质感'
  },

  'soft-ccd-energetic-voluptuous': {
    scene: '夏日游乐园的明亮场景',
    outfit: '亮黄色吊带 + 白色短裤',
    mood: '元气、明亮、夏日',
    age: '24-28 岁年轻成年东方女性',
    face: '元气明亮的五官，妆容清透',
    body: '丰腴自然曲线',
    camera: '柔光 CCD 中景构图',
    light: '柔和直闪，亮色夏日光',
    filter: '柔光 CCD 滤镜，柔闪质感',
    aspect: '3:4',
    action_hint: '夏日场景，姿态轻盈',
    outfit_detail: '亮色夏日穿搭，体现元气活力',
    env_detail: '夏日明亮场景，柔光 CCD 直闪质感',
    filter_detail: '呈现柔闪 CCD 质感'
  },

  'cold-white-clear-ccd-curve': {
    scene: '咖啡馆的明亮落地窗',
    outfit: '冷白色贴身针织 + 浅蓝牛仔裤',
    mood: '冷白、清透、知性',
    age: '24-28 岁年轻成年东方女性',
    face: '冷白清透五官，妆容克制',
    body: '纤细自然曲线',
    camera: '日间 CCD 中景构图',
    light: '日间高色温冷白光',
    filter: '冷白清透 CCD 滤镜',
    aspect: '3:4',
    action_hint: '日间场景，姿态克制',
    outfit_detail: '贴身针织或浅色穿搭，纤细自然曲线',
    env_detail: '日间明亮冷白场景',
    filter_detail: '冷白清透 CCD 质感'
  }
};