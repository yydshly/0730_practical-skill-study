import { useState } from 'react';

import { FileDropzone } from '../components/FileDropzone';
import { ResultPanel } from '../components/ResultPanel';
import { StatusMessage } from '../components/StatusMessage';
import { ToolLayout } from '../components/ToolLayout';
import { copyText } from '../core/clipboard';
import type { ToolDefinition, ToolId } from '../core/types';
import { PAPER_SIZES, convertPaperDimensions, type PaperUnit } from '../data/paperSizes';
import { UNICODE_BLOCKS, searchUnicode } from '../data/unicodeBlocks';
import { htmlToMarkdown, inspectFont, markdownToHtml, markdownToLatex, markdownToPlainText, plainTextToHtml, plainTextToLatex, sanitizeHtml, type FontInspection } from '../engines/document';
import { calculateLineHeight, convertTypographyUnit, countText, diffText, pxToRem, remToPx, type TypographyUnit } from '../engines/text';

type TextWorkspaceProps = { tool: ToolDefinition };
type DocumentInput = 'markdown' | 'html' | 'text';
type DocumentOutput = 'markdown' | 'html' | 'text' | 'latex';

const TEXT_TOOL_IDS: readonly ToolId[] = [
  'doc-converter', 'text-editor', 'font-explorer', 'glyph-browser', 'large-type', 'line-height-calc',
  'paper-sizes', 'px-to-rem', 'text-diff', 'typo-calc', 'word-counter',
];
const INITIAL_MARKDOWN = '# 本地 Markdown 编辑器\n\n在这里开始写作，内容只留在你的浏览器中。';

export function isTextToolId(toolId: ToolId): boolean {
  return TEXT_TOOL_IDS.includes(toolId);
}

function download(text: string, name: string, type: string, label: string) {
  return { blob: new Blob([text], { type }), name, label };
}

function convertDocument(source: string, input: DocumentInput, output: DocumentOutput): string {
  if (input === output) return input === 'html' ? sanitizeHtml(source) : source;
  const markdown = input === 'markdown' ? source : input === 'html' ? htmlToMarkdown(source) : source;
  if (output === 'markdown') return markdown;
  if (output === 'html') return input === 'text' ? plainTextToHtml(source) : markdownToHtml(markdown);
  if (output === 'text') return input === 'text' ? source : markdownToPlainText(markdown);
  return input === 'text' ? plainTextToLatex(source) : markdownToLatex(markdown);
}

function outputMeta(format: DocumentOutput) {
  if (format === 'html') return ['document.html', 'text/html;charset=utf-8', '下载 HTML'] as const;
  if (format === 'latex') return ['document.tex', 'application/x-tex;charset=utf-8', '下载 LaTeX'] as const;
  if (format === 'text') return ['document.txt', 'text/plain;charset=utf-8', '下载纯文本'] as const;
  return ['document.md', 'text/markdown;charset=utf-8', '下载 Markdown'] as const;
}

function DocumentConverter() {
  const initial = '# 文档标题\n\n这是一份在本地转换的 Markdown 文档。';
  const [input, setInput] = useState<DocumentInput>('markdown');
  const [output, setOutput] = useState<DocumentOutput>('html');
  const [source, setSource] = useState(initial);
  const result = convertDocument(source, input, output);
  const [name, mime, label] = outputMeta(output);
  return <div className="text-tool-stack">
    <div className="text-controls text-controls--two">
      <label>输入格式<select aria-label="输入格式" value={input} onChange={(event) => setInput(event.target.value as DocumentInput)}><option value="markdown">Markdown</option><option value="html">HTML</option><option value="text">纯文本</option></select></label>
      <label>输出格式<select aria-label="输出格式" value={output} onChange={(event) => setOutput(event.target.value as DocumentOutput)}><option value="html">HTML</option><option value="markdown">Markdown</option><option value="text">纯文本</option><option value="latex">LaTeX</option></select></label>
    </div>
    <label className="text-area-field">文档内容<textarea aria-label="文档内容" value={source} onChange={(event) => setSource(event.target.value)} /></label>
    <p className="format-limit">当前可靠生成 Markdown、HTML、纯文本和 LaTeX。Word 和 EPUB 未作为可见选项提供，避免生成仅改扩展名的无效文件。</p>
    <ResultPanel text={result} copyLabel="复制转换结果" download={download(result, name, mime, label)} onReset={() => { setInput('markdown'); setOutput('html'); setSource(initial); }}>
      <pre className="document-output" aria-label="转换结果"><code>{result}</code></pre>
    </ResultPanel>
  </div>;
}

