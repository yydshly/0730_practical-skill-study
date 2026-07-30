/* =====================================================
   journal.js — 工艺日志节点点击切换 detail panel
   原 IIFE 6 提取
   Phase A · family-orchard 模块化重构
   ===================================================== */

const NODES = {
  v0: {
    title: 'v0 · 起始 Prompt',
    body: '从最简 brief 出发:农林品牌 + 卖多种水果(苹果/梨/桃/杏/李/柿/樱桃/猕猴桃/...) + 面向个人礼盒 + 商超供货。' +
          '经 finesse-ui skill 的 Quiet Luxury Minimal + Forest palette 双向选型,' +
          '生成出涵盖 5 节、含 6 个输出规格强约束的完整初始指令。' +
          '5 层真元素(hero / 四季果品 / 农场故事 / 配送 / 双入口表单)全在第一稿定下。'
  },
  v1: {
    title: 'v1 · AI 出图替代 SVG 占位',
    body: '原 8 张手写 SVG 果品图 + hero/story 场景 SVG 被认为"占位感太明显"。' +
          '改用 Pollinations.ai 免费图像生成 API(无密钥),' +
          '为每个水果写一段英文 studio food photography 提示词,得到 600×750 的真实摄影风格图;' +
          'hero 与 story 也一并替换为真实影棚/纪实风格成片。' +
          '本次共 9-10 张图,平均 ~40 KB 每张,完全自托管。'
  },
  v2: {
    title: 'v2 · 色温与饱和度统一',
    body: 'AI 生成的 9 张图各自有不同色温(樱桃偏暖、猕猴桃偏冷、李子过饱和),' +
          '看起来不像一套。给所有 .fruit-img img 加 <code>filter: saturate(.92) contrast(1.04) brightness(1.02)</code>,' +
          '再叠一层 mix-blend-mode soft-light 的暖色 overlay,8 张图视觉上明显一致。' +
          '同时把每个果品的 hotspot 从 2 个升到 3 个 (糖度/海拔/<strong>采收日</strong>)。'
  },
  v3: {
    title: 'v3 · 移动端抽屉菜单',
    body: '原响应式在 ≤920px 下让 nav-links 整列隐藏,移动用户进站后没有导航。' +
          '加一个 hamburger 按钮 + 右侧滑出抽屉,内含全部 5 节链接 + 主题切换;' +
          '点击空白/再次点 hamburger 自动关闭;焦点 trap 让 Tab 键在抽屉内循环。'
  },
  v4: {
    title: 'v4 · 明星果品大卡 (Featured)',
    body: '第一张果品(苹果)做成 span 2 列跨度的"主卡",大图 + 完整命名 + 完整的本季注解;' +
          '其他 7 张按正常尺寸排成网格,形成"1 大 + 7 小"的视觉节奏。' +
          '主卡右上角加 "本季主打 · SEASONAL" 徽章。'
  },
  v5: {
    title: 'v5 · AI 图片来源披露',
    body: '在 hero 下方加一条 1 行极简披露:"本页果品图均为 AI 生成代表性占位,可由真实果园摄影替换"。' +
          '诚实标明,降低"假以为是实拍"的认知分歧;同时引导客户优先替换。'
  },
  v6: {
    title: 'v6 · 回顶浮动按钮',
    body: '页面滚过 hero 高度后,右下角浮现一颗浮动按钮;' +
          '点击平滑回滚到顶部;' +
          '用 IntersectionObserver 控制显示隐藏,不挡其他内容。'
  },
  v7: {
    title: 'v7 · 来访路线 + 地图嵌入',
    body: '新增 §6 来访路线,内嵌 OpenStreetMap iframe(无需 API key,无需 CDN,纯静态)。' +
          '地图中心定到北纬 35.130 / 东经 108.650(旬邑县张洪镇),' +
          '右侧三张路线卡(自驾 / 采摘拼车 / 寄存)说明实际怎么来。' +
          '底部 footer 也加锚点,#visit 与 nav / drawer 双侧导通。'
  },
  v8: {
    title: 'v8 · 微信卡组',
    body: '新增 §7 加我们 — 三张 QR 卡(个人微信 / 公众号 / 采供专线)。' +
          'QR 码本身用装饰性 SVG 占位(可视效果到位但不真扫码),' +
          '上线时跑一个 free QR 生成器(10 KB QRCode.js 嵌入即真);' +
          '每张卡有不同微章 logo(拾 / 周 / B2B),符合各账号身份。'
  },
  v9: {
    title: 'v9 · 摄影指南升级',
    body: '把原来一行 disclosure 升级成可展开的"摄影指南":' +
          '10 行表格,每张图给文件名 / 尺寸 / 题材 / 英文提示词 — 直接发给摄影师;' +
          '附加 3 步替换流程(拍 → 命名 → 替换) + 4 条质量 checklist;' +
          '桌面宽屏按表格展示,移动端自动转卡片。'
  }
};

const NODES_PLACEHOLDER = {};

export function initJournal() {
  const rail = document.getElementById('journalRail');
  const detail = document.getElementById('journalDetail');
  if (!rail || !detail) return;

  function render(v, btn) {
    rail.querySelectorAll('.journal-node').forEach(n => {
      n.classList.toggle('is-active', n.dataset.node === v);
    });
    const node = (NODES[v] || NODES_PLACEHOLDER[v]);
    if (!node) return;
    const current = (btn && btn.classList.contains('is-active'));
    detail.innerHTML =
      '<h4>' + node.title + (current ? ' <small>当前选中</small>' : '') + '</h4>' +
      '<p>' + node.body + '</p>';
  }

  rail.querySelectorAll('.journal-node').forEach(btn => {
    btn.addEventListener('click', () => {
      render(btn.dataset.node, btn);
    });
  });
  // initial render
  const init = rail.querySelector('.journal-node.is-active') || rail.querySelector('.journal-node');
  if (init) render(init.dataset.node, init);
}