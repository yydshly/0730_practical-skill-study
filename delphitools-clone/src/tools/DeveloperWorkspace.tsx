import { useEffect, useMemo, useState } from 'react';

import { ResultPanel } from '../components/ResultPanel';
import { StatusMessage } from '../components/StatusMessage';
import { ToolLayout } from '../components/ToolLayout';
import type { ToolDefinition, ToolId } from '../core/types';
import { REGEX_PRESETS } from '../data/regexPresets';
import { TAILWIND_CLASSES } from '../data/tailwindClasses';
import {
  applyBitwise16,
  atbash,
  cleanupWhitespace,
  convertCommonBases,
  convertBase,
  decodeBase64,
  decodeCaesar,
  decodeHex,
  decodeMorse,
  decodeUrl,
  decodeVigenere,
  deduplicateLines,
  encodeBase64,
  extractTextItems,
  findAndReplaceText,
  generateBarcodeSvg,
  generateMetaTags,
  generateQrSvg,
  hashText,
  numberLines,
  rankDecodingCandidates,
  removeEmptyLines,
  reverseLines,
  rot13,
  slugify,
  sortLines,
  transformCase,
  transliterateShavian,
  trimLines,
  toggleBit16,
  type BarcodeFormat,
  type BitwiseOperation,
  type CommonBaseValues,
  type HashAlgorithm,
  type QrErrorCorrectionLevel,
  type RegexTestResult,
  type TextCase,
  type TextExtractKind,
} from '../engines/developer';

type DeveloperWorkspaceProps = { tool: ToolDefinition };

const DEVELOPER_TOOL_IDS: readonly ToolId[] = [
  'code-genny', 'decoder', 'meta-tag-genny', 'qr-genny', 'regex-tester',
  'tailwind-cheatsheet', 'markdown-writer', 'base-converter', 'encoder', 'shavian-transliterator',
];

export function isDeveloperToolId(toolId: ToolId): boolean {
  return DEVELOPER_TOOL_IDS.includes(toolId);
}

function textDownload(text: string, name: string, type: string, label: string) {
  return { blob: new Blob([text], { type }), name, label };
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : '处理失败，请检查输入后重试';
}

function SvgResult({ svg, label, fileName, downloadLabel }: { svg: string; label: string; fileName: string; downloadLabel: string }) {
  return <ResultPanel download={textDownload(svg, fileName, 'image/svg+xml;charset=utf-8', downloadLabel)}>
    <div className="svg-preview" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />
  </ResultPanel>;
}

function BarcodeGenerator() {
  const [format, setFormat] = useState<BarcodeFormat>('code128');
  const [value, setValue] = useState('HELLO-123');
  const result = useMemo(() => {
    try { return { svg: generateBarcodeSvg(format, value), error: '' }; }
    catch (reason) { return { svg: '', error: errorMessage(reason) }; }
  }, [format, value]);

  return <div className="developer-stack">
    <div className="developer-controls text-controls text-controls--two">
      <label>条码格式<select aria-label="条码格式" value={format} onChange={(event) => setFormat(event.target.value as BarcodeFormat)}>
        <option value="code128">Code 128</option><option value="ean13">EAN-13</option>
        <option value="datamatrix">Data Matrix</option><option value="azteccode">Aztec</option><option value="pdf417">PDF417</option>
      </select></label>
      <label>条码内容<input aria-label="条码内容" value={value} onChange={(event) => setValue(event.target.value)} /></label>
    </div>
    <p className="format-limit">EAN-13 需要含有效校验位的 13 位数字；Code 128 仅接受可打印 ASCII。当前列表中的五种格式均由本地条码引擎真实生成。</p>
    {result.error ? <StatusMessage status="error" message={result.error} /> : <SvgResult svg={result.svg} label="条形码 SVG 预览" fileName={`barcode-${format}.svg`} downloadLabel="下载条形码 SVG" />}
  </div>;
}

type DecodeMethod = 'caesar' | 'atbash' | 'rot13' | 'vigenere' | 'morse' | 'hex' | 'base64' | 'auto';

