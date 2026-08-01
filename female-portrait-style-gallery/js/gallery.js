const REQUIRED_TEXT_FIELDS = ['description', 'image', 'geminiImage', 'geminiDescription', 'prompt'];
const REQUIRED_DETAIL_FIELDS = ['scene', 'outfit', 'camera', 'light'];
const TWO_DIGIT_NUMBER = /^\d{2}$/;
const LOCAL_PNG_PATH = /^assets\/styles\/[^/\\]+\.png$/i;
const GEMINI_IMAGE_PATH = /^assets\/styles\/gemini\/[^/\\]+\.(?:png|jpe?g)$/i;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function getSampleAsset(style, source = 'original') {
  return source === 'gemini' ? style.geminiImage : style.image;
}

export function getSampleDescription(style, source = 'original') {
  return source === 'gemini' ? style.geminiDescription : style.description;
}

export function validateCatalog(styles, { categories = [] } = {}) {
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

    if (isNonEmptyString(record.geminiImage) && !GEMINI_IMAGE_PATH.test(record.geminiImage)) {
      errors.push(`${label} 的 geminiImage 必须是 assets/styles/gemini/ 下的 PNG 或 JPEG: ${record.geminiImage}`);
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

export function filterStyles(styles, {
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

export function formatResultCount(count) {
  return count + ' 个风格';
}
