import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';

import { FileDropzone } from '../components/FileDropzone';
import { ResultPanel } from '../components/ResultPanel';
import { CURATED_PALETTES } from '../data/palettes';
import {
  contrastRatio,
  convertColor,
  extractPalette,
  generateGradientCss,
  generateHarmony,
  generatePalette,
  generateTailwindScale,
  parseColor,
  samplePixel,
  simulateColorVision,
  wcagGrade,
  type GradientMode,
  type HarmonyScheme,
  type ImagePixels,
  type VisionMode,
} from '../engines/color';
import type { ToolDefinition, ToolId } from '../core/types';

type ColorWorkspaceProps = { tool: ToolDefinition };
type ImageState = { pixels: ImagePixels; message: string } | null;

const COLOR_TOOL_IDS: readonly ToolId[] = [
  'colorblind-sim', 'colour-converter', 'contrast-checker', 'gradient-genny', 'harmony-genny',
  'palette-collection', 'palette-extractor', 'palette-genny', 'pixel-picker', 'tailwind-shades',
];

export function isColorToolId(toolId: ToolId): boolean {
  return COLOR_TOOL_IDS.includes(toolId);
}

function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  let nativeValue = '#000000';
  try { nativeValue = parseColor(value).hex; } catch { /* text input presents validation state */ }
  return (
    <label className="color-control">
      <span>{label}</span>
      <input aria-label={label} type="text" value={value} onChange={(event) => onChange(event.target.value)} />
      <input aria-label={`${label} 色板`} type="color" value={nativeValue} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ColorList({ colors }: { colors: readonly string[] }) {
  return (
    <div className="color-list" aria-label="生成颜色">
      {colors.map((color) => (
        <ResultPanel key={color} text={color}>
          <div className="color-chip" style={{ backgroundColor: color }} aria-hidden="true" />
          <code>{color}</code>
        </ResultPanel>
      ))}
    </div>
  );
}

async function readLocalImage(file: File): Promise<ImagePixels> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('图片读取失败，请选择有效的图片文件'));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('图片为空，无法取色');
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('浏览器不支持本地图片取色');
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    return { width: canvas.width, height: canvas.height, data };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ImageColorTool({ mode }: { mode: 'extractor' | 'picker' }) {
  const [image, setImage] = useState<ImageState>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFiles = async (files: File[]) => {
    setError('');
    setImage(null);
    if (files.length === 0) {
      setError('请选择一张图片');
      return;
    }
    setLoading(true);
    try {
      const pixels = await readLocalImage(files[0]);
      setImage({ pixels, message: `已在本地读取图片：${pixels.width} × ${pixels.height}` });
      setCoordinates({ x: 0, y: 0 });
    } catch {
      setError('图片读取失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!image || mode !== 'picker' || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    canvasRef.current.width = image.pixels.width;
    canvasRef.current.height = image.pixels.height;
    context.putImageData(new ImageData(new Uint8ClampedArray(image.pixels.data), image.pixels.width, image.pixels.height), 0, 0);
  }, [image, mode]);

  const moveCoordinate = (direction: string) => {
    if (!image) return;
    setCoordinates((current) => ({
      x: Math.min(image.pixels.width - 1, Math.max(0, current.x + (direction === 'ArrowRight' ? 1 : direction === 'ArrowLeft' ? -1 : 0))),
      y: Math.min(image.pixels.height - 1, Math.max(0, current.y + (direction === 'ArrowDown' ? 1 : direction === 'ArrowUp' ? -1 : 0))),
    }));
  };

  const handleCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setCoordinates({
      x: Math.min(image.pixels.width - 1, Math.max(0, Math.floor((event.clientX - bounds.left) * image.pixels.width / bounds.width))),
      y: Math.min(image.pixels.height - 1, Math.max(0, Math.floor((event.clientY - bounds.top) * image.pixels.height / bounds.height))),
    });
  };

  const handleCanvasKeys = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    moveCoordinate(event.key);
  };

  const adjustCoordinate = (axis: 'x' | 'y', event: ChangeEvent<HTMLInputElement>) => {
    if (!image) return;
    const maximum = axis === 'x' ? image.pixels.width - 1 : image.pixels.height - 1;
    setCoordinates((current) => ({ ...current, [axis]: Math.min(maximum, Math.max(0, Number(event.target.value) || 0)) }));
  };

  const extracted = image ? extractPalette(image.pixels, 6) : [];
  const sampled = image ? samplePixel(image.pixels, coordinates.x, coordinates.y) : null;
  return (
    <div className="color-workspace__section">
      <FileDropzone accepted={['image/*']} multiple={false} onFiles={handleFiles} />
      {error && <p className="color-error" role="alert">{error}</p>}
      {loading && <p role="status">正在读取图片</p>}
      {image && <p role="status">{image.message}</p>}
      {mode === 'extractor' && image && <ColorList colors={extracted} />}
      {mode === 'picker' && image && (
        <>
          <canvas ref={canvasRef} className="pixel-picker__canvas" aria-label="图片像素取色区域" tabIndex={0} onClick={handleCanvasClick} onKeyDown={handleCanvasKeys} />
          <div className="coordinate-controls">
            <label>坐标 X<input aria-label="坐标 X" type="number" min="0" max={image.pixels.width - 1} value={coordinates.x} onChange={(event) => adjustCoordinate('x', event)} /></label>
            <label>坐标 Y<input aria-label="坐标 Y" type="number" min="0" max={image.pixels.height - 1} value={coordinates.y} onChange={(event) => adjustCoordinate('y', event)} /></label>
          </div>
          {sampled && <ResultPanel text={sampled.hex}><p>像素 ({coordinates.x}, {coordinates.y})：<code>{sampled.hex}</code> / rgb({sampled.r}, {sampled.g}, {sampled.b})</p></ResultPanel>}
        </>
      )}
    </div>
  );
}