function Decoder() {
  const [source, setSource] = useState('KHOOR ZRUOG');
  const [method, setMethod] = useState<DecodeMethod>('caesar');
  const [shift, setShift] = useState(3);
  const [key, setKey] = useState('LEMON');
  const candidates = useMemo(() => rankDecodingCandidates(source, 10), [source]);
  const decoded = useMemo(() => {
    try {
      if (method === 'caesar') return { value: decodeCaesar(source, shift), error: '' };
      if (method === 'atbash') return { value: atbash(source), error: '' };
      if (method === 'rot13') return { value: rot13(source), error: '' };
      if (method === 'vigenere') return { value: decodeVigenere(source, key), error: '' };
      if (method === 'morse') return { value: decodeMorse(source), error: '' };
      if (method === 'hex') return { value: decodeHex(source), error: '' };
      if (method === 'base64') return { value: decodeBase64(source), error: '' };
      return { value: candidates[0]?.text ?? '', error: '' };
    } catch (reason) {
      return { value: '', error: errorMessage(reason) };
    }
  }, [candidates, key, method, shift, source]);

  return <div className="developer-stack">
    <div className="developer-controls text-controls text-controls--two">
      <label>解码方式<select aria-label="解码方式" value={method} onChange={(event) => setMethod(event.target.value as DecodeMethod)}>
        <option value="caesar">凯撒密码</option><option value="atbash">Atbash</option><option value="rot13">ROT13</option><option value="vigenere">Vigenere</option>
        <option value="morse">Morse</option><option value="hex">十六进制 UTF-8</option><option value="base64">Base64</option><option value="auto">自动识别候选</option>
      </select></label>
      {method === 'caesar' && <label>左移位数<input aria-label="左移位数" type="number" min="0" max="25" value={shift} onChange={(event) => setShift(Number(event.target.value))} /></label>}
      {method === 'vigenere' && <label>密钥<input aria-label="密钥" value={key} onChange={(event) => setKey(event.target.value)} placeholder="仅 A-Z 或 a-z" /></label>}
    </div>
    <label>密文<textarea aria-label="密文" value={source} onChange={(event) => setSource(event.target.value)} /></label>
    {decoded.error ? <StatusMessage status="error" message={decoded.error} /> : <ResultPanel text={decoded.value} download={textDownload(decoded.value, 'decoded.txt', 'text/plain;charset=utf-8', '下载解码结果')}><pre aria-label="解码结果">{decoded.value}</pre></ResultPanel>}
    {method === 'auto' && <ol className="candidate-list" aria-label="自动识别候选">{candidates.map((candidate) => <li key={`${candidate.method}-${candidate.text}`}><strong>{candidate.label}</strong><span>{candidate.text}</span></li>)}</ol>}
    <details className="format-limit"><summary>密码参考</summary><ul>
      <li>凯撒、Atbash 和 ROT13 仅变换英文字母，其他字符保持不变。</li>
      <li>Vigenere 需要仅由 A-Z 或 a-z 组成的密钥；标点和中文不会消耗密钥位置。</li>
      <li>Morse 使用空格分隔字符、/ 分隔单词，支持 A-Z、0-9 和常用标点。</li>
      <li>十六进制接受空格、冒号或连字符分隔的偶数字节，并严格按 UTF-8 解码。</li>
      <li>自动模式只尝试形态明确的 Morse、十六进制和 Base64；不会猜测 Vigenere 密钥。</li>
    </ul></details>
  </div>;
}