function MarkdownEditor() {
  const [source, setSource] = useState(INITIAL_MARKDOWN);
  const [previewing, setPreviewing] = useState(false);
  const html = markdownToHtml(source);
  const htmlDocument = `<!doctype html>\n<html lang="zh-CN"><meta charset="utf-8"><body>${html}</body></html>`;
  return <div className="text-tool-stack">
    <div className="editor-tabs" role="group" aria-label="编辑器视图"><button type="button" aria-pressed={!previewing} onClick={() => setPreviewing(false)}>编辑源文</button><button type="button" aria-pressed={previewing} onClick={() => setPreviewing(true)}>查看预览</button></div>
    {previewing ? <div className="markdown-preview" role="region" aria-label="Markdown 预览" dangerouslySetInnerHTML={{ __html: html }} /> : <label className="text-area-field">Markdown 源文<textarea aria-label="Markdown 源文" value={source} onChange={(event) => setSource(event.target.value)} /></label>}
    <div className="download-pair"><ResultPanel text={source} copyLabel="复制 Markdown" download={download(source, 'document.md', 'text/markdown;charset=utf-8', '下载 Markdown')} /><ResultPanel text={html} copyLabel="复制 HTML" download={download(htmlDocument, 'document.html', 'text/html;charset=utf-8', '下载 HTML')} /></div>
  </div>;
}

function FontExplorer() {
  const [font, setFont] = useState<FontInspection | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleFiles = async (files: File[]) => {
    if (!files[0]) return;
    setLoading(true); setError(''); setFont(null);
    try { setFont(inspectFont(await files[0].arrayBuffer())); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '字体文件无效或已损坏'); }
    finally { setLoading(false); }
  };
  return <div className="text-tool-stack">
    <FileDropzone accepted={['.ttf', '.otf', 'font/ttf', 'font/otf', 'application/font-sfnt']} maxSizeBytes={20 * 1024 * 1024} multiple={false} onFiles={handleFiles} />
    <p className="format-limit">仅读取你在此处选择的 TTF 或 OTF 文件，不会扫描设备中的其他字体。</p>
    {loading && <StatusMessage status="loading" message="正在解析字体" />}{error && <StatusMessage status="error" message={error} />}
    {font && <ResultPanel onReset={() => setFont(null)}><dl className="stats-grid"><div><dt>字体家族</dt><dd>{font.family}</dd></div><div><dt>样式</dt><dd>{font.style}</dd></div><div><dt>每 em 单位</dt><dd>{font.unitsPerEm}</dd></div><div><dt>字形数量</dt><dd>{font.glyphCount}</dd></div>{font.names.fullName && <div><dt>完整名称</dt><dd>{font.names.fullName}</dd></div>}{font.names.postScriptName && <div><dt>PostScript 名称</dt><dd>{font.names.postScriptName}</dd></div>}</dl></ResultPanel>}
  </div>;
}

function GlyphBrowser() {
  const [block, setBlock] = useState('cjk');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const characters = searchUnicode(query, block, 120);
  const copyCharacter = async (character: string, label: string) => {
    try { await copyText(character); setMessage(`已复制 ${label}`); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : '复制失败，请重试'); }
  };
  return <div className="text-tool-stack">
    <div className="text-controls text-controls--two"><label>Unicode 区段<select aria-label="Unicode 区段" value={block} onChange={(event) => setBlock(event.target.value)}>{UNICODE_BLOCKS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>搜索字符或码点<input aria-label="搜索字符或码点" placeholder="例如：中、U+4E2D" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
    <p className="format-limit">每次最多显示 120 个字符；输入字符或 U+ 码点可精确查找。</p>
    {message && <StatusMessage status={message.startsWith('已复制') ? 'success' : 'error'} message={message} />}
    <div className="glyph-grid" aria-label="Unicode 字符结果">{characters.map((item) => <button className="glyph-card" type="button" key={item.codePoint} aria-label={`复制 ${item.character} ${item.label}`} onClick={() => copyCharacter(item.character, item.label)}><span>{item.character}</span><small>{item.label}</small></button>)}</div>
    {!characters.length && <StatusMessage status="error" message="没有找到匹配的 Unicode 字符" />}
  </div>;
}

