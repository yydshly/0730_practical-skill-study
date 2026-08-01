import {
  ASSET_MANIFEST,
  FULL_COPY_SAMPLE,
  INPUT_PRESETS,
  SCENARIO_SHOWCASES,
} from './data.js';
import {
  compilePrompt,
  normalizeInput,
  runQualityGate,
  selectVariation,
} from './compiler.js';

const state = {
  input: { type: 'theme', value: '' },
  history: [],
  compilation: null,
  assetId: null,
  scenarioId: SCENARIO_SHOWCASES[0]?.id || null,
};

const FIELD_LABELS = [
  ['canvas', 'Canvas'],
  ['attentionGeometry', 'Attention Geometry'],
  ['imageAnchor', 'Image Anchor'],
  ['anchorTreatment', 'Anchor Treatment'],
  ['typographySystem', 'Typography System'],
  ['colorLogic', 'Color Logic'],
  ['reproductionTexture', 'Reproduction Texture'],
  ['emotionalTemperature', 'Emotional Temperature'],
  ['hardAvoids', 'Hard Avoids'],
];

const REFERENCE_EXAMPLES = [
  { id: 'night-door', label: 'Night Door', src: '../examples/night-door.jpeg' },
  { id: 'yellow-step', label: 'Yellow Step', src: '../examples/yellow-step.jpeg' },
  { id: 'shore-pause', label: 'Shore Pause', src: '../examples/shore-pause.jpeg' },
  { id: 'pause-map', label: 'Pause Map', src: '../examples/pause-map.jpeg' },
  { id: 'typhoon-memory', label: 'Typhoon Memory', src: '../examples/typhoon-memory.jpeg' },
  { id: 'moon-tide', label: 'Moon Tide', src: '../examples/moon-tide.jpeg' },
];

const GENERATED_ASSETS = ASSET_MANIFEST.filter(
  (asset) => asset.assetPath && !asset.scenarioId,
);
const SCENARIO_ASSETS = ASSET_MANIFEST.filter((asset) => asset.scenarioId);