function MetaTagGenerator() {
  const [title, setTitle] = useState('我的网页');
  const [description, setDescription] = useState('页面简介');
  const [keywords, setKeywords] = useState('工具, 本地');
  const [author, setAuthor] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('https://example.com/');
  const [imageUrl, setImageUrl] = useState('');
  const [siteName, setSiteName] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [twitterCard, setTwitterCard] = useState<'summary' | 'summary_large_image'>('summary');
  const html = generateMetaTags({ title, description, keywords, author, canonicalUrl, imageUrl, siteName, twitterHandle, twitterCard });

  return <div className="developer-stack" style={{ minWidth: 0 }}>
    <div className="developer-controls text-controls text-controls--two">
      <label>页面标题<input aria-label="页面标题" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>作者<input aria-label="作者" value={author} onChange={(event) => setAuthor(event.target.value)} /></label>
      <label>页面描述<textarea aria-label="页面描述" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <label>关键词<input aria-label="关键词" value={keywords} onChange={(event) => setKeywords(event.target.value)} /></label>
      <label>规范网址<input aria-label="规范网址" type="url" value={canonicalUrl} onChange={(event) => setCanonicalUrl(event.target.value)} /></label>
      <label>分享图片网址<input aria-label="分享图片网址" type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} /></label>
      <label>站点名称<input aria-label="站点名称" value={siteName} onChange={(event) => setSiteName(event.target.value)} /></label>
      <label>Twitter 账号<input aria-label="Twitter 账号" value={twitterHandle} onChange={(event) => setTwitterHandle(event.target.value)} placeholder="@example" /></label>
      <label>Twitter 卡片<select aria-label="Twitter 卡片" value={twitterCard} onChange={(event) => setTwitterCard(event.target.value as 'summary' | 'summary_large_image')}>
        <option value="summary">摘要卡片</option><option value="summary_large_image">大图卡片</option>
      </select></label>
    </div>
    <section className="match-list" aria-label="社交分享预览">
      <h2>社交分享预览</h2>
      <article>
        <div aria-label="本地图片占位">本地图片占位</div>
        <strong>{title.trim() || '页面标题'}</strong>
        <span>{description.trim() || '页面描述'}</span>
        <span>{siteName.trim() || '站点名称'}</span>
        <span>{imageUrl.trim() || '未提供图片网址'}</span>
      </article>
    </section>
    <ResultPanel text={html} copyLabel="复制 Meta HTML" download={textDownload(html, 'meta-tags.html', 'text/html;charset=utf-8', '下载 Meta HTML')}>
      <pre className="source-preview" aria-label="Meta HTML 源码"><code>{html}</code></pre>
    </ResultPanel>
  </div>;
}

function QrGenerator() {
  const [text, setText] = useState('https://example.com/');
  const [dark, setDark] = useState('#18231d');
  const [light, setLight] = useState('#ffffff');
  const [level, setLevel] = useState<QrErrorCorrectionLevel>('M');
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    generateQrSvg({ text, dark, light, errorCorrectionLevel: level, logoDataUrl: logoDataUrl || undefined })
      .then((value) => { if (active) { setSvg(value); setError(''); } })
      .catch((reason) => { if (active) { setSvg(''); setError(errorMessage(reason)); } });
    return () => { active = false; };
  }, [text, dark, light, level, logoDataUrl]);

  const handleLogo = (file?: File) => {
    if (!file) { setLogoDataUrl(''); return; }
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) { setError('中心 Logo 仅支持 PNG、JPEG、WebP 或 SVG'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('中心 Logo 不能超过 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => setError('无法读取中心 Logo');
    reader.readAsDataURL(file);
  };

  return <div className="developer-stack">
    <label>二维码内容<textarea aria-label="二维码内容" value={text} onChange={(event) => setText(event.target.value)} /></label>
    <div className="developer-controls text-controls text-controls--three">
      <label>前景色<input aria-label="二维码前景色" type="color" value={dark} onChange={(event) => setDark(event.target.value)} /></label>
      <label>背景色<input aria-label="二维码背景色" type="color" value={light} onChange={(event) => setLight(event.target.value)} /></label>
      <label>纠错级别<select aria-label="纠错级别" value={level} onChange={(event) => setLevel(event.target.value as QrErrorCorrectionLevel)}><option value="L">L · 约 7%</option><option value="M">M · 约 15%</option><option value="Q">Q · 约 25%</option><option value="H">H · 约 30%</option></select></label>
    </div>
    <label>中心 Logo（可选）<input aria-label="中心 Logo（可选）" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleLogo(event.target.files?.[0])} /></label>
    {error ? <StatusMessage status="error" message={error} /> : svg ? <SvgResult svg={svg} label="二维码 SVG 预览" fileName="qrcode.svg" downloadLabel="下载二维码 SVG" /> : <StatusMessage status="loading" message="正在生成二维码" />}
  </div>;
}

const REGEX_QUICK_FLAGS = ['g', 'i', 'm', 's', 'u', 'y', 'd'] as const;
const REGEX_FLAG_ORDER = ['d', 'g', 'i', 'm', 's', 'u', 'y'] as const;

function normalizeRegexFlagInput(value: string): string {
  return value.includes('u') && value.includes('v') ? value.replace(/v/gu, '') : value;
}