function LargeType() {
  const [text, setText] = useState('让重要文字清晰可见');
  const [size, setSize] = useState(72);
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');
  return <div className="text-tool-stack"><div className="text-controls text-controls--two"><label>展示文字<input aria-label="展示文字" value={text} onChange={(event) => setText(event.target.value)} /></label><label>字号<input aria-label="字号" type="number" min="24" max="240" value={size} onChange={(event) => setSize(Math.min(240, Math.max(24, Number(event.target.value) || 24)))} /></label></div><label>对齐方式<select aria-label="对齐方式" value={align} onChange={(event) => setAlign(event.target.value as typeof align)}><option value="left">左对齐</option><option value="center">居中</option><option value="right">右对齐</option></select></label><ResultPanel text={text}><div className="large-type-preview" aria-label="大字预览" style={{ maxWidth: '100%', fontSize: `clamp(2rem, 12vw, ${size}px)`, textAlign: align }}>{text || '请输入要展示的文字'}</div></ResultPanel></div>;
}

function LineHeightCalculator() {
  const [size, setSize] = useState(16);
  const [ratio, setRatio] = useState(1.5);
  let result: ReturnType<typeof calculateLineHeight> | undefined;
  let error = '';
  try { result = calculateLineHeight(size, ratio); } catch (reason) { error = reason instanceof Error ? reason.message : '输入无效'; }
  return <div className="text-tool-stack"><div className="text-controls text-controls--two"><label>字号（px）<input aria-label="字号（px）" type="number" value={size} onChange={(event) => setSize(Number(event.target.value))} /></label><label>行高比例<input aria-label="行高比例" type="number" step="0.05" value={ratio} onChange={(event) => setRatio(Number(event.target.value))} /></label></div>{result ? <ResultPanel text={`${result.pixels}px / ${result.unitless}`}><p className="calculation-result">建议行高：<strong>{result.pixels}px</strong>，无单位值 <strong>{result.unitless}</strong></p></ResultPanel> : <StatusMessage status="error" message={error} />}</div>;
}

function PaperSizes() {
  const [paper, setPaper] = useState('a4');
  const [unit, setUnit] = useState<PaperUnit>('mm');
  const result = convertPaperDimensions(paper, unit);
  const selected = PAPER_SIZES.find((item) => item.id === paper)!;
  return <div className="text-tool-stack"><div className="text-controls text-controls--two"><label>纸张规格<select aria-label="纸张规格" value={paper} onChange={(event) => setPaper(event.target.value)}>{PAPER_SIZES.map((item) => <option key={item.id} value={item.id}>{item.group} · {item.name}</option>)}</select></label><label>显示单位<select aria-label="显示单位" value={unit} onChange={(event) => setUnit(event.target.value as PaperUnit)}><option value="mm">毫米</option><option value="cm">厘米</option><option value="in">英寸</option><option value="px">像素（96 DPI）</option></select></label></div><ResultPanel text={`${selected.name}: ${result.width} × ${result.height} ${unit}`}><p className="calculation-result"><strong>{selected.name}</strong>：{result.width} × {result.height} {unit}</p></ResultPanel></div>;
}

function PxRemCalculator() {
  const [value, setValue] = useState(16);
  const [root, setRoot] = useState(16);
  const [direction, setDirection] = useState<'px-rem' | 'rem-px'>('px-rem');
  let result: number | undefined;
  let error = '';
  try { result = direction === 'px-rem' ? pxToRem(value, root) : remToPx(value, root); } catch (reason) { error = reason instanceof Error ? reason.message : '输入无效'; }
  const suffix = direction === 'px-rem' ? 'rem' : 'px';
  return <div className="text-tool-stack"><div className="text-controls text-controls--three"><label>{direction === 'px-rem' ? '像素值' : 'REM 值'}<input aria-label="像素值" type="number" value={value} onChange={(event) => setValue(Number(event.target.value))} /></label><label>根字号<input aria-label="根字号" type="number" value={root} onChange={(event) => setRoot(Number(event.target.value))} /></label><label>换算方向<select aria-label="换算方向" value={direction} onChange={(event) => setDirection(event.target.value as typeof direction)}><option value="px-rem">PX → REM</option><option value="rem-px">REM → PX</option></select></label></div>{result === undefined ? <StatusMessage status="error" message={error} /> : <ResultPanel text={`${result}${suffix}`}><p className="calculation-result"><strong>{Number(result.toFixed(6))}{suffix}</strong></p></ResultPanel>}</div>;
}