const dom = {
  inputType: document.querySelector('#input-type'),
  briefInput: document.querySelector('#brief-input'),
  presetList: document.querySelector('#preset-list'),
  compileButton: document.querySelector('#compile-button'),
  variationButton: document.querySelector('#variation-button'),
  workflowStatus: document.querySelector('#workflow-status'),
  coreSubjectSummary: document.querySelector('#core-subject-summary'),
  posterTitle: document.querySelector('#poster-title'),
  posterCaption: document.querySelector('#poster-caption'),
  posterImage: document.querySelector('#poster-image'),
  posterFacts: document.querySelector('#poster-facts'),
  assetSwitcher: document.querySelector('#asset-switcher'),
  promptOutput: document.querySelector('#prompt-output'),
  fieldOutput: document.querySelector('#field-output'),
  recipeOutput: document.querySelector('#recipe-output'),
  qualityOutput: document.querySelector('#quality-output'),
  copyPrompt: document.querySelector('#copy-prompt'),
  toast: document.querySelector('#toast'),
  assetDialog: document.querySelector('#asset-dialog'),
  dialogImage: document.querySelector('#dialog-image'),
  dialogCaption: document.querySelector('#dialog-caption'),
  referenceGrid: document.querySelector('#reference-grid'),
  scenarioGrid: document.querySelector('#scenario-grid'),
  scenarioActiveCategory: document.querySelector('#scenario-active-category'),
  scenarioActiveTitle: document.querySelector('#scenario-active-title'),
  scenarioActiveDescription: document.querySelector('#scenario-active-description'),
  scenarioActiveProduct: document.querySelector('#scenario-active-product'),
  scenarioActiveBrief: document.querySelector('#scenario-active-brief'),
  scenarioActiveWhy: document.querySelector('#scenario-active-why'),
  scenarioActiveDeliverables: document.querySelector('#scenario-active-deliverables'),
  scenarioActiveImage: document.querySelector('#scenario-active-image'),
  scenarioActiveCaption: document.querySelector('#scenario-active-caption'),
  scenarioActiveAudience: document.querySelector('#scenario-active-audience'),
  scenarioActiveAccent: document.querySelector('#scenario-active-accent'),
  textSampleOriginalImage: document.querySelector('#text-sample-original-image'),
  textSampleComposedImage: document.querySelector('#text-sample-composed-image'),
  textSampleEyebrow: document.querySelector('#text-sample-eyebrow'),
  textSampleTitle: document.querySelector('#text-sample-title'),
  textSampleDate: document.querySelector('#text-sample-date'),
  textSampleLocation: document.querySelector('#text-sample-location'),
  textSampleDescription: document.querySelector('#text-sample-description'),
  textSampleFooter: document.querySelector('#text-sample-footer'),
  textSampleCaption: document.querySelector('#text-sample-caption'),
  openDialogButtons: document.querySelectorAll('[data-open-dialog]'),
  closeDialogButtons: document.querySelectorAll('[data-close-dialog]'),
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let toastTimer = null;
let lastDialogTrigger = null;
let compileInProgress = false;

function titleCase(value) {
  return String(value)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeHTML(value) {
  return String(value ?? '—')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setStatus(phase, detail) {
  dom.workflowStatus.dataset.phase = phase;
  dom.workflowStatus.textContent = `${phase} · ${detail}`;
}

function setToast(message, tone = 'info') {
  dom.toast.dataset.tone = tone;
  dom.toast.textContent = message;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    dom.toast.textContent = '';
  }, 2600);
}

function waitForStatusPaint(instant = false) {
  if (instant || reducedMotion.matches) return Promise.resolve();
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}

async function advanceStatus(phase, detail, instant = false) {
  setStatus(phase, detail);
  await waitForStatusPaint(instant);
}

function setControlsBusy(isBusy) {
  dom.inputType.disabled = isBusy;
  dom.briefInput.disabled = isBusy;
  dom.compileButton.disabled = isBusy;
  dom.variationButton.disabled = isBusy || !state.compilation;
  dom.copyPrompt.disabled = isBusy || !state.compilation;

  dom.presetList.querySelectorAll('button').forEach((button) => {
    button.disabled = isBusy;
  });
  dom.assetSwitcher.querySelectorAll('button').forEach((button) => {
    button.disabled = isBusy;
  });
  dom.scenarioGrid.querySelectorAll('button').forEach((button) => {
    button.disabled = isBusy;
  });
  dom.openDialogButtons.forEach((button) => {
    button.disabled = isBusy || !state.compilation;
  });
}

function normalizeControls() {
  return {
    type: dom.inputType.value,
    value: dom.briefInput.value,
  };
}

function getPromptCompilation(normalizedInput, recipe) {
  const promptCompilation = compilePrompt(normalizedInput, recipe);
  const recommendedAsset = pickRecommendedAsset(normalizedInput, recipe);

  return {
    ...promptCompilation,
    input: normalizedInput,
    recipe,
    qualityGate: runQualityGate(promptCompilation),
    asset: recommendedAsset,
    assets: GENERATED_ASSETS,
  };
}

function pickRecommendedAsset(normalizedInput, recipe) {
  return (
    GENERATED_ASSETS.find((asset) => asset.sourceTheme === normalizedInput.subject) ||
    GENERATED_ASSETS.find((asset) => asset.recipeId === recipe.id) ||
    GENERATED_ASSETS.find((asset) => asset.accentColor.includes(recipe.accent.split(' ')[0])) ||
    GENERATED_ASSETS[0]
  );
}

function getActiveAsset(compilation) {
  return (
    compilation.assets.find((asset) => asset.id === state.assetId) ||
    compilation.asset ||
    compilation.assets[0]
  );
}

function renderPresets() {
  dom.presetList.innerHTML = '';
  INPUT_PRESETS.forEach((preset) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip-button';
    button.dataset.presetValue = preset.value;
    button.dataset.presetType = preset.type;
    button.innerHTML = `<strong>${escapeHTML(preset.value)}</strong><span>${escapeHTML(preset.subject)} / ${escapeHTML(preset.mood)}</span>`;
    if (state.input.value === preset.value) button.classList.add('is-active');
    button.disabled = compileInProgress;
    button.addEventListener('click', () => {
      if (compileInProgress) return;
      state.input = { type: preset.type, value: preset.value };
      dom.inputType.value = preset.type;
      dom.briefInput.value = preset.value;
      renderPresets();
      dom.briefInput.focus();
    });
    dom.presetList.append(button);
  });
}

function getScenarioById(scenarioId) {
  return (
    SCENARIO_SHOWCASES.find((scenario) => scenario.id === scenarioId) ||
    SCENARIO_SHOWCASES[0]
  );
}

function getScenarioAsset(scenario) {
  return SCENARIO_ASSETS.find(
    (asset) => asset.scenarioId === scenario.assetId,
  );
}

