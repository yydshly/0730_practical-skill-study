// 主应用逻辑

// ============ State ============
const State = {
  currentStyle: null,
  config: {
    apiKey: '',
    endpoint: 'https://api.minimaxi.com/v1/image_generation',
    model: 'image-01',
    n: 1
  },
  lastPrompt: '',
  lastNegative: '',
  lastParams: null,
  history: [],
  lastImageUrl: null
};

// ============ Storage ============
const Storage = {
  CONFIG_KEY: 'fpd_config',
  HISTORY_KEY: 'fpd_history',

  loadConfig() {
    try {
      const data = localStorage.getItem(this.CONFIG_KEY);
      if (data) {
        Object.assign(State.config, JSON.parse(data));
      }
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  },

  saveConfig() {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(State.config));
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  },

  loadHistory() {
    try {
      const data = localStorage.getItem(this.HISTORY_KEY);
      if (data) {
        State.history = JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  },

  saveHistory() {
    try {
      // 只保留最近 20 条
      const trimmed = State.history.slice(0, 20);
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  },

  addHistory(item) {
    State.history.unshift({
      ...item,
      timestamp: Date.now()
    });
    this.saveHistory();
    renderHistory();
  },

  clearHistory() {
    State.history = [];
    this.saveHistory();
    renderHistory();
  }
};

// ============ Toast ============
function toast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${getToastIcon(type)} <span>${escapeHtml(message)}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, duration);
}

function getToastIcon(type) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  return icons[type] || icons.info;
}

// ============ Sidebar Rendering ============
function renderStyleList(filter = '') {
  const list = document.getElementById('style-list');
  const filterLower = filter.toLowerCase();

  const filtered = STYLES.filter(s => {
    if (!filterLower) return true;
    return s.name.toLowerCase().includes(filterLower) ||
           s.keywords.some(k => k.toLowerCase().includes(filterLower)) ||
           s.id.toLowerCase().includes(filterLower) ||
           s.category.toLowerCase().includes(filterLower);
  });

  document.getElementById('style-count').textContent = `${filtered.length}/${STYLES.length}`;

  list.innerHTML = filtered.map(s => `
    <div class="style-item ${State.currentStyle?.id === s.id ? 'active' : ''}"
         data-id="${s.id}"
         onclick="selectStyle('${s.id}')">
      <div>
        <div class="style-item-name zh">${escapeHtml(s.name)}</div>
        <div class="style-item-id">${s.id}</div>
      </div>
      <span class="style-cat-tag">${s.category}</span>
    </div>
  `).join('');
}

function selectStyle(id) {
  const style = STYLES.find(s => s.id === id);
  if (!style) return;

  State.currentStyle = style;

  // 更新 UI
  document.getElementById('current-style-name').textContent = style.name;
  document.getElementById('current-style-desc').textContent = style.description;
  document.getElementById('current-style-id').textContent = style.id;
  document.getElementById('current-style-cat').textContent = style.category;

  // 更新参考图
  const refImg = document.getElementById('ref-image');
  const refPlaceholder = document.getElementById('ref-placeholder');
  if (style.reference) {
    refImg.src = style.reference;
    refImg.style.display = 'block';
    refPlaceholder.style.display = 'none';
  } else {
    refImg.style.display = 'none';
    refPlaceholder.style.display = 'block';
    refPlaceholder.querySelector('.text-sm').textContent = '暂无参考示例';
  }

  // 重新渲染列表
  renderStyleList(document.getElementById('style-search').value);

  // 如果有示例，加载示例
  if (EXAMPLES[id]) {
    // 不自动填充，让用户主动点击
  }

  toast(`已选择：${style.name}`, 'success', 1500);
}