function Converter() {
  const [value, setValue] = useState('#3b82f6');
  try {
    const result = convertColor(value);
    return <><ColorControl label="输入颜色" value={value} onChange={setValue} /><ResultPanel text={`${result.hex}\n${result.rgb}\n${result.hsl}`}><dl className="conversion-result"><dt>HEX</dt><dd>{result.hex}</dd><dt>RGB</dt><dd>{result.rgb}</dd><dt>HSL</dt><dd>{result.hsl}</dd></dl></ResultPanel></>;
  } catch (reason) {
    return <><ColorControl label="输入颜色" value={value} onChange={setValue} /><p className="color-error" role="alert">{reason instanceof Error ? reason.message : '颜色输入有误'}</p></>;
  }
}

function Contrast() {
  const [foreground, setForeground] = useState('#1d4ed8');
  const [background, setBackground] = useState('#ffffff');
  try {
    const ratio = contrastRatio(foreground, background);
    const grade = wcagGrade(ratio);
    return <><div className="color-controls"><ColorControl label="前景色" value={foreground} onChange={setForeground} /><ColorControl label="背景色" value={background} onChange={setBackground} /></div><ResultPanel text={`对比度 ${ratio.toFixed(2)}:1`}><div className="contrast-preview" style={{ backgroundColor: background, color: foreground }}>可读性预览 Aa</div><p>对比度：<strong>{ratio.toFixed(2)}:1</strong></p><p>普通文字：{grade.normal}；大号文字：{grade.large}</p></ResultPanel></>;
  } catch (reason) { return <p className="color-error" role="alert">{reason instanceof Error ? reason.message : '颜色输入有误'}</p>; }
}

function Colorblind() {
  const [base, setBase] = useState('#ef4444');
  const [mode, setMode] = useState<VisionMode>('protanopia');
  try {
    const original = parseColor(base);
    const simulated = simulateColorVision(original, mode);
    const result = `#${simulated.r.toString(16).padStart(2, '0')}${simulated.g.toString(16).padStart(2, '0')}${simulated.b.toString(16).padStart(2, '0')}`;
    return <><ColorControl label="基准颜色" value={base} onChange={setBase} /><label>模拟模式<select aria-label="模拟模式" value={mode} onChange={(event) => setMode(event.target.value as VisionMode)}><option value="protanopia">红色盲</option><option value="deuteranopia">绿色盲</option><option value="tritanopia">蓝色盲</option><option value="achromatopsia">全色盲</option></select></label><ResultPanel text={result}><div className="vision-pair"><span style={{ backgroundColor: original.hex }}>原始 {original.hex}</span><span style={{ backgroundColor: result }}>模拟 {result}</span></div></ResultPanel></>;
  } catch (reason) { return <p className="color-error" role="alert">{reason instanceof Error ? reason.message : '颜色输入有误'}</p>; }
}