function renderScenarioCards() {
  dom.scenarioGrid.innerHTML = SCENARIO_SHOWCASES.map((scenario, index) => {
    const asset = getScenarioAsset(scenario);
    const isActive = scenario.id === state.scenarioId;

    return `
      <button
        type="button"
        class="scenario-card${isActive ? ' is-active' : ''}"
        data-scenario-id="${escapeHTML(scenario.id)}"
        aria-pressed="${isActive}"
        aria-label="选择场景：${escapeHTML(scenario.category)}"
        ${compileInProgress ? 'disabled' : ''}
      >
        <span class="scenario-card-thumb">
          <img src="${escapeHTML(asset.assetPath)}" alt="${escapeHTML(scenario.category)} 本地生成样张" loading="lazy" />
        </span>
        <span class="scenario-card-copy">
          <span class="scenario-card-index">${String(index + 1).padStart(2, '0')}</span>
          <span class="scenario-card-category">${escapeHTML(scenario.category)}</span>
          <strong class="scenario-card-title">${escapeHTML(scenario.product)}</strong>
          <span class="scenario-card-product">Product · ${escapeHTML(scenario.audience)}</span>
        </span>
      </button>
    `;
  }).join('');

  dom.scenarioGrid.querySelectorAll('[data-scenario-id]').forEach((button) => {
    button.addEventListener('click', () => {
      if (compileInProgress) return;
      state.scenarioId = button.dataset.scenarioId;
      renderScenarioCards();
      renderScenarioDetail(state.scenarioId);
    });
  });
}

function renderScenarioDetail(scenarioId) {
  const scenario = getScenarioById(scenarioId);
  const asset = getScenarioAsset(scenario);
  if (!scenario || !asset) return;

  state.scenarioId = scenario.id;
  dom.scenarioActiveCategory.textContent = scenario.category;
  dom.scenarioActiveTitle.textContent = scenario.category;
  dom.scenarioActiveProduct.textContent = scenario.product;
  dom.scenarioActiveAudience.textContent = scenario.audience;
  dom.scenarioActiveAccent.textContent = scenario.accentColor;
  dom.scenarioActiveDescription.textContent = scenario.visualGoal;
  dom.scenarioActiveBrief.textContent = scenario.brief;
  dom.scenarioActiveWhy.textContent = scenario.whyItFits;
  dom.scenarioActiveDeliverables.innerHTML = scenario.deliverables
    .map((deliverable) => `<li>${escapeHTML(deliverable)}</li>`)
    .join('');
  dom.scenarioActiveImage.src = asset.assetPath;
  dom.scenarioActiveImage.alt = `${scenario.product} · ${scenario.category} · 预生成本地样张`;
  dom.scenarioActiveCaption.textContent = `${scenario.id} · ${asset.generatedAt} · ${asset.note} · ${asset.assetPath}`;
}

function renderScenarioGallery() {
  if (!SCENARIO_SHOWCASES.length) return;

  if (!getScenarioById(state.scenarioId)) {
    state.scenarioId = SCENARIO_SHOWCASES[0].id;
  }

  renderScenarioCards();
  renderScenarioDetail(state.scenarioId);
}

function renderTextSample() {
  const sample = FULL_COPY_SAMPLE;
  dom.textSampleOriginalImage.src = sample.assetPath;
  dom.textSampleOriginalImage.alt = `${sample.scenarioId} original generated sample`;
  dom.textSampleComposedImage.src = sample.assetPath;
  dom.textSampleComposedImage.alt = `${sample.scenarioId} composed poster sample`;
  dom.textSampleEyebrow.textContent = sample.eyebrow;
  dom.textSampleTitle.textContent = sample.title;
  dom.textSampleDate.textContent = sample.date;
  dom.textSampleLocation.textContent = sample.location;
  dom.textSampleDescription.textContent = sample.description;
  dom.textSampleFooter.textContent = sample.footer;
  dom.textSampleCaption.textContent = `${sample.scenarioId} · same local JPEG · typography added in the demo`;
}

function renderPosterFacts(asset) {
  const facts = [
    ['Theme', asset.sourceTheme],
    ['Recipe ID', asset.recipeId],
    ['Accent', asset.accentColor],
    ['Generated', asset.generatedAt],
  ];

  dom.posterFacts.innerHTML = facts
    .map(
      ([label, value]) =>
        `<div><dt>${label}</dt><dd>${escapeHTML(value)}</dd></div>`,
    )
    .join('');
}