// ============ History Rendering ============
function renderHistory() {
  const list = document.getElementById('history-list');
  if (State.history.length === 0) {
    list.innerHTML = '<div class="text-xs text-muted" style="padding: 12px; text-align: center;">暂无历史</div>';
    return;
  }

  list.innerHTML = State.history.map((item, idx) => {
    const time = new Date(item.timestamp);
    const timeStr = formatTime(time);
    return `
      <div class="history-item" onclick="loadFromHistory(${idx})">
        <div class="history-style zh">${escapeHtml(item.styleName)}</div>
        <div class="history-preview">${escapeHtml(item.scene || '无场景')}</div>
        <div class="history-time">${timeStr}</div>
      </div>
    `;
  }).join('');
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function loadFromHistory(idx) {
  const item = State.history[idx];
  if (!item) return;

  // 切换到对应风格
  State.currentStyle = STYLES.find(s => s.id === item.styleId);
  if (State.currentStyle) {
    document.getElementById('current-style-name').textContent = State.currentStyle.name;
    document.getElementById('current-style-desc').textContent = State.currentStyle.description;
    document.getElementById('current-style-id').textContent = State.currentStyle.id;
    document.getElementById('current-style-cat').textContent = State.currentStyle.category;

    const refImg = document.getElementById('ref-image');
    const refPlaceholder = document.getElementById('ref-placeholder');
    if (State.currentStyle.reference) {
      refImg.src = State.currentStyle.reference;
      refImg.style.display = 'block';
      refPlaceholder.style.display = 'none';
    } else {
      refImg.style.display = 'none';
      refPlaceholder.style.display = 'block';
    }

    renderStyleList(document.getElementById('style-search').value);
  }

  // 填充参数
  setTimeout(() => {
    Object.entries(item.params).forEach(([key, value]) => {
      const el = document.getElementById(`param-${key}`);
      if (el) el.value = value;
    });
    toast(`已恢复：${item.styleName}`, 'success', 1500);
  }, 50);
}

function clearHistory() {
  if (State.history.length === 0) return;
  if (confirm('确定清空历史记录？')) {
    Storage.clearHistory();
  }
}

// ============ Form Helpers ============
function getFormParams() {
  return {
    scene: document.getElementById('param-scene').value.trim(),
    outfit: document.getElementById('param-outfit').value.trim(),
    mood: document.getElementById('param-mood').value.trim(),
    face: document.getElementById('param-face').value.trim(),
    body: document.getElementById('param-body').value.trim(),
    aspect: document.getElementById('param-aspect').value,
    camera: document.getElementById('param-camera').value.trim(),
    light: document.getElementById('param-light').value.trim(),
    filter: document.getElementById('param-filter').value.trim(),
    age: document.getElementById('param-age').value.trim(),
    extra: document.getElementById('param-extra').value.trim(),
    action_hint: '',
    outfit_detail: '',
    env_detail: '',
    filter_detail: '',
    line_focus: '',
    time_hint: ''
  };
}

function setFormParams(params) {
  Object.entries(params).forEach(([key, value]) => {
    const el = document.getElementById(`param-${key}`);
    if (el && value) el.value = value;
  });
}

function clearForm() {
  document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
    if (el.id !== 'param-aspect') {
      el.value = '';
    } else {
      el.value = '9:16';
    }
  });
}

function loadExample() {
  if (!State.currentStyle) {
    toast('请先选择风格', 'warning');
    return;
  }
  const example = EXAMPLES[State.currentStyle.id];
  if (!example) {
    toast('该风格暂无预设示例', 'warning');
    return;
  }
  clearForm();
  setFormParams(example);
  toast('已加载示例参数', 'success', 1500);
}

// ============ Prompt Generation ============
function generatePrompt() {
  if (!State.currentStyle) {
    toast('请先选择风格', 'warning');
    return;
  }

  const params = getFormParams();

  if (!params.scene || !params.outfit) {
    toast('场景方向和服装方向为必填', 'error');
    return;
  }

  const template = PROMPT_TEMPLATES[State.currentStyle.id];
  if (!template) {
    toast('该风格暂未实现提示词生成', 'error');
    return;
  }

  const promptParts = template.buildPrompt(params, State.currentStyle, template.defaults);

  // 拼接额外要求
  let fullPrompt = promptParts.join('\n\n');
  if (params.extra) {
    fullPrompt += `\n\n补充要求：${params.extra}`;
  }

  // 保存到 state
  State.lastPrompt = fullPrompt;
  State.lastNegative = template.negative;
  State.lastParams = { ...params };

  // 显示
  document.getElementById('prompt-positive').innerHTML =
    promptParts.map(p => `<p>${escapeHtml(p)}</p>`).join('');
  document.getElementById('prompt-negative').textContent = template.negative;
  document.getElementById('prompt-raw').textContent = JSON.stringify({
    style: State.currentStyle.id,
    style_name: State.currentStyle.name,
    aspect_ratio: params.aspect,
    prompt: fullPrompt,
    negative: template.negative,
    params
  }, null, 2);

  // 切换到正向提示词 tab
  switchPromptTab('positive');

  // 添加到历史
  Storage.addHistory({
    styleId: State.currentStyle.id,
    styleName: State.currentStyle.name,
    scene: params.scene,
    params: { ...params }
  });

  toast('提示词生成成功', 'success', 1500);
}