function toggleRegexFlag(flags: string, flag: (typeof REGEX_QUICK_FLAGS)[number]): string {
  const selected = new Set(flags);
  if (selected.has(flag)) selected.delete(flag);
  else selected.add(flag);
  if (flag === 'u') selected.delete('v');
  return REGEX_FLAG_ORDER.filter((item) => selected.has(item)).join('');
}

function RegexTester() {
  const [pattern, setPattern] = useState('(\\w+)-(\\d+)');
  const [flags, setFlags] = useState('g');
  const [sample, setSample] = useState('item-1 item-22');
  const [result, setResult] = useState<RegexTestResult>({ matches: [], error: null });
  const [isTesting, setIsTesting] = useState(true);

  useEffect(() => {
    if (pattern.length > 1_000 || sample.length > 200_000) {
      setResult({ matches: [], error: '正则表达式最多 1,000 个字符，样本文本最多 200,000 个字符' });
      setIsTesting(false);
      return;
    }
    if (typeof Worker === 'undefined') {
      setResult({ matches: [], error: '当前浏览器不支持安全的正则隔离计算' });
      setIsTesting(false);
      return;
    }

    let worker: Worker | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    setIsTesting(true);
    const startId = window.setTimeout(() => {
      try {
        worker = new Worker(new URL('../workers/regex.worker.ts', import.meta.url), { type: 'module' });
        const requestId = Date.now();
        timeoutId = setTimeout(() => {
          if (settled) return;
          settled = true;
          worker?.terminate();
          setResult({ matches: [], error: '正则计算超时，请简化表达式或缩短样本文本' });
          setIsTesting(false);
        }, 500);
        worker.onmessage = (event: MessageEvent<{ id: number; result: RegexTestResult }>) => {
          if (settled || event.data.id !== requestId) return;
          settled = true;
          if (timeoutId !== undefined) clearTimeout(timeoutId);
          setResult(event.data.result);
          setIsTesting(false);
          worker?.terminate();
        };
        worker.onerror = () => {
          if (settled) return;
          settled = true;
          if (timeoutId !== undefined) clearTimeout(timeoutId);
          setResult({ matches: [], error: '正则计算失败，请检查表达式后重试' });
          setIsTesting(false);
          worker?.terminate();
        };
        worker.postMessage({ id: requestId, pattern, flags, sample });
      } catch {
        settled = true;
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        worker?.terminate();
        setResult({ matches: [], error: '无法启动安全的正则隔离区，请检查浏览器安全策略' });
        setIsTesting(false);
      }
    }, 80);

    return () => {
      settled = true;
      window.clearTimeout(startId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      worker?.terminate();
    };
  }, [pattern, flags, sample]);

  return <div className="developer-stack">
    <div className="inline-actions" aria-label="正则预设">
      {REGEX_PRESETS.map((preset) => <button key={preset.id} type="button" onClick={() => {
        setPattern(preset.pattern);
        setFlags(preset.flags);
        setSample(preset.sample);
      }}>{preset.name}</button>)}
    </div>
    <div className="developer-controls text-controls text-controls--two">
      <label>正则表达式<input aria-label="正则表达式" value={pattern} onChange={(event) => setPattern(event.target.value)} /></label>
      <label>正则标志<input aria-label="正则标志" value={flags} onChange={(event) => setFlags(normalizeRegexFlagInput(event.target.value))} placeholder="gim" /></label>
    </div>
    <div className="inline-actions" aria-label="正则标志快捷按钮">
      {REGEX_QUICK_FLAGS.map((flag) => <button key={flag} type="button" aria-pressed={flags.includes(flag)} onClick={() => setFlags((current) => toggleRegexFlag(current, flag))}>{flag}</button>)}
    </div>
    <label>样本文本<textarea aria-label="样本文本" value={sample} onChange={(event) => setSample(event.target.value)} /></label>
    {isTesting ? <StatusMessage status="loading" message="正在安全隔离区测试正则" /> : result.error ? <StatusMessage status="error" message={result.error} /> : <section className="match-list" aria-label="正则匹配结果">
      <h2>{result.matches.length} 个匹配</h2>
      {result.matches.length === 0 ? <p>没有匹配内容。</p> : result.matches.map((match, index) => <article key={`${match.index}-${index}`}>
        <strong>{match.text || '空匹配'}</strong><span>索引 {match.index}</span>
        <span>捕获组：{match.groups.length ? match.groups.join('、') : '无'}</span>
        {Object.keys(match.namedGroups).length > 0 && <span>命名组：{Object.entries(match.namedGroups).map(([name, value]) => `${name}=${value}`).join('、')}</span>}
      </article>)}
    </section>}
  </div>;
}

function TailwindCheatsheet() {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLocaleLowerCase();
  const entries = TAILWIND_CLASSES.filter((entry) => !normalized || [entry.className, entry.category, entry.description].some((value) => value.toLocaleLowerCase().includes(normalized)));
  return <div className="developer-stack">
    <label>搜索 Tailwind 类名<input aria-label="搜索 Tailwind 类名" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如 grid、间距或 rounded" /></label>
    <p>{entries.length} 条本地速查结果，无需联网。</p>
    <div className="cheatsheet-grid" aria-label="Tailwind 类名列表">{entries.map((entry) => <article key={entry.className}><span>{entry.category}</span><code>{entry.className}</code><p>{entry.description}</p></article>)}</div>
  </div>;
}

type TextAction = 'trim' | 'deduplicate' | 'sort-asc' | 'sort-desc' | 'upper' | 'lower' | 'title' | 'sentence' | 'toggle' | 'slug' | 'whitespace' | 'reverse-lines' | 'remove-empty-lines' | 'number-lines';

function processText(source: string, action: TextAction): string {
  if (action === 'trim') return trimLines(source);
  if (action === 'deduplicate') return deduplicateLines(source);
  if (action === 'sort-asc' || action === 'sort-desc') return sortLines(source, action === 'sort-asc' ? 'asc' : 'desc');
  if (action === 'slug') return slugify(source);
  if (action === 'whitespace') return cleanupWhitespace(source);
  if (action === 'reverse-lines') return reverseLines(source);
  if (action === 'remove-empty-lines') return removeEmptyLines(source);
  if (action === 'number-lines') return numberLines(source);
  return transformCase(source, action as TextCase);
}

function TextProcessor() {
  const initial = '  第一行  \n第二行\n第一行';
  const [source, setSource] = useState(initial);
  const [action, setAction] = useState<TextAction>('trim');
  const [result, setResult] = useState('');
  const [findQuery, setFindQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [replaceAll, setReplaceAll] = useState(true);
  const [extractKind, setExtractKind] = useState<TextExtractKind>('emails');
  const [extractResult, setExtractResult] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const applyFindReplace = () => {
    try {
      const next = findAndReplaceText(source, findQuery, replacement, { useRegex, caseSensitive, replaceAll });
      setResult(next.text);
      setMessage(`已替换 ${next.replacements} 处`);
      setError('');
    } catch (reason) {
      setError(errorMessage(reason));
      setMessage('');
    }
  };

  const extract = () => {
    const items = extractTextItems(source, extractKind);
    const next = items.join('\n');
    setExtractResult(next);
    setResult(next);
    setMessage(`已提取 ${items.length} 项`);
    setError('');
  };

  const reset = () => {
    setSource(initial); setAction('trim'); setResult(''); setFindQuery(''); setReplacement('');
    setUseRegex(false); setCaseSensitive(true); setReplaceAll(true); setExtractKind('emails'); setExtractResult(''); setMessage(''); setError('');
  };

  return <div className="developer-stack">
    {error && <StatusMessage status="error" message={error} />}
    <label>待处理文本<textarea aria-label="待处理文本" value={source} onChange={(event) => setSource(event.target.value)} /></label>
    <section className="developer-stack" aria-labelledby="text-find-replace"><h2 id="text-find-replace">查找替换</h2>
      <div className="developer-controls text-controls text-controls--two">
        <label>查找内容<input aria-label="查找内容" value={findQuery} onChange={(event) => setFindQuery(event.target.value)} /></label>
        <label>替换为<input aria-label="替换为" value={replacement} onChange={(event) => setReplacement(event.target.value)} /></label>
      </div>
      <div className="inline-actions" aria-label="查找替换选项">
        <label><input aria-label="使用正则表达式" type="checkbox" checked={useRegex} onChange={(event) => setUseRegex(event.target.checked)} />使用正则表达式</label>
        <label><input aria-label="区分大小写" type="checkbox" checked={caseSensitive} onChange={(event) => setCaseSensitive(event.target.checked)} />区分大小写</label>
        <label><input aria-label="全部替换" type="checkbox" checked={replaceAll} onChange={(event) => setReplaceAll(event.target.checked)} />全部替换</label>
        <button type="button" onClick={applyFindReplace}>执行查找替换</button>
      </div>
    </section>
    <section className="developer-stack" aria-labelledby="text-extract"><h2 id="text-extract">提取内容</h2>
      <div className="developer-controls text-controls text-controls--two">
        <label>提取类型<select aria-label="提取类型" value={extractKind} onChange={(event) => setExtractKind(event.target.value as TextExtractKind)}>
          <option value="emails">电子邮箱</option><option value="urls">网址</option><option value="phone-numbers">电话号码</option><option value="numbers">数字</option>
        </select></label>
        <div className="inline-actions"><button type="button" onClick={extract}>提取内容</button></div>
      </div>
      <label>提取结果<textarea aria-label="提取结果" readOnly value={extractResult} /></label>
    </section>
    <section className="developer-stack" aria-labelledby="text-actions"><h2 id="text-actions">大小写、行与清理</h2>
    <div className="developer-controls text-controls text-controls--two">
      <label>处理方式<select aria-label="处理方式" value={action} onChange={(event) => setAction(event.target.value as TextAction)}>
        <option value="trim">清理每行首尾空格</option><option value="deduplicate">删除重复行</option><option value="sort-asc">按行升序</option><option value="sort-desc">按行降序</option>
        <option value="upper">转大写</option><option value="lower">转小写</option><option value="title">标题大小写</option><option value="sentence">句首大写</option><option value="toggle">切换大小写</option><option value="slug">生成 Slug</option><option value="whitespace">清理多余空白</option>
        <option value="reverse-lines">逆序行</option><option value="remove-empty-lines">删除空行</option><option value="number-lines">添加行号</option>
      </select></label>
      <div className="inline-actions"><button type="button" onClick={() => { setResult(processText(source, action)); setMessage(''); setError(''); }}>应用处理</button><button type="button" onClick={reset}>重置文本</button></div>
    </div>
    </section>
    {message && <p role="status">{message}</p>}
    <label>处理结果<textarea aria-label="处理结果文本" readOnly value={result} /></label>
    <ResultPanel text={result} copyLabel="复制文本" download={textDownload(result, 'processed-text.txt', 'text/plain;charset=utf-8', '下载文本')} />
  </div>;
}

function BaseConverter() {
  type CommonBaseKey = keyof CommonBaseValues;
  const initialValues = convertCommonBases('ff', 16);
  const [commonValues, setCommonValues] = useState<CommonBaseValues>(initialValues);
  const [lastValidValues, setLastValidValues] = useState<CommonBaseValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CommonBaseKey, string>>>({});
  const [bitValue, setBitValue] = useState(initialValues.decimal);
  const [bitRight, setBitRight] = useState('1');
  const [bitResult, setBitResult] = useState('');
  const [bitError, setBitError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const baseByKey: Record<CommonBaseKey, number> = { binary: 2, octal: 8, decimal: 10, hexadecimal: 16 };
  const labelByKey: Record<CommonBaseKey, string> = { binary: '二进制', octal: '八进制', decimal: '十进制', hexadecimal: '十六进制' };
  const [value, setValue] = useState('ff');
  const [fromBase, setFromBase] = useState(16);
  const [toBase, setToBase] = useState(10);
  const arbitraryResult = useMemo(() => {
    try { return { value: convertBase(value, fromBase, toBase), error: '' }; }
    catch (reason) { return { value: '', error: errorMessage(reason) }; }
  }, [value, fromBase, toBase]);
  const updateFromCommonField = (key: CommonBaseKey, nextValue: string) => {
    setCommonValues((current) => ({ ...current, [key]: nextValue }));
    try {
      const next = convertCommonBases(nextValue, baseByKey[key]);
      setCommonValues(next);
      setLastValidValues(next);
      setFieldErrors({});
      if (/^\d+$/u.test(next.decimal) && BigInt(next.decimal) <= 0xffffn) setBitValue(next.decimal);
      setBitError('');
    } catch (reason) {
      setFieldErrors({ [key]: errorMessage(reason) });
    }
  };

  const applyBitDecimal = (decimal: string) => {
    const next = convertCommonBases(decimal, 10);
    setCommonValues(next);
    setLastValidValues(next);
    setBitValue(decimal);
    setFieldErrors({});
  };

  const executeBitAction = (operation: BitwiseOperation, bit?: number) => {
    try {
      const next = bit === undefined ? applyBitwise16(bitValue, bitRight, operation) : toggleBit16(bitValue, bit);
      setBitResult(next);
      applyBitDecimal(next);
      setBitError('');
    } catch (reason) {
      setBitError(errorMessage(reason));
    }
  };

  const isBitSet = (bit: number) => {
    if (!/^\d+$/u.test(bitValue)) return false;
    try { return (BigInt(bitValue) & (1n << BigInt(bit))) !== 0n; } catch { return false; }
  };

  const copyValue = async (key: CommonBaseKey) => {
    try {
      await navigator.clipboard.writeText(lastValidValues[key]);
      setCopyMessage(`已复制${labelByKey[key]}`);
    } catch {
      setCopyMessage('复制失败，请手动选择文本');
    }
  };

  return <div className="developer-stack">
    <p className="format-limit">四种常用进制会同步更新，支持任意长度整数和负数；下方位操作单独限制为无符号 16 位（0 到 65535）。</p>
    <section className="developer-stack" aria-labelledby="common-base-heading">
      <h2 id="common-base-heading">常用进制同步</h2>
      <div className="developer-controls text-controls text-controls--two">
        {(Object.keys(baseByKey) as CommonBaseKey[]).map((key) => <label key={key}>{labelByKey[key]}
          <input aria-label={labelByKey[key]} value={commonValues[key]} onChange={(event) => updateFromCommonField(key, event.target.value)} />
          {fieldErrors[key] && <span role="alert">{fieldErrors[key]}</span>}
          <button type="button" onClick={() => void copyValue(key)} aria-label={`复制${labelByKey[key]}`}>复制{labelByKey[key]}</button>
        </label>)}
      </div>
      {copyMessage && <p role="status">{copyMessage}</p>}
    </section>
    <section className="developer-stack" aria-labelledby="bitwise-heading">
      <h2 id="bitwise-heading">16 位 Bit Toggle 与位运算</h2>
      <p className="format-limit">每次运算都会保留低 16 位；bit 0 是最低位，bit 15 是最高位。</p>
      <div className="developer-controls text-controls text-controls--two">
        <label>16 位数值<input aria-label="16 位数值" inputMode="numeric" value={bitValue} onChange={(event) => setBitValue(event.target.value)} /></label>
        <label>第二操作数<input aria-label="第二操作数" inputMode="numeric" value={bitRight} onChange={(event) => setBitRight(event.target.value)} /></label>
      </div>
      <div className="inline-actions" aria-label="16 位 bit 切换">
        {Array.from({ length: 16 }, (_, bit) => <button key={bit} type="button" aria-pressed={isBitSet(bit)} onClick={() => executeBitAction('xor', bit)}>bit {bit}</button>)}
      </div>
      <div className="inline-actions" aria-label="16 位位运算">
        <button type="button" onClick={() => executeBitAction('and')}>AND</button><button type="button" onClick={() => executeBitAction('or')}>OR</button><button type="button" onClick={() => executeBitAction('xor')}>XOR</button>
        <button type="button" onClick={() => executeBitAction('not')}>NOT</button><button type="button" onClick={() => executeBitAction('shift-left')}>左移</button><button type="button" onClick={() => executeBitAction('shift-right')}>右移</button>
      </div>
      {bitError ? <StatusMessage status="error" message={bitError} /> : <output aria-label="位运算结果">{bitResult}</output>}
    </section>
    <details className="developer-stack"><summary>任意进制转换（2 到 36）</summary>
      <label>待转换数字<input aria-label="待转换数字" value={value} onChange={(event) => setValue(event.target.value)} /></label>
      <div className="developer-controls text-controls text-controls--two">
        <label>原始进制<input aria-label="原始进制" type="number" min="2" max="36" value={fromBase} onChange={(event) => setFromBase(Number(event.target.value))} /></label>
        <label>目标进制<input aria-label="目标进制" type="number" min="2" max="36" value={toBase} onChange={(event) => setToBase(Number(event.target.value))} /></label>
      </div>
      {arbitraryResult.error ? <StatusMessage status="error" message={arbitraryResult.error} /> : <ResultPanel text={arbitraryResult.value}><output aria-label="进制转换结果">{arbitraryResult.value}</output></ResultPanel>}
    </details>
  </div>;
}

function Encoder() {
  const [encodeInput, setEncodeInput] = useState('你好');
  const [encodeResult, setEncodeResult] = useState('');
  const [decodeInput, setDecodeInput] = useState('5L2g5aW9');
  const [decodeResult, setDecodeResult] = useState('');
  const [hashInput, setHashInput] = useState('abc');
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>('SHA-256');
  const [hashResult, setHashResult] = useState('');
  const [error, setError] = useState('');

  const run = (operation: () => string, setter: (value: string) => void) => {
    try { setter(operation()); setError(''); } catch (reason) { setError(errorMessage(reason)); }
  };
  const runHash = async () => {
    try { setHashResult(await hashText(hashInput, algorithm)); setError(''); } catch (reason) { setError(errorMessage(reason)); }
  };

  return <div className="developer-stack">
    {error && <StatusMessage status="error" message={error} />}
    <div className="encoder-grid">
      <section><h2>编码</h2><label>编码输入<textarea aria-label="编码输入" value={encodeInput} onChange={(event) => setEncodeInput(event.target.value)} /></label><div className="inline-actions"><button type="button" onClick={() => run(() => encodeBase64(encodeInput), setEncodeResult)}>Base64 编码</button><button type="button" onClick={() => run(() => encodeURIComponent(encodeInput), setEncodeResult)}>URL 编码</button></div><pre aria-label="编码结果">{encodeResult}</pre></section>
      <section><h2>解码</h2><label>解码输入<textarea aria-label="解码输入" value={decodeInput} onChange={(event) => setDecodeInput(event.target.value)} /></label><div className="inline-actions"><button type="button" onClick={() => run(() => decodeBase64(decodeInput), setDecodeResult)}>Base64 解码</button><button type="button" onClick={() => run(() => decodeUrl(decodeInput), setDecodeResult)}>URL 解码</button></div><pre aria-label="解码结果">{decodeResult}</pre></section>
      <section><h2>哈希</h2><label>哈希输入<textarea aria-label="哈希输入" value={hashInput} onChange={(event) => setHashInput(event.target.value)} /></label><label>哈希算法<select aria-label="哈希算法" value={algorithm} onChange={(event) => setAlgorithm(event.target.value as HashAlgorithm)}><option>SHA-1</option><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option></select></label><button type="button" onClick={runHash}>生成哈希</button><pre aria-label="哈希结果">{hashResult}</pre></section>
    </div>
  </div>;
}

function ShavianTransliterator() {
  const [source, setSource] = useState('Hello, world!');
  const result = transliterateShavian(source);
  return <div className="developer-stack">
    <p className="format-limit">本工具基于规则和显式映射做近似转写，不是语音词典。标点、空格、数字和未知文字会原样保留。</p>
    <label>英文原文<textarea aria-label="英文原文" value={source} onChange={(event) => setSource(event.target.value)} /></label>
    <ResultPanel text={result} download={textDownload(result, 'shavian.txt', 'text/plain;charset=utf-8', '下载 Shavian 文本')}><pre className="shavian-output" aria-label="Shavian 转写结果">{result}</pre></ResultPanel>
  </div>;
}

function ToolContent({ toolId }: { toolId: ToolId }) {
  if (toolId === 'code-genny') return <BarcodeGenerator />;
  if (toolId === 'decoder') return <Decoder />;
  if (toolId === 'meta-tag-genny') return <MetaTagGenerator />;
  if (toolId === 'qr-genny') return <QrGenerator />;
  if (toolId === 'regex-tester') return <RegexTester />;
  if (toolId === 'tailwind-cheatsheet') return <TailwindCheatsheet />;
  if (toolId === 'markdown-writer') return <TextProcessor />;
  if (toolId === 'base-converter') return <BaseConverter />;
  if (toolId === 'encoder') return <Encoder />;
  return <ShavianTransliterator />;
}

export function DeveloperWorkspace({ tool }: DeveloperWorkspaceProps) {
  return <ToolLayout tool={tool} localNote="输入、文件、编码、哈希、二维码和条形码均只在你的设备本地处理，不会上传。">
    <div className="developer-workspace text-workspace" aria-label={`${tool.title} 工作区`}><ToolContent toolId={tool.id} /></div>
  </ToolLayout>;
}
