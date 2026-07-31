const REQUIRED_FIELDS = ['id', 'category', 'name', 'image', 'prompt', 'details'];

export function validateCatalog(styles) {
  const errors = styles.flatMap((style) => REQUIRED_FIELDS
    .filter((field) => !style[field] || (
      typeof style[field] === 'object' && Object.keys(style[field]).length === 0
    ))
    .map((field) => (style.id || '未命名风格') + ' 缺少 ' + field));

  return { valid: errors.length === 0, errors };
}

export function filterStyles(styles, category = 'all', query = '') {
  const needle = query.trim().toLocaleLowerCase('zh-CN');

  return styles.filter((style) => {
    const haystack = [
      style.name,
      style.category,
      style.description,
      ...style.keywords
    ].join(' ').toLocaleLowerCase('zh-CN');

    return (category === 'all' || style.category === category)
      && (!needle || haystack.includes(needle));
  });
}

export function formatResultCount(count) {
  return count + ' 个风格';
}
