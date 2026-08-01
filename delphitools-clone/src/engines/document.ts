const FONT_ERROR = '字体文件无效或已损坏';

export type FontInspection = {
  family: string;
  style: string;
  unitsPerEm: number;
  glyphCount: number;
  names: {
    fullName?: string;
    postScriptName?: string;
  };
};

function escapeHtml(value: string): string {
  return value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/"/gu, '&quot;').replace(/'/gu, '&#39;');
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value.replace(/&(#x[0-9a-f]+|#\d+|\w+);/giu, (entity, code: string) => {
    if (code[0] === '#') {
      const radix = code[1]?.toLowerCase() === 'x' ? 16 : 10;
      const number = Number.parseInt(code.slice(radix === 16 ? 2 : 1), radix);
      return Number.isFinite(number) ? String.fromCodePoint(number) : entity;
    }
    return named[code.toLowerCase()] ?? entity;
  });
}

function safeUrl(value: string): string {
  const decoded = decodeEntities(value).trim();
  return /^(https?:|mailto:|\/|#)/iu.test(decoded) ? decoded : '#';
}

function renderInline(markdown: string): string {
  return escapeHtml(markdown)
    .replace(/`([^`]+)`/gu, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/gu, (_match, label: string, url: string) => `<a href="${escapeHtml(safeUrl(url))}">${label}</a>`)
    .replace(/\*\*([^*]+)\*\*/gu, '<strong>$1</strong>')
    .replace(/__([^_]+)__/gu, '<strong>$1</strong>')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/gu, '<em>$1</em>')
    .replace(/~~([^~]+)~~/gu, '<del>$1</del>');
}

export function markdownToHtml(markdown: string): string {
  const normalized = markdown.replace(/\r\n?/gu, '\n');
  const lines = normalized.split('\n');
  const output: string[] = [];
  let paragraph: string[] = [];
  let listOpen = false;
  let codeOpen = false;
  let codeLines: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length) output.push(`<p>${paragraph.map(renderInline).join('<br>')}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (listOpen) output.push('</ul>');
    listOpen = false;
  };

  for (const line of lines) {
    if (/^```/u.test(line)) {
      if (codeOpen) {
        output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
      } else {
        flushParagraph();
        closeList();
      }
      codeOpen = !codeOpen;
      continue;
    }
    if (codeOpen) {
      codeLines.push(line);
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/u);
    const bullet = line.match(/^\s*[-*+]\s+(.+)$/u);
    if (heading) {
      flushParagraph();
      closeList();
      output.push(`<h${heading[1].length}>${renderInline(heading[2])}</h${heading[1].length}>`);
    } else if (bullet) {
      flushParagraph();
      if (!listOpen) output.push('<ul>');
      listOpen = true;
      output.push(`<li>${renderInline(bullet[1])}</li>`);
    } else if (!line.trim()) {
      flushParagraph();
      closeList();
    } else {
      closeList();
      paragraph.push(line);
    }
  }
  if (codeOpen) output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  flushParagraph();
  closeList();
  return output.join('\n');
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1\s*>/giu, '')
    .replace(/<(script|style|iframe|object|embed)\b[^>]*\/?>/giu, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/giu, '')
    .replace(/\s+(href|src)\s*=\s*(["'])\s*(?:javascript|data):[\s\S]*?\2/giu, ' $1="#"');
}

export function htmlToMarkdown(html: string): string {
  let value = sanitizeHtml(html);
  value = value
    .replace(/<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/giu, (_match, _quote: string, url: string, label: string) => `[${label.replace(/<[^>]+>/gu, '')}](${safeUrl(url)})`)
    .replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/giu, (_match, level: string, content: string) => `${'#'.repeat(Number(level))} ${content}\n\n`)
    .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/giu, '**$2**')
    .replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/giu, '*$2*')
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/giu, '`$1`')
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/giu, '- $1\n')
    .replace(/<br\s*\/?>/giu, '\n')
    .replace(/<\/(p|div|section|article|ul|ol|blockquote)>/giu, '\n\n')
    .replace(/<[^>]+>/gu, '');
  return decodeEntities(value)
    .replace(/[ \t]+\n/gu, '\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[^\n]*\n([\s\S]*?)```/gu, '$1')
    .replace(/^#{1,6}\s+/gmu, '')
    .replace(/^\s*[-*+]\s+/gmu, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, '$1')
    .replace(/(\*\*|__|~~)(.*?)\1/gu, '$2')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/gu, '$1')
    .replace(/`([^`]+)`/gu, '$1')
    .trim();
}

function escapeLatex(value: string): string {
  const replacements: Record<string, string> = {
    '\\': '\\textbackslash{}', '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#', '_': '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
  };
  return value.replace(/[\\&%$#_{}~^]/gu, (character) => replacements[character]);
}

export function plainTextToHtml(text: string): string {
  return text.trim().split(/\n[\t ]*\n/gu).filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/gu, '<br>')}</p>`).join('\n');
}

