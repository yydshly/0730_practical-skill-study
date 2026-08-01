import { INPUT_PRESETS, VARIATION_RECIPES, QUALITY_RULES } from './data.js';

const PRESET_LOOKUP = new Map(INPUT_PRESETS.map((preset) => [preset.value, preset]));

function stableHash(text) {
  let hash = 2166136261;
  for (const char of text) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeText(rawInput) {
  if (typeof rawInput === 'string') return rawInput.trim();
  return String(rawInput ?? '').trim();
}

function deriveSubjectAndMood(type, value) {
  const preset = PRESET_LOOKUP.get(value);
  if (preset) {
    return { subject: preset.subject, mood: preset.mood };
  }
  const lower = value.toLowerCase();
  if (lower.includes('rain') || value.includes('雨')) return { subject: 'rainy bookstore', mood: 'quiet' };
  if (lower.includes('sea') || value.includes('海')) return { subject: 'seaside fragment', mood: 'afternoon' };
  if (lower.includes('night') || value.includes('夜')) return { subject: 'night gate', mood: 'night' };
  if (lower.includes('memory') || value.includes('记') || value.includes('憶')) return { subject: 'memory fragment', mood: 'memory' };
  return {
    subject: type === 'theme' ? value : 'small editorial object',
    mood: 'quiet',
  };
}

export function normalizeInput(rawInput) {
  const type = normalizeText(rawInput?.type || 'theme');
  const value = normalizeText(rawInput?.value);
  if (!value) {
    return { error: '请输入一个主题或短句。' };
  }
  const { subject, mood } = deriveSubjectAndMood(type, value);
  return {
    type,
    value,
    subject,
    mood,
    exactText: rawInput?.exactText ? normalizeText(rawInput.exactText) : '',
  };
}

export function selectVariation(normalizedInput, history = []) {
  const key = `${normalizedInput.type}|${normalizedInput.value}|${normalizedInput.subject}|${normalizedInput.mood}`;
  const startIndex = stableHash(key) % VARIATION_RECIPES.length;
  for (let offset = 0; offset < VARIATION_RECIPES.length; offset += 1) {
    const recipe = VARIATION_RECIPES[(startIndex + offset) % VARIATION_RECIPES.length];
    if (!history.includes(recipe.id)) return recipe;
  }
  return VARIATION_RECIPES[startIndex];
}

export function compilePrompt(normalizedInput, recipe) {
  const subject = normalizedInput.subject;
  const inputMood = normalizedInput.mood;
  const recipeMood = recipe.mood;
  const hue = recipe.accent;

  const fields = {
    canvas: 'Vertical 3:5 paper poster, full-frame aged paper, no border, no mockup.',
    attentionGeometry: `About 78% paper negative space with one compact cluster in a ${recipe.layout.replace('-', ' ')} arrangement.`,
    imageAnchor: `A ${recipe.anchor} that translates the subject as ${subject}.`,
    anchorTreatment: `Use paper-native treatment: soft scan edges, restrained grain, and slight misregistration for the anchor.`,
    typographySystem: `Set ${recipe.typography} with one short readable line and tiny microtext tied to the ${inputMood} tone, while the ${recipeMood} recipe mood shifts the pacing and spacing.`,
    colorLogic: `Use one unmistakable high-chroma ${hue} accent as a ${recipe.anchor}; keep it visible at thumbnail size and roughly 1%-2% of the canvas.`,
    reproductionTexture: `Flat scanned-paper appearance with ${recipe.texture}, matte absorbent paper, diffuse light, and no hard shadow.`,
    emotionalTemperature: `Quiet, poetic, archival, and ${inputMood}; the selected ${recipeMood} recipe mood should slightly bend the tone and tempo without replacing the input mood.`,
    hardAvoids: 'Avoid full-bleed scene, commercial headline, logo, CTA, glossy mockup, clean UI white, cinematic lighting, 3D, neon, cute cartoon, and dense scrapbook layout.',
  };

  const promptParagraphs = [
    `${fields.canvas} ${fields.attentionGeometry}`,
    `${fields.imageAnchor} ${fields.anchorTreatment}`,
    `${fields.typographySystem} ${fields.colorLogic} ${fields.reproductionTexture}`,
    `${fields.emotionalTemperature} ${fields.hardAvoids}`,
  ];

  return {
    fields,
    promptParagraphs,
    promptText: promptParagraphs.join('\n\n'),
    recipe,
  };
}

export function runQualityGate(compilation) {
  const prompt = compilation.promptText;
  const validators = [
    () => /3:5/.test(prompt),
    () => /(70%|78%|80%|90%)/.test(prompt),
    () => /one clear|one compact cluster|one unmistakable/.test(prompt),
    () => /(cobalt|ultramarine|magenta|lemon yellow|pear green|tomato red)/.test(prompt),
    () => /(scanned-paper|scan|grain|halftone|xerox|letterpress|mottling)/.test(prompt),
    () => /(avoid|Avoid)/.test(prompt),
  ];

  return QUALITY_RULES.map((label, index) => ({
    label,
    status: validators[index]() ? 'pass' : 'fail',
    detail:
      index === 0
        ? 'Checks vertical 3:5 format.'
        : index === 1
          ? 'Checks sparse paper coverage.'
          : index === 2
            ? 'Checks a single anchor.'
            : index === 3
              ? 'Checks saturated hue.'
              : index === 4
                ? 'Checks reproduction texture.'
                : 'Checks hard-avoid list.',
  }));
}
