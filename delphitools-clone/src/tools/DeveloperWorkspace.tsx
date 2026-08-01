import { useEffect, useMemo, useState } from 'react';

import { ResultPanel } from '../components/ResultPanel';
import { StatusMessage } from '../components/StatusMessage';
import { ToolLayout } from '../components/ToolLayout';
import type { ToolDefinition, ToolId } from '../core/types';
import { TAILWIND_CLASSES } from '../data/tailwindClasses';
import {
  atbash,
  cleanupWhitespace,
  convertBase,
  decodeBase64,
  decodeCaesar,
  decodeUrl,
  deduplicateLines,
  encodeBase64,
  generateBarcodeSvg,
  generateMetaTags,
  generateQrSvg,
  hashText,
  rankCaesarDecodings,
  rot13,
  slugify,
  sortLines,
  testRegex,
  transformCase,
  transliterateShavian,
  trimLines,
  type BarcodeFormat,
  type HashAlgorithm,
  type QrErrorCorrectionLevel,
  type TextCase,
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

type DecodeMethod = 'caesar' | 'atbash' | 'rot13' | 'auto';

function Decoder() {
  const [source, setSource] = useState('KHOOR ZRUOG');
  const [method, setMethod] = useState<DecodeMethod>('caesar');
  const [shift, setShift] = useState(3);
  const candidates = useMemo(() => rankCaesarDecodings(source, 5), [source]);
  const result = method === 'caesar' ? decodeCaesar(source, shift) : method === 'atbash' ? atbash(source) : method === 'rot13' ? rot13(source) : candidates[0]?.text ?? '';

  return <div className="developer-stack">
    <div className="developer-controls text-controls text-controls--two">
      <label>解码方式<select aria-label="解码方式" value={method} onChange={(event) => setMethod(event.target.value as DecodeMethod)}>
        <option value="caesar">凯撒密码</option><option value="atbash">Atbash</option><option value="rot13">ROT13</option><option value="auto">自动识别凯撒候选</option>
      </select></label>
      {method === 'caesar' && <label>左移位数<input aria-label="左移位数" type="number" min="0" max="25" value={shift} onChange={(event) => setShift(Number(event.target.value))} /></label>}
    </div>
    <label>密文<textarea aria-label="密文" value={source} onChange={(event) => setSource(event.target.value)} /></label>
    <ResultPanel text={result} download={textDownload(result, 'decoded.txt', 'text/plain;charset=utf-8', '下载解码结果')}><pre aria-label="解码结果">{result}</pre></ResultPanel>
    {method === 'auto' && <ol className="candidate-list" aria-label="自动识别候选">{candidates.map((candidate) => <li key={candidate.shift}><strong>左移 {candidate.shift}</strong><span>{candidate.text}</span></li>)}</ol>}
  </div>;
}

function MetaTagGenerator() {
  const [title, setTitle] = useState('我的网页');
  const [description, setDescription] = useState('页面简介');
  const [keywords, setKeywords] = useState('工具, 本地');
  const [author, setAuthor] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('https://example.com/');
  const [imageUrl, setImageUrl] = useState('');
  const html = generateMetaTags({ title, description, keywords, author, canonicalUrl, imageUrl });

  return <div className="developer-stack">
    <div className="developer-controls text-controls text-controls--two">
      <label>页面标题<input aria-label="页面标题" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>作者<input aria-label="作者" value={author} onChange={(event) => setAuthor(event.target.value)} /></label>
      <label>页面描述<textarea aria-label="页面描述" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <label>关键词<input aria-label="关键词" value={keywords} onChange={(event) => setKeywords(event.target.value)} /></label>
      <label>规范网址<input aria-label="规范网址" type="url" value={canonicalUrl} onChange={(event) => setCanonicalUrl(event.target.value)} /></label>
      <label>分享图片网址<input aria-label="分享图片网址" type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} /></label>
    </div>
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

function RegexTester() {
  const [pattern, setPattern] = useState('(\\w+)-(\\d+)');
  const [flags, setFlags] = useState('g');
  const [sample, setSample] = useState('item-1 item-22');
  const result = useMemo(() => testRegex(pattern, flags, sample), [pattern, flags, sample]);
  return <div className="developer-stack">
    <div className="developer-controls text-controls text-controls--two">
      <label>正则表达式<input aria-label="正则表达式" value={pattern} onChange={(event) => setPattern(event.target.value)} /></label>
      <label>正则标志<input aria-label="正则标志" value={flags} onChange={(event) => setFlags(event.target.value)} placeholder="gim" /></label>
    </div>
    <label>样本文本<textarea aria-label="样本文本" value={sample} onChange={(event) => setSample(event.target.value)} /></label>
    {result.error ? <StatusMessage status="error" message={result.error} /> : <section className="match-list" aria-label="正则匹配结果">
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

type TextAction = 'trim' | 'deduplicate' | 'sort-asc' | 'sort-desc' | 'upper' | 'lower' | 'title' | 'sentence' | 'slug' | 'whitespace';

function processText(source: string, action: TextAction): string {
  if (action === 'trim') return trimLines(source);
  if (action === 'deduplicate') return deduplicateLines(source);
  if (action === 'sort-asc' || action === 'sort-desc') return sortLines(source, action === 'sort-asc' ? 'asc' : 'desc');
  if (action === 'slug') return slugify(source);
  if (action === 'whitespace') return cleanupWhitespace(source);
  return transformCase(source, action as TextCase);
}

function TextProcessor() {
  const initial = '  第一行  \n第二行\n第一行';
  const [source, setSource] = useState(initial);
  const [action, setAction] = useState<TextAction>('trim');
  const [result, setResult] = useState('');
  return <div className="developer-stack">
    <label>待处理文本<textarea aria-label="待处理文本" value={source} onChange={(event) => setSource(event.target.value)} /></label>
    <div className="developer-controls text-controls text-controls--two">
      <label>处理方式<select aria-label="处理方式" value={action} onChange={(event) => setAction(event.target.value as TextAction)}>
        <option value="trim">清理每行首尾空格</option><option value="deduplicate">删除重复行</option><option value="sort-asc">按行升序</option><option value="sort-desc">按行降序</option>
        <option value="upper">转大写</option><option value="lower">转小写</option><option value="title">标题大小写</option><option value="sentence">句首大写</option><option value="slug">生成 Slug</option><option value="whitespace">清理多余空白</option>
      </select></label>
      <div className="inline-actions"><button type="button" onClick={() => setResult(processText(source, action))}>应用处理</button><button type="button" onClick={() => { setSource(initial); setResult(''); }}>重置文本</button></div>
    </div>
    <label>处理结果<textarea aria-label="处理结果文本" readOnly value={result} /></label>
    <ResultPanel text={result} copyLabel="复制文本" download={textDownload(result, 'processed-text.txt', 'text/plain;charset=utf-8', '下载文本')} />
  </div>;
}

function BaseConverter() {
  const [value, setValue] = useState('ff');
  const [fromBase, setFromBase] = useState(16);
  const [toBase, setToBase] = useState(10);
  const result = useMemo(() => {
    try { return { value: convertBase(value, fromBase, toBase), error: '' }; }
    catch (reason) { return { value: '', error: errorMessage(reason) }; }
  }, [value, fromBase, toBase]);
  return <div className="developer-stack">
    <label>待转换数字<input aria-label="待转换数字" value={value} onChange={(event) => setValue(event.target.value)} /></label>
    <div className="developer-controls text-controls text-controls--two">
      <label>原始进制<input aria-label="原始进制" type="number" min="2" max="36" value={fromBase} onChange={(event) => setFromBase(Number(event.target.value))} /></label>
      <label>目标进制<input aria-label="目标进制" type="number" min="2" max="36" value={toBase} onChange={(event) => setToBase(Number(event.target.value))} /></label>
    </div>
    {result.error ? <StatusMessage status="error" message={result.error} /> : <ResultPanel text={result.value}><output aria-label="进制转换结果">{result.value}</output></ResultPanel>}
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