function latexDocument(body: string): string {
  return `\\documentclass{article}\n\\usepackage[UTF8]{ctex}\n\\begin{document}\n${body}\n\\end{document}\n`;
}

export function plainTextToLatex(text: string): string {
  return latexDocument(text.trim().split(/\n[\t ]*\n/gu).map(escapeLatex).join('\n\n'));
}

export function markdownToLatex(markdown: string): string {
  const lines = markdown.replace(/\r\n?/gu, '\n').split('\n');
  const body = lines.map((line) => {
    const heading = line.match(/^(#{1,6})\s+(.+)$/u);
    if (heading) {
      const commands = ['section', 'subsection', 'subsubsection', 'paragraph', 'subparagraph', 'subparagraph'];
      return `\\${commands[heading[1].length - 1]}{${escapeLatex(markdownToPlainText(heading[2]))}}`;
    }
    return escapeLatex(markdownToPlainText(line));
  }).join('\n');
  return latexDocument(body);
}

function tag(view: DataView, offset: number): string {
  return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
}

function decodeFontName(bytes: Uint8Array, unicode: boolean): string {
  if (!unicode) return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('').replace(/\0/gu, '').trim();
  let result = '';
  for (let index = 0; index + 1 < bytes.length; index += 2) result += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
  return result.replace(/\0/gu, '').trim();
}

export function inspectFont(buffer: ArrayBuffer): FontInspection {
  try {
    if (buffer.byteLength < 12) throw new Error(FONT_ERROR);
    const view = new DataView(buffer);
    const signature = view.getUint32(0);
    if (![0x00010000, 0x4f54544f, 0x74727565, 0x74797031].includes(signature)) throw new Error(FONT_ERROR);
    const tableCount = view.getUint16(4);
    if (!tableCount || 12 + tableCount * 16 > buffer.byteLength) throw new Error(FONT_ERROR);
    const tables = new Map<string, { offset: number; length: number }>();
    for (let index = 0; index < tableCount; index += 1) {
      const record = 12 + index * 16;
      const offset = view.getUint32(record + 8);
      const length = view.getUint32(record + 12);
      if (offset > buffer.byteLength || length > buffer.byteLength - offset) throw new Error(FONT_ERROR);
      tables.set(tag(view, record), { offset, length });
    }
    const head = tables.get('head');
    const maxp = tables.get('maxp');
    const name = tables.get('name');
    if (!head || head.length < 20 || !maxp || maxp.length < 6) throw new Error(FONT_ERROR);

    const foundNames = new Map<number, string>();
    if (name && name.length >= 6) {
      const count = view.getUint16(name.offset + 2);
      const stringBase = name.offset + view.getUint16(name.offset + 4);
      if (6 + count * 12 > name.length) throw new Error(FONT_ERROR);
      for (let index = 0; index < count; index += 1) {
        const record = name.offset + 6 + index * 12;
        const platform = view.getUint16(record);
        const nameId = view.getUint16(record + 6);
        const length = view.getUint16(record + 8);
        const offset = stringBase + view.getUint16(record + 10);
        if (offset > buffer.byteLength || length > buffer.byteLength - offset) throw new Error(FONT_ERROR);
        const decoded = decodeFontName(new Uint8Array(buffer, offset, length), platform === 0 || platform === 3);
        if (decoded && !foundNames.has(nameId)) foundNames.set(nameId, decoded);
      }
    }

    return {
      family: foundNames.get(1) ?? '未知字体家族',
      style: foundNames.get(2) ?? '未知样式',
      unitsPerEm: view.getUint16(head.offset + 18),
      glyphCount: view.getUint16(maxp.offset + 4),
      names: { fullName: foundNames.get(4), postScriptName: foundNames.get(6) },
    };
  } catch {
    throw new Error(FONT_ERROR);
  }
}