function renderAssetSwitcher(compilation) {
  const activeAsset = getActiveAsset(compilation);
  dom.assetSwitcher.innerHTML = '';

  compilation.assets.forEach((asset) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `asset-chip${asset.id === activeAsset.id ? ' is-active' : ''}`;
    button.dataset.assetId = asset.id;
    button.disabled = compileInProgress;
    button.innerHTML = `<strong>${escapeHTML(titleCase(asset.id))}</strong><span>${escapeHTML(asset.note)} · ${escapeHTML(asset.accentColor)}</span>`;
    button.addEventListener('click', () => {
      if (compileInProgress) return;
      state.assetId = asset.id;
      renderCompilation(state.compilation);
      setStatus('READY', `Showing local sample ${titleCase(asset.id)}.`);
    });
    dom.assetSwitcher.append(button);
  });
}

function renderPromptFields(fields) {
  dom.fieldOutput.innerHTML = FIELD_LABELS.map(([key, label]) => {
    return `<div><dt>${label}</dt><dd>${escapeHTML(fields[key])}</dd></div>`;
  }).join('');
}

function renderRecipe(recipe) {
  dom.recipeOutput.innerHTML = `
    <article class="recipe-card">
      <div>
        <span class="panel-kicker">Current Recipe</span>
        <div class="recipe-id" data-recipe-id>${escapeHTML(recipe.id)}</div>
      </div>
      <div class="recipe-grid">
        <div><span>Layout</span><strong>${escapeHTML(recipe.layout)}</strong></div>
        <div><span>Anchor</span><strong>${escapeHTML(recipe.anchor)}</strong></div>
        <div><span>Typography</span><strong>${escapeHTML(recipe.typography)}</strong></div>
        <div><span>Accent</span><strong>${escapeHTML(recipe.accent)}</strong></div>
        <div><span>Texture</span><strong>${escapeHTML(recipe.texture)}</strong></div>
        <div><span>Mood bend</span><strong>${escapeHTML(recipe.mood)}</strong></div>
      </div>
    </article>
  `;
}

function renderQualityGate(qualityGate) {
  dom.qualityOutput.innerHTML = qualityGate
    .map(
      (item) => `
        <li>
          <span class="quality-badge ${item.status === 'pass' ? 'pass' : 'fail'}">${escapeHTML(item.status.toUpperCase())}</span>
          <div>
            <strong>${escapeHTML(item.label)}</strong>
            <small>${escapeHTML(item.detail)}</small>
          </div>
        </li>
      `,
    )
    .join('');
}

function renderReferenceGrid() {
  dom.referenceGrid.innerHTML = REFERENCE_EXAMPLES.map(
    (item) => `
      <figure class="reference-card">
        <img src="${escapeHTML(item.src)}" alt="${escapeHTML(item.label)} reference example" loading="lazy" />
        <figcaption><p>${escapeHTML(item.label)}</p></figcaption>
      </figure>
    `,
  ).join('');
}

function updateDialog(compilation) {
  const asset = getActiveAsset(compilation);
  dom.dialogImage.src = asset.assetPath;
  dom.dialogImage.alt = `${asset.id} original generated sample`;
  dom.dialogCaption.textContent = `${asset.note} · ${asset.sourceTheme} · ${asset.recipeId}`;
}

function renderCompilation(compilation) {
  state.compilation = compilation;

  const asset = getActiveAsset(compilation);
  state.assetId = asset.id;
  dom.coreSubjectSummary.textContent = `${compilation.input.subject} · ${compilation.input.mood} · ${compilation.recipe.id}`;
  dom.posterTitle.textContent = titleCase(asset.id);
  dom.posterCaption.textContent = `${asset.note} · ${asset.sourceTheme} · ${asset.accentColor}`;
  dom.posterImage.src = asset.assetPath;
  dom.posterImage.alt = `${asset.note} for ${asset.sourceTheme}`;
  dom.promptOutput.textContent = compilation.promptText;

  renderPosterFacts(asset);
  renderAssetSwitcher(compilation);
  renderPromptFields(compilation.fields);
  renderRecipe(compilation.recipe);
  renderQualityGate(compilation.qualityGate);
  updateDialog(compilation);
  setControlsBusy(compileInProgress);
}

function setErrorState(message) {
  dom.variationButton.disabled = !state.compilation;
  setStatus('ERROR', message || '请输入主题、句子或物件线索。');
  setToast(message || '请输入主题、句子或物件线索。', 'error');
}

