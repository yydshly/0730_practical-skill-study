import { filterStyles, formatResultCount } from './gallery.js';
import { CATEGORIES, STYLES } from './styles.js';

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

function handleImageError(image, fallback) {
  image.hidden = true;
  fallback.hidden = false;
}

function createStyleCard(style, index) {
  const article = document.createElement('article');
  article.className = 'style-card';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'style-card__button';
  button.setAttribute('aria-label', `查看${style.name}详情`);

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
  button.append(visual, caption);
  button.addEventListener('click', () => openStyle(style, button));
  article.append(button);
  return article;
}

function render() {
  renderFilters();
  const matches = filterStyles(STYLES, state.category, state.query);
  const fragment = document.createDocumentFragment();
  matches.forEach((style, index) => fragment.append(createStyleCard(style, index)));
  elements.gallery.replaceChildren(fragment);
  elements.count.textContent = formatResultCount(matches.length);
  elements.gallery.hidden = matches.length === 0;
  elements.empty.hidden = matches.length !== 0;
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

async function copyPrompt() {
  if (!activeStyle) return;
  try {
    await navigator.clipboard.writeText(activeStyle.prompt);
    showToast('提示词已复制');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = activeStyle.prompt;
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

render();
