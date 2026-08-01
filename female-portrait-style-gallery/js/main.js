import {
  filterStyles,
  formatResultCount,
  getSampleAsset,
  getSampleDescription,
  validateCatalog
} from './gallery.js';
import { CATEGORIES, STYLES } from './styles.js';

const CATEGORY_LABELS = new Map(CATEGORIES.map(({ id, label }) => [id, label]));
const state = { category: 'all', query: '', source: 'original' };

const elements = {
  categories: document.querySelector('#category-list'),
  search: document.querySelector('#style-search'),
  count: document.querySelector('#result-count'),
  globalSampleSwitcher: document.querySelector('#global-sample-switcher'),
  gallery: document.querySelector('#gallery'),
  empty: document.querySelector('#empty-state'),
  reset: document.querySelector('#reset-filters'),
  dialog: document.querySelector('#style-dialog'),
  dialogClose: document.querySelector('#dialog-close'),
  dialogImage: document.querySelector('#dialog-image'),
  dialogFallback: document.querySelector('#dialog-fallback'),
  dialogFallbackNumber: document.querySelector('#dialog-fallback-number'),
  dialogSampleSwitcher: document.querySelector('#dialog-sample-switcher'),
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

const SAMPLE_LABELS = {
  original: '原始样例',
  gemini: 'Gemini 样例'
};

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

function updateGlobalSampleButtons(source = state.source) {
  elements.globalSampleSwitcher.querySelectorAll('[data-global-source]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.globalSource === source));
  });
}

function updateSampleButtons(container, source) {
  container.querySelectorAll('[data-sample-source]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.sampleSource === source));
  });
}

function setGlobalSource(source) {
  if (!['original', 'gemini'].includes(source)) return;
  state.source = source;
  updateGlobalSampleButtons(source);
  elements.gallery.querySelectorAll('.style-card').forEach((card) => {
    card.querySelector(`[data-sample-source="${source}"]`)?.click();
  });
  if (activeStyle && elements.dialog.open) updateDialogSample(source);
}

function createSampleSwitcher(onChange, modifier = '') {
  const switcher = document.createElement('div');
  switcher.className = `sample-switcher${modifier ? ` ${modifier}` : ''}`;
  switcher.setAttribute('role', 'group');
  switcher.setAttribute('aria-label', '切换图片样例');

  const label = document.createElement('span');
  label.className = 'sample-switcher__label';
  label.textContent = '样例来源';

  const buttons = document.createElement('div');
  buttons.className = 'sample-switcher__buttons';
  Object.entries(SAMPLE_LABELS).forEach(([source, text]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sample-switcher__button';
    button.dataset.sampleSource = source;
    button.setAttribute('aria-pressed', String(source === 'original'));
    button.textContent = text;
    button.addEventListener('click', () => onChange(source));
    buttons.append(button);
  });

  switcher.append(label, buttons);
  return switcher;
}

function createStyleCard(style, index, initialSource = 'original') {
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
  image.addEventListener('error', () => handleImageError(image, fallback));

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
  description.textContent = getSampleDescription(style);
  caption.append(topline, title, description);
  visual.append(image, fallback);
  openButton.append(visual, caption);
  let cardSource = initialSource;
  const setCardSource = (source) => {
    cardSource = source;
    image.hidden = false;
    fallback.hidden = true;
    image.src = getSampleAsset(style, source);
    image.alt = `${style.name}${source === 'gemini' ? ' Gemini' : ''}风格样例`;
    description.textContent = getSampleDescription(style, source);
    updateSampleButtons(sampleSwitcher, source);
  };
  openButton.addEventListener('click', () => openStyle(style, openButton, cardSource));

  const sampleSwitcher = createSampleSwitcher(setCardSource, 'sample-switcher--card');

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

  article.append(openButton, sampleSwitcher, promptPanel);
  setCardSource(initialSource);
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
  matches.forEach((style, index) => fragment.append(createStyleCard(style, index, state.source)));
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

function updateDialogSample(source) {
  if (!activeStyle) return;
  elements.dialogDescription.textContent = getSampleDescription(activeStyle, source);
  elements.dialogImage.hidden = false;
  elements.dialogFallback.hidden = true;
  elements.dialogImage.src = getSampleAsset(activeStyle, source);
  elements.dialogImage.alt = `${activeStyle.name}${source === 'gemini' ? ' Gemini' : ''}风格大图`;
  updateSampleButtons(elements.dialogSampleSwitcher, source);
}

function openStyle(style, trigger, source = 'original') {
  activeStyle = style;
  lastTrigger = trigger;
  elements.dialogNumber.textContent = `No. ${style.number}`;
  elements.dialogCategory.textContent = CATEGORY_LABELS.get(style.category);
  elements.dialogTitle.textContent = style.name;
  elements.detailScene.textContent = style.details.scene;
  elements.detailOutfit.textContent = style.details.outfit;
  elements.detailCamera.textContent = style.details.camera;
  elements.detailLight.textContent = style.details.light;
  elements.dialogPrompt.textContent = style.prompt;
  elements.dialogFallbackNumber.textContent = style.number;
  updateDialogSample(source);
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

elements.globalSampleSwitcher.addEventListener('click', (event) => {
  const button = event.target.closest('[data-global-source]');
  if (!button) return;
  setGlobalSource(button.dataset.globalSource);
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
elements.dialogSampleSwitcher.addEventListener('click', (event) => {
  const button = event.target.closest('[data-sample-source]');
  if (!button || !activeStyle) return;
  updateDialogSample(button.dataset.sampleSource);
});
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