function switchPromptTab(tab) {
  document.querySelectorAll('.prompt-tab').forEach((t, idx) => {
    t.classList.toggle('active', ['positive', 'negative', 'raw'][idx] === tab);
  });

  document.getElementById('prompt-positive').classList.toggle('hidden', tab !== 'positive');
  document.getElementById('prompt-negative').classList.toggle('hidden', tab !== 'negative');
  document.getElementById('prompt-raw').classList.toggle('hidden', tab !== 'raw');
}

// ============ Copy ============
async function copyPrompt(type) {
  let text = '';
  let label = '';
  if (type === 'positive') {
    text = State.lastPrompt;
    label = '正向提示词';
  } else if (type === 'negative') {
    text = State.lastNegative;
    label = '负面约束';
  } else if (type === 'all') {
    text = `正向提示词：\n${State.lastPrompt}\n\n负面约束：\n${State.lastNegative}`;
    label = '全部';
  }

  if (!text) {
    toast('请先生成提示词', 'warning');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    toast(`${label}已复制到剪贴板`, 'success');
  } catch (e) {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      toast(`${label}已复制到剪贴板`, 'success');
    } catch (err) {
      toast('复制失败，请手动复制', 'error');
    }
    document.body.removeChild(textarea);
  }
}

// ============ Settings ============
function openSettings() {
  document.getElementById('api-key-input').value = State.config.apiKey;
  document.getElementById('api-endpoint-input').value = State.config.endpoint;
  document.getElementById('api-model-input').value = State.config.model;
  document.getElementById('api-n-input').value = State.config.n;
  document.getElementById('settings-modal').classList.add('active');
}

function closeSettings() {
  document.getElementById('settings-modal').classList.remove('active');
}

function saveSettings() {
  State.config.apiKey = document.getElementById('api-key-input').value.trim();
  State.config.endpoint = document.getElementById('api-endpoint-input').value.trim();
  State.config.model = document.getElementById('api-model-input').value;
  State.config.n = parseInt(document.getElementById('api-n-input').value);

  if (!State.config.apiKey) {
    toast('请输入 API Key', 'error');
    return;
  }
  if (!State.config.endpoint) {
    toast('请输入 API Endpoint', 'error');
    return;
  }

  Storage.saveConfig();
  updateApiStatus();
  closeSettings();
  toast('配置已保存', 'success');
}

async function testApiConnection() {
  const apiKey = document.getElementById('api-key-input').value.trim();
  const endpoint = document.getElementById('api-endpoint-input').value.trim();

  if (!apiKey) {
    toast('请先输入 API Key', 'error');
    return;
  }

  toast('正在测试连接...', 'info', 2000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'image-01',
        prompt: 'test',
        aspect_ratio: '1:1',
        response_format: 'url',
        n: 1
      })
    });

    if (response.ok) {
      toast('连接成功！API Key 有效', 'success');
    } else {
      const data = await response.json().catch(() => ({}));
      const msg = data.base_resp?.status_msg || data.message || `HTTP ${response.status}`;
      toast(`连接失败：${msg}`, 'error', 5000);
    }
  } catch (e) {
    toast(`网络错误：${e.message}`, 'error', 5000);
  }
}