function TextDiff() {
  const [before, setBefore] = useState('文字工具让工作更轻松。');
  const [after, setAfter] = useState('本地文字工具让工作更轻松！');
  const segments = diffText(before, after);
  const additions = segments.filter((item) => item.type === 'add').reduce((sum, item) => sum + Array.from(item.text).length, 0);
  const deletions = segments.filter((item) => item.type === 'delete').reduce((sum, item) => sum + Array.from(item.text).length, 0);
  const summary = segments.filter((item) => item.type !== 'equal').map((item) => `${item.type === 'add' ? '新增' : '删除'}：${item.text}`).join('\n') || '两段文本完全相同';
  return <div className="text-tool-stack"><div className="diff-inputs"><label className="text-area-field">原始文本<textarea aria-label="原始文本" value={before} onChange={(event) => setBefore(event.target.value)} /></label><label className="text-area-field">修改后文本<textarea aria-label="修改后文本" value={after} onChange={(event) => setAfter(event.target.value)} /></label></div><ResultPanel text={summary}><p>新增 {additions} 个字符，删除 {deletions} 个字符</p><div className="diff-visual" aria-label="可视化文本差异">{segments.map((item, index) => item.type === 'add' ? <ins key={index} aria-label="新增内容">{item.text}</ins> : item.type === 'delete' ? <del key={index} aria-label="删除内容">{item.text}</del> : <span key={index}>{item.text}</span>)}</div><pre aria-label="文本差异结果">{summary}</pre></ResultPanel></div>;
}

const UNITS: readonly TypographyUnit[] = ['px', 'rem', 'pt', 'pc', 'in', 'mm', 'cm'];
function TypographyCalculator() {
  const [value, setValue] = useState(16);
  const [from, setFrom] = useState<TypographyUnit>('px');
  const [to, setTo] = useState<TypographyUnit>('pt');
  const [root, setRoot] = useState(16);
  let result: number | undefined;
  let error = '';
  try { result = convertTypographyUnit(value, from, to, root); } catch (reason) { error = reason instanceof Error ? reason.message : '输入无效'; }
  return <div className="text-tool-stack"><div className="text-controls text-controls--two"><label>输入数值<input aria-label="输入数值" type="number" value={value} onChange={(event) => setValue(Number(event.target.value))} /></label><label>根字号<input aria-label="根字号" type="number" value={root} onChange={(event) => setRoot(Number(event.target.value))} /></label><label>原始单位<select aria-label="原始单位" value={from} onChange={(event) => setFrom(event.target.value as TypographyUnit)}>{UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select></label><label>目标单位<select aria-label="目标单位" value={to} onChange={(event) => setTo(event.target.value as TypographyUnit)}>{UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select></label></div>{result === undefined ? <StatusMessage status="error" message={error} /> : <ResultPanel text={`${Number(result.toFixed(6))}${to}`}><p className="calculation-result"><strong>{Number(result.toFixed(6))} {to}</strong></p></ResultPanel>}</div>;
}

function WordCounter() {
  const [text, setText] = useState('你好 world\n\n这是一段用于统计的示例文字。');
  const result = countText(text);
  return <div className="text-tool-stack"><label className="text-area-field">待统计文本<textarea aria-label="待统计文本" value={text} onChange={(event) => setText(event.target.value)} /></label><ResultPanel text={`字词 ${result.words}；字符 ${result.characters}；不含空格 ${result.charactersNoSpaces}；行 ${result.lines}；段落 ${result.paragraphs}；阅读 ${result.readingMinutes} 分钟`}><dl className="stats-grid"><div><dt>字词</dt><dd>{result.words}</dd></div><div><dt>字符</dt><dd>{result.characters}</dd></div><div><dt>不含空格</dt><dd>{result.charactersNoSpaces}</dd></div><div><dt>行数</dt><dd>{result.lines}</dd></div><div><dt>段落</dt><dd>{result.paragraphs}</dd></div><div><dt>预计阅读</dt><dd>{result.readingMinutes} 分钟</dd></div></dl></ResultPanel></div>;
}

function ToolContent({ toolId }: { toolId: ToolId }) {
  if (toolId === 'doc-converter') return <DocumentConverter />;
  if (toolId === 'text-editor') return <MarkdownEditor />;
  if (toolId === 'font-explorer') return <FontExplorer />;
  if (toolId === 'glyph-browser') return <GlyphBrowser />;
  if (toolId === 'large-type') return <LargeType />;
  if (toolId === 'line-height-calc') return <LineHeightCalculator />;
  if (toolId === 'paper-sizes') return <PaperSizes />;
  if (toolId === 'px-to-rem') return <PxRemCalculator />;
  if (toolId === 'text-diff') return <TextDiff />;
  if (toolId === 'typo-calc') return <TypographyCalculator />;
  return <WordCounter />;
}

export function TextWorkspace({ tool }: TextWorkspaceProps) {
  return <ToolLayout tool={tool} localNote="文字、文档和所选字体文件只在你的设备本地处理，不会上传任何内容。"><div className="text-workspace" aria-label={`${tool.title} 工作区`}><ToolContent toolId={tool.id} /></div></ToolLayout>;
}