async function runCompile({ variation = false, instant = false } = {}) {
  if (compileInProgress) return false;

  compileInProgress = true;
  setControlsBusy(true);
  let shouldRefocusInput = false;

  try {
    const rawInput = normalizeControls();
    state.input = rawInput;
    renderPresets();

    await advanceStatus('PARSE', 'Reading the current brief and matching the subject.', instant);
    const normalizedInput = normalizeInput(rawInput);
    if (normalizedInput.error) {
      shouldRefocusInput = true;
      setErrorState('Input required: please enter a theme, sentence, or object cue.');
      return false;
    }

    const inputChanged =
      !state.compilation ||
      state.compilation.input.type !== normalizedInput.type ||
      state.compilation.input.value !== normalizedInput.value;

    if (!variation || inputChanged) {
      state.history = [];
    }

    await advanceStatus('COMPILE', 'Applying Standard Mode prompt fields.', instant);
    const recipe = selectVariation(normalizedInput, state.history);
    const compilation = getPromptCompilation(normalizedInput, recipe);
    state.history = [...state.history, recipe.id];
    state.assetId = compilation.asset.id;

    await advanceStatus('CHECK', 'Running the quality gate against the four-paragraph prompt.', instant);
    renderCompilation(compilation);

    setStatus('READY', `Prompt and sample ready: ${recipe.id}.`);
    return true;
  } finally {
    compileInProgress = false;
    setControlsBusy(false);
    if (shouldRefocusInput) {
      dom.briefInput.focus();
    }
  }
}

function selectPromptOutput() {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(dom.promptOutput);
  selection.removeAllRanges();
  selection.addRange(range);
}

async function writePromptToClipboard(promptText) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(promptText);
      return true;
    } catch (error) {
      // Fall through to the synchronous copy path below.
    }
  }

  const fallback = document.createElement('textarea');
  fallback.value = promptText;
  fallback.setAttribute('readonly', 'true');
  fallback.style.position = 'fixed';
  fallback.style.inset = '0 auto auto 0';
  fallback.style.width = '1px';
  fallback.style.height = '1px';
  fallback.style.opacity = '0';
  document.body.append(fallback);
  fallback.focus();
  fallback.select();

  try {
    return document.execCommand?.('copy') === true;
  } catch (error) {
    return false;
  } finally {
    fallback.remove();
  }
}

async function copyPrompt() {
  if (compileInProgress) return;

  if (!state.compilation?.promptText) {
    setToast('Compile a prompt before copying.', 'error');
    return;
  }

  const copied = await writePromptToClipboard(state.compilation.promptText);
  if (copied) {
    setToast('Prompt copied to clipboard.', 'success');
    return;
  }

  selectPromptOutput();
  setToast('Copy failed. Prompt text is still selectable for manual copy.', 'error');
}

function showDialog(trigger) {
  if (compileInProgress) return;
  if (!state.compilation) return;
  lastDialogTrigger = trigger;
  updateDialog(state.compilation);
  dom.assetDialog.showModal();
}

function closeDialog() {
  if (dom.assetDialog.open) dom.assetDialog.close();
}

function wireDialog() {
  dom.openDialogButtons.forEach((button) => {
    button.addEventListener('click', () => showDialog(button));
  });

  dom.closeDialogButtons.forEach((button) => {
    button.addEventListener('click', closeDialog);
  });

  dom.assetDialog.addEventListener('click', (event) => {
    const rect = dom.assetDialog.getBoundingClientRect();
    const isOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (isOutside) closeDialog();
  });

  dom.assetDialog.addEventListener('close', () => {
    if (lastDialogTrigger) {
      lastDialogTrigger.focus();
      lastDialogTrigger = null;
    }
  });
}

function wireEvents() {
  dom.compileButton.addEventListener('click', () => {
    runCompile({ variation: false });
  });

  dom.variationButton.addEventListener('click', () => {
    runCompile({ variation: true });
  });

  dom.inputType.addEventListener('change', () => {
    state.input.type = dom.inputType.value;
    renderPresets();
  });

  dom.briefInput.addEventListener('input', () => {
    state.input.value = dom.briefInput.value;
    renderPresets();
  });

  dom.copyPrompt.addEventListener('click', copyPrompt);
  wireDialog();
}

function boot() {
  renderReferenceGrid();
  renderScenarioGallery();
  renderTextSample();
  state.input = { ...INPUT_PRESETS[2] };
  dom.inputType.value = state.input.type;
  dom.briefInput.value = state.input.value;
  renderPresets();
  wireEvents();
  runCompile({ variation: false, instant: true });
}

boot();