function updateApiStatus() {
  const dot = document.getElementById('api-status-dot');
  const text = document.getElementById('api-status-text');
  if (State.config.apiKey) {
    dot.className = 'status-dot ready';
    text.textContent = '已配置';
  } else {
    dot.className = 'status-dot unconfigured';
    text.textContent = '未配置';
  }
}

// ============ Image Generation ============
const VALID_ASPECTS = ['1:1', '16:9', '4:3', '3:2', '2:3', '3:4', '9:16', '21:9'];

async function generateImage() {
  if (!State.config.apiKey) {
    toast('请先在设置中配置 API Key', 'error');
    openSettings();
    return;
  }

  if (!State.lastPrompt) {
    toast('请先生成提示词', 'warning');
    return;
  }

  // 验证画幅比例
  const aspect = State.lastParams?.aspect;
  if (!aspect || !VALID_ASPECTS.includes(aspect)) {
    toast(`画幅比例无效：${aspect || '未设置'}。支持：${VALID_ASPECTS.join(', ')}`, 'error', 5000);
    return;
  }

  const btn = document.getElementById('btn-generate');
  const body = document.getElementById('image-body');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> <span>生成中...</span>';

  body.innerHTML = `
    <div class="loading-overlay">
      <div class="spinner"></div>
      <div class="loading-text">正在调用 MiniMax API 生成图片...</div>
    </div>
  `;

  try {
    const response = await fetch(State.config.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${State.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: State.config.model,
        prompt: State.lastPrompt,
        aspect_ratio: State.lastParams?.aspect || '9:16',
        response_format: 'url',
        n: State.config.n,
        prompt_optimizer: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const code = data.base_resp?.status_code;
      const msg = data.base_resp?.status_msg || data.message || `HTTP ${response.status}`;
      throw new Error(`[${code || response.status}] ${msg}`);
    }

    if (data.base_resp?.status_code !== 0) {
      throw new Error(data.base_resp.status_msg || '生成失败');
    }

    const images = data.data?.image_urls || data.data?.image_base64 || [];
    if (images.length === 0) {
      throw new Error('未返回图片');
    }

    // 显示第一张图
    State.lastImageUrl = images[0];
    body.innerHTML = `
      <img src="${images[0]}" alt="生成图" style="cursor: pointer;" onclick="window.open('${images[0]}', '_blank')">
    `;

    document.getElementById('image-meta').textContent = `${images.length} 张 · ${State.config.model}`;

    // 启用下载和重新生成按钮
    document.getElementById('btn-download').disabled = false;
    document.getElementById('btn-regen').disabled = false;

    toast(`生成成功！共 ${images.length} 张图片`, 'success');
  } catch (e) {
    body.innerHTML = `
      <div class="image-placeholder">
        <div class="image-placeholder-icon" style="color: var(--error);">✕</div>
        <div class="text-sm" style="color: var(--error);">生成失败</div>
        <div class="text-xs text-muted" style="margin-top: 8px; max-width: 300px;">${escapeHtml(e.message)}</div>
      </div>
    `;
    toast(`生成失败：${e.message}`, 'error', 5000);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>生成图片</span>';
  }
}

async function regenerateImage() {
  await generateImage();
}

async function downloadImage() {
  if (!State.lastImageUrl) {
    toast('暂无图片可下载', 'warning');
    return;
  }

  try {
    const filename = `${State.currentStyle?.id || 'image'}_${Date.now()}.png`;
    const a = document.createElement('a');
    a.href = State.lastImageUrl;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('开始下载', 'success', 1500);
  } catch (e) {
    toast(`下载失败：${e.message}`, 'error');
  }
}

// ============ Utility ============
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============ Init ============
function init() {
  Storage.loadConfig();
  Storage.loadHistory();

  renderStyleList();
  renderHistory();
  updateApiStatus();

  // 默认选择清纯生活照
  if (!State.currentStyle) {
    selectStyle('clean-lifestyle');
  }

  // 搜索
  document.getElementById('style-search').addEventListener('input', (e) => {
    renderStyleList(e.target.value);
  });

  // 关闭弹窗点击外部
  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') {
      closeSettings();
    }
  });

  // ESC 关闭弹窗
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSettings();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);