function Gradient() {
  const [first, setFirst] = useState('#6366f1');
  const [second, setSecond] = useState('#ec4899');
  const [mode, setMode] = useState<GradientMode>('linear');
  try {
    const css = generateGradientCss([first, second], mode);
    return <><div className="color-controls"><ColorControl label="起始颜色" value={first} onChange={setFirst} /><ColorControl label="结束颜色" value={second} onChange={setSecond} /></div><label>渐变类型<select aria-label="渐变类型" value={mode} onChange={(event) => setMode(event.target.value as GradientMode)}><option value="linear">线性</option><option value="radial">径向</option><option value="corner">角落径向</option><option value="mesh">网格感</option></select></label><ResultPanel text={`background: ${css};`}><div className="gradient-preview" style={{ background: css }} /><code>background: {css};</code></ResultPanel></>;
  } catch (reason) { return <p className="color-error" role="alert">{reason instanceof Error ? reason.message : '渐变参数有误'}</p>; }
}

function Harmony() {
  const [base, setBase] = useState('#8b5cf6');
  const [scheme, setScheme] = useState<HarmonyScheme>('triadic');
  try { return <><ColorControl label="基准颜色" value={base} onChange={setBase} /><label>配色方案<select aria-label="配色方案" value={scheme} onChange={(event) => setScheme(event.target.value as HarmonyScheme)}><option value="complementary">互补色</option><option value="analogous">类似色</option><option value="triadic">三角色</option><option value="split-complementary">分裂互补色</option></select></label><ColorList colors={generateHarmony(base, scheme)} /></>; } catch (reason) { return <p className="color-error" role="alert">{reason instanceof Error ? reason.message : '颜色输入有误'}</p>; }
}

function loadFavorites(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem('delphitools-palette-favorites') ?? '[]');
    return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [];
  } catch {
    return [];
  }
}

function PaletteCollection() {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const toggleFavorite = (id: string) => setFavorites((current) => {
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    window.localStorage.setItem('delphitools-palette-favorites', JSON.stringify(next));
    return next;
  });
  return <div className="palette-collection">{CURATED_PALETTES.map((palette) => <ResultPanel key={palette.id} text={palette.colors.join(', ')}><div className="palette-heading"><strong>{palette.name}</strong><button type="button" onClick={() => toggleFavorite(palette.id)}>{favorites.includes(palette.id) ? '取消收藏' : '收藏调色板'}</button></div><div className="palette-stripe">{palette.colors.map((color) => <span key={color} title={color} style={{ backgroundColor: color }}>{color}</span>)}</div></ResultPanel>)}</div>;
}

function PaletteGenerator() {
  const [seed, setSeed] = useState('ocean');
  const [count, setCount] = useState(5);
  return <><label>生成种子<input aria-label="生成种子" value={seed} onChange={(event) => setSeed(event.target.value)} /></label><label>颜色数量<input aria-label="颜色数量" type="number" min="2" max="12" value={count} onChange={(event) => setCount(Number(event.target.value) || 2)} /></label><ColorList colors={generatePalette(seed, count)} /></>;
}

function Tailwind() {
  const [base, setBase] = useState('#3b82f6');
  try { return <><ColorControl label="基准颜色" value={base} onChange={setBase} /><div className="tailwind-scale">{Object.entries(generateTailwindScale(base)).map(([step, color]) => <ResultPanel key={step} text={color}><span className="color-chip" style={{ backgroundColor: color }} /><code>{step} · {color}</code></ResultPanel>)}</div></>; } catch (reason) { return <p className="color-error" role="alert">{reason instanceof Error ? reason.message : '颜色输入有误'}</p>; }
}

function ToolContent({ toolId }: { toolId: ToolId }) {
  if (toolId === 'colour-converter') return <Converter />;
  if (toolId === 'contrast-checker') return <Contrast />;
  if (toolId === 'colorblind-sim') return <Colorblind />;
  if (toolId === 'gradient-genny') return <Gradient />;
  if (toolId === 'harmony-genny') return <Harmony />;
  if (toolId === 'palette-collection') return <PaletteCollection />;
  if (toolId === 'palette-extractor') return <ImageColorTool mode="extractor" />;
  if (toolId === 'pixel-picker') return <ImageColorTool mode="picker" />;
  if (toolId === 'palette-genny') return <PaletteGenerator />;
  return <Tailwind />;
}

export function ColorWorkspace({ tool }: ColorWorkspaceProps) {
  return (
    <section className="tool-page page-wrap">
      <a className="back-link" href="/">← 返回工具目录</a>
      <p className="page-kicker">{tool.englishTitle}</p>
      <h1>{tool.title}</h1>
      <p className="page-lede">{tool.description}</p>
      <p className="local-note">颜色与图片仅在你的设备本地处理，不会上传任何内容。</p>
      <div className="color-workspace" aria-label={`${tool.title} 工作区`}><ToolContent toolId={tool.id} /></div>
    </section>
  );
}
