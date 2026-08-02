export type RegexPreset = {
  id: 'email' | 'url' | 'phone-cn' | 'iso-date';
  name: string;
  pattern: string;
  flags: 'g' | 'giu';
  sample: string;
  description: string;
};

export const REGEX_PRESETS: readonly RegexPreset[] = [
  {
    id: 'email', name: '电子邮箱', pattern: '\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b', flags: 'giu',
    sample: '联系邮箱：hello@example.com', description: '匹配常见电子邮箱地址。',
  },
  {
    id: 'url', name: '网址', pattern: 'https?:\\/\\/[^\\s]+', flags: 'giu',
    sample: '访问 https://example.com/docs', description: '匹配以 HTTP 或 HTTPS 开头的网址。',
  },
  {
    id: 'phone-cn', name: '中国大陆手机号', pattern: '(?<!\\d)(?:\\+86[-\\s]?)?1[3-9]\\d{9}(?!\\d)', flags: 'g',
    sample: '客服：13800138000', description: '匹配中国大陆 11 位手机号码，可选 +86 区号。',
  },
  {
    id: 'iso-date', name: 'ISO 日期（基本范围检查）', pattern: '\\b\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])\\b', flags: 'g',
    sample: '发布日期：2026-08-02', description: '匹配 YYYY-MM-DD 格式并进行基本范围检查，不验证每月天数或闰年。',
  },
];
