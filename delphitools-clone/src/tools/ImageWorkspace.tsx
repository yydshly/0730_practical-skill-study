import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';

import { FileDropzone } from '../components/FileDropzone';
import { ResultPanel } from '../components/ResultPanel';
import { StatusMessage, type StatusKind } from '../components/StatusMessage';
import { readFileAsDataUrl, loadImage } from '../core/files';
import type { ToolDefinition, ToolId } from '../core/types';
import {
  createPlaceholderSvg,
  decodeImageBase64,
  faviconSizes,
  fitMatte,
  getImageFormatCapabilities,
  seamlessSlices,
  socialCropRect,
  splitGrid,
  stitchLayout,
  transparentBounds,
  watermarkLayout,
  type FitMode,
  type ImageFormatCapability,
  type Rect,
  type StitchDirection,
} from '../engines/image';

type ImageWorkspaceProps = { tool: ToolDefinition };
type JobStatus = { kind: StatusKind; message: string };
type LocalImage = { file: File; image: HTMLImageElement; preview: string; width: number; height: number };
type ImageOutput = { blob: Blob; name: string; label: string };

const ImageValidationContext = createContext<(message: string) => void>(() => undefined);

const IMAGE_TOOL_IDS: readonly ToolId[] = [
  'matte-generator', 'scroll-generator', 'social-cropper', 'watermarker', 'artwork-enhancer',
  'favicon-genny', 'image-clipper', 'image-converter', 'image-splitter', 'image-stitcher',
  'paste-image', 'placeholder-genny', 'base64-image-encoder',
];

const SOCIAL_PRESETS = {
  square: { label: '方形帖子', ratio: '1:1' },
  portrait: { label: '竖版帖子', ratio: '4:5' },
  story: { label: '竖屏故事', ratio: '9:16' },
  landscape: { label: '横版帖子', ratio: '16:9' },
  bluesky: { label: 'Bluesky 横图', ratio: '2:1' },
  custom: { label: '自定义比例', ratio: '4:5' },
} as const;

export function isImageToolId(toolId: ToolId): boolean {
  return IMAGE_TOOL_IDS.includes(toolId);
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : '图片处理失败，请重试';
}

async function readLocalImage(file: File): Promise<LocalImage> {
  const [image, preview] = await Promise.all([loadImage(file), readFileAsDataUrl(file)]);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height) throw new Error('图片尺寸无效，请选择完整的图片文件');
  return { file, image, preview, width, height };
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) throw new Error('输出图片尺寸无效');
  if (width > 16384 || height > 16384 || width * height > 80_000_000) throw new Error('输出图片过大，请缩小尺寸后重试');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context2d(canvas: HTMLCanvasElement, readFrequently = false): CanvasRenderingContext2D {
  const context = canvas.getContext('2d', readFrequently ? { willReadFrequently: true } : undefined);
  if (!context) throw new Error('当前浏览器无法创建 Canvas 处理环境');
  return context;
}

function canvasBlob(canvas: HTMLCanvasElement, mime = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob || blob.type !== mime) {
          reject(new Error(`当前浏览器无法真实编码 ${mime}，未生成伪格式文件`));
          return;
        }
        resolve(blob);
      }, mime, quality);
    } catch (reason) {
      reject(new Error(`图片编码失败：${errorMessage(reason)}`));
    }
  });
}

function drawRect(context: CanvasRenderingContext2D, image: CanvasImageSource, source: Rect, destination: Rect): void {
  context.drawImage(image, source.x, source.y, source.width, source.height, destination.x, destination.y, destination.width, destination.height);
}

function useObjectUrl(blob?: Blob): string {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob) {
      setUrl('');
      return;
    }
    if (typeof URL.createObjectURL !== 'function') {
      setUrl('');
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL?.(next);
  }, [blob]);
  return url;
}

function OutputPreview({ output, reset }: { output: ImageOutput; reset?: () => void }) {
  const url = useObjectUrl(output.blob);
  return (
    <ResultPanel download={{ blob: output.blob, name: output.name, label: `下载${output.label}` }} onReset={reset}>
      <figure className="image-result-card">
        {url && <img src={url} alt={`${output.label}预览`} />}
        <figcaption>{output.label} · {Math.max(1, Math.round(output.blob.size / 1024))} KB</figcaption>
      </figure>
    </ResultPanel>
  );
}

function OutputGallery({ outputs, reset }: { outputs: ImageOutput[]; reset: () => void }) {
  if (outputs.length === 0) return null;
  return (
    <section className="image-output-gallery" aria-label="图片处理结果">
      <div className="image-output-gallery__heading">
        <h2>处理结果</h2>
        <button type="button" onClick={reset}>重新开始</button>
      </div>
      <div className="image-output-grid">{outputs.map((output) => <OutputPreview key={output.name} output={output} />)}</div>
    </section>
  );
}

function SourcePreview({ images }: { images: LocalImage[] }) {
  if (images.length === 0) return null;
  return (
    <section className="image-source-preview" aria-label="原图预览">
      <h2>原图预览</h2>
      <div className="image-source-grid">{images.map((image) => <figure key={`${image.file.name}-${image.file.lastModified}`}><img src={image.preview} alt={`${image.file.name} 原图`} /><figcaption>{image.file.name} · {image.width} × {image.height}</figcaption></figure>)}</div>
    </section>
  );
}

function useImageJob(multiple = false) {
  const [images, setImages] = useState<LocalImage[]>([]);
  const [outputs, setOutputs] = useState<ImageOutput[]>([]);
  const [status, setStatus] = useState<JobStatus>({ kind: 'idle', message: '请选择图片并设置处理参数' });

  const clearResult = () => setOutputs([]);
  const rejectFiles = (message: string) => {
    setOutputs([]);
    setStatus({ kind: 'idle', message: `结果已清除：${message}` });
  };
  const reset = () => {
    setImages([]);
    setOutputs([]);
    setStatus({ kind: 'idle', message: '已重置，请重新选择图片' });
  };

  const acceptFiles = async (files: File[]) => {
    clearResult();
    setImages([]);
    if (files.length === 0) {
      setStatus({ kind: 'error', message: '请选择至少一张图片' });
      return;
    }
    setStatus({ kind: 'loading', message: '正在本地解码图片' });
    try {
      const loaded = await Promise.all((multiple ? files : files.slice(0, 1)).map(readLocalImage));
      setImages(loaded);
      setStatus({ kind: 'success', message: `已读取 ${loaded.length} 张图片，可开始处理` });
    } catch (reason) {
      setImages([]);
      setOutputs([]);
      setStatus({ kind: 'error', message: errorMessage(reason) });
    }
  };

  const run = async (work: (loaded: LocalImage[]) => Promise<ImageOutput[]>) => {
    clearResult();
    if (images.length === 0) {
      setStatus({ kind: 'error', message: '请先选择图片' });
      return;
    }
    setStatus({ kind: 'loading', message: '正在本地处理图片' });
    try {
      const next = await work(images);
      if (next.length === 0) throw new Error('没有生成可下载的图片结果');
      setOutputs(next);
      setStatus({ kind: 'success', message: `处理完成，共生成 ${next.length} 个文件` });
    } catch (reason) {
      setOutputs([]);
      setStatus({ kind: 'error', message: errorMessage(reason) });
    }
  };

  return { images, outputs, status, acceptFiles, rejectFiles, run, reset, setStatus, setOutputs, setImages };
}

function WorkspaceFrame({ children, status, images, outputs, reset, rejectFiles }: { children: ReactNode; status: JobStatus; images: LocalImage[]; outputs: ImageOutput[]; reset: () => void; rejectFiles: (message: string) => void }) {
  return <ImageValidationContext.Provider value={rejectFiles}><div className="image-workspace__body">{children}<StatusMessage status={status.kind} message={status.message} /><SourcePreview images={images} /><OutputGallery outputs={outputs} reset={reset} /></div></ImageValidationContext.Provider>;
}

function Dropzone({ onFiles, multiple = false }: { onFiles: (files: File[]) => void; multiple?: boolean }) {
  const onError = useContext(ImageValidationContext);
  return <FileDropzone accepted={['image/*']} multiple={multiple} onFiles={onFiles} onError={onError} />;
}

function MatteTool() {
  const job = useImageJob();
  const [size, setSize] = useState(1080);
  const [background, setBackground] = useState('#ffffff');
  const [mode, setMode] = useState<FitMode>('contain');
  const process = () => job.run(async ([asset]) => {
    const canvas = makeCanvas(size, size);
    const context = context2d(canvas);
    context.fillStyle = background;
    context.fillRect(0, 0, size, size);
    const layout = fitMatte(asset.width, asset.height, size, size, mode);
    drawRect(context, asset.image, layout.source, layout.destination);
    return [{ blob: await canvasBlob(canvas), name: '方形衬底.png', label: '方形衬底 PNG' }];
  });
  return <WorkspaceFrame {...job}><Dropzone onFiles={job.acceptFiles} /><div className="image-controls"><label>画布尺寸<input aria-label="画布尺寸" type="number" min="64" max="4096" value={size} onChange={(event) => setSize(Number(event.target.value))} /></label><label>背景颜色<input aria-label="背景颜色" type="color" value={background} onChange={(event) => setBackground(event.target.value)} /></label><label>缩放方式<select aria-label="缩放方式" value={mode} onChange={(event) => setMode(event.target.value as FitMode)}><option value="contain">完整显示并留白</option><option value="cover">居中裁剪并铺满</option></select></label><button type="button" onClick={process}>生成方形衬底</button></div></WorkspaceFrame>;
}

function ScrollTool() {
  const job = useImageJob();
  const [height, setHeight] = useState(1080);
  const process = () => job.run(async ([asset]) => Promise.all(seamlessSlices(asset.width, asset.height, height).map(async (region, index) => {
    const canvas = makeCanvas(region.width, region.height);
    context2d(canvas).drawImage(asset.image, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
    return { blob: await canvasBlob(canvas), name: `轮播-${index + 1}.png`, label: `轮播第 ${index + 1} 片` };
  })));
  return <WorkspaceFrame {...job}><Dropzone onFiles={job.acceptFiles} /><div className="image-controls"><label>单片高度<input aria-label="单片高度" type="number" min="100" max="4096" value={height} onChange={(event) => setHeight(Number(event.target.value))} /></label><button type="button" onClick={process}>拆分长图</button></div><p className="image-help">最后一片会保留剩余高度，不拉伸也不丢失像素。多文件结果可逐个下载。</p></WorkspaceFrame>;
}

function SocialCropTool() {
  const job = useImageJob();
  const [preset, setPreset] = useState<keyof typeof SOCIAL_PRESETS>('portrait');
  const [custom, setCustom] = useState('4:5');
  const selected = SOCIAL_PRESETS[preset];
  const ratio = preset === 'custom' ? custom : selected.ratio;
  const process = () => job.run(async ([asset]) => {
    const region = socialCropRect(asset.width, asset.height, ratio);
    const canvas = makeCanvas(region.width, region.height);
    context2d(canvas).drawImage(asset.image, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
    return [{ blob: await canvasBlob(canvas), name: `社交裁剪-${ratio.replace(':', 'x')}.png`, label: `${selected.label} · ${ratio}` }];
  });
  return <WorkspaceFrame {...job}><Dropzone onFiles={job.acceptFiles} /><div className="image-controls"><label>裁剪场景<select aria-label="裁剪场景" value={preset} onChange={(event) => setPreset(event.target.value as keyof typeof SOCIAL_PRESETS)}>{Object.entries(SOCIAL_PRESETS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>{preset === 'custom' && <label>自定义比例<input aria-label="自定义比例" value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="例如 3:2" /></label>}<p className="image-ratio-label">{selected.label} · {ratio}</p><button type="button" onClick={process}>按比例裁剪</button></div></WorkspaceFrame>;
}

function WatermarkTool() {
  const job = useImageJob();
  const [type, setType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('版权所有');
  const [watermark, setWatermark] = useState<LocalImage | null>(null);
  const [mode, setMode] = useState<'single' | 'tile'>('single');
  const [opacity, setOpacity] = useState(0.4);
  const [rotation, setRotation] = useState(-20);
  const [margin, setMargin] = useState(24);

  const loadWatermark = async (event: ChangeEvent<HTMLInputElement>) => {
    setWatermark(null);
    const file = event.target.files?.[0];
    if (!file) return;
    try { setWatermark(await readLocalImage(file)); }
    catch (reason) { job.setStatus({ kind: 'error', message: errorMessage(reason) }); }
  };
  const process = () => job.run(async ([asset]) => {
    const canvas = makeCanvas(asset.width, asset.height);
    const context = context2d(canvas);
    context.drawImage(asset.image, 0, 0);
    const fontSize = Math.max(18, Math.round(Math.min(asset.width, asset.height) / 18));
    context.font = `700 ${fontSize}px system-ui`;
    const markWidth = type === 'text' ? Math.max(1, Math.ceil(context.measureText(text || '水印').width)) : watermark?.width ?? 0;
    const markHeight = type === 'text' ? Math.ceil(fontSize * 1.3) : watermark?.height ?? 0;
    if (type === 'image' && !watermark) throw new Error('请先选择水印图片');
    const scale = Math.min(1, asset.width / 3 / markWidth, asset.height / 3 / markHeight);
    const width = Math.max(1, Math.round(markWidth * scale));
    const height = Math.max(1, Math.round(markHeight * scale));
    const placements = watermarkLayout(asset.width, asset.height, width, height, { mode, margin, gap: Math.max(24, margin), opacity, rotation, position: 'bottom-right' });
    placements.forEach((placement) => {
      context.save();
      context.globalAlpha = placement.opacity;
      context.translate(placement.x + placement.width / 2, placement.y + placement.height / 2);
      context.rotate((placement.rotation * Math.PI) / 180);
      if (type === 'text') {
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.shadowColor = 'rgba(0,0,0,.55)';
        context.shadowBlur = 3;
        context.fillText(text || '水印', 0, 0, placement.width);
      } else context.drawImage(watermark!.image, -placement.width / 2, -placement.height / 2, placement.width, placement.height);
      context.restore();
    });
    return [{ blob: await canvasBlob(canvas), name: '图片水印.png', label: '带水印图片' }];
  });
  return <WorkspaceFrame {...job}><Dropzone onFiles={job.acceptFiles} /><div className="image-controls"><label>水印类型<select aria-label="水印类型" value={type} onChange={(event) => setType(event.target.value as 'text' | 'image')}><option value="text">文字水印</option><option value="image">图片水印</option></select></label>{type === 'text' ? <label key="text-watermark">水印文字<input aria-label="水印文字" value={text} onChange={(event) => setText(event.target.value)} /></label> : <label key="image-watermark">选择水印图片<input aria-label="选择水印图片" type="file" accept="image/*" onChange={loadWatermark} /></label>}<label>布局方式<select aria-label="水印布局" value={mode} onChange={(event) => setMode(event.target.value as 'single' | 'tile')}><option value="single">右下角单个</option><option value="tile">平铺水印</option></select></label><label>透明度<input aria-label="水印透明度" type="range" min="0.05" max="1" step="0.05" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} /></label><label>旋转角度<input aria-label="水印旋转角度" type="number" min="-180" max="180" value={rotation} onChange={(event) => setRotation(Number(event.target.value))} /></label><label>边距<input aria-label="水印边距" type="number" min="0" max="500" value={margin} onChange={(event) => setMargin(Number(event.target.value))} /></label><button type="button" onClick={process}>添加水印</button></div></WorkspaceFrame>;
}

function sharpenImage(context: CanvasRenderingContext2D, width: number, height: number, amount: number): void {
  if (amount <= 0) return;
  const source = context.getImageData(0, 0, width, height);
  const output = context.createImageData(width, height);
  output.data.set(source.data);
  const strength = amount / 100;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const center = source.data[index + channel] * (1 + 4 * strength);
        const around = (source.data[index - 4 + channel] + source.data[index + 4 + channel] + source.data[index - width * 4 + channel] + source.data[index + width * 4 + channel]) * strength;
        output.data[index + channel] = Math.max(0, Math.min(255, center - around));
      }
    }
  }
  context.putImageData(output, 0, 0);
}

function EnhancerTool() {
  const job = useImageJob();
  const [scale, setScale] = useState(1);
  const [contrast, setContrast] = useState(110);
  const [saturation, setSaturation] = useState(105);
  const [sharpen, setSharpen] = useState(15);
  const process = () => job.run(async ([asset]) => {
    const width = Math.round(asset.width * scale);
    const height = Math.round(asset.height * scale);
    const canvas = makeCanvas(width, height);
    const context = context2d(canvas, true);
    context.filter = `contrast(${contrast}%) saturate(${saturation}%)`;
    context.drawImage(asset.image, 0, 0, width, height);
    context.filter = 'none';
    sharpenImage(context, width, height, sharpen);
    return [{ blob: await canvasBlob(canvas), name: '艺术品增强.png', label: `增强图片 ${width} × ${height}` }];
  });
  return <WorkspaceFrame {...job}><Dropzone onFiles={job.acceptFiles} /><div className="image-controls"><label>输出倍率<select aria-label="输出倍率" value={scale} onChange={(event) => setScale(Number(event.target.value))}><option value="1">原尺寸</option><option value="1.5">1.5 倍</option><option value="2">2 倍</option></select></label><label>对比度<input aria-label="对比度" type="range" min="50" max="180" value={contrast} onChange={(event) => setContrast(Number(event.target.value))} /></label><label>饱和度<input aria-label="饱和度" type="range" min="0" max="200" value={saturation} onChange={(event) => setSaturation(Number(event.target.value))} /></label><label>锐化强度<input aria-label="锐化强度" type="range" min="0" max="50" value={sharpen} onChange={(event) => setSharpen(Number(event.target.value))} /></label><button type="button" onClick={process}>增强图片</button></div></WorkspaceFrame>;
}

function FaviconTool() {
  const job = useImageJob();
  const [sizes, setSizes] = useState('16,32,48,180,192,512');
  const process = () => job.run(async ([asset]) => Promise.all(faviconSizes(sizes.split(',').map((item) => Number(item.trim()))).map(async (size) => {
    const canvas = makeCanvas(size, size);
    const context = context2d(canvas);
    const layout = fitMatte(asset.width, asset.height, size, size, 'cover');
    drawRect(context, asset.image, layout.source, layout.destination);
    return { blob: await canvasBlob(canvas), name: `favicon-${size}x${size}.png`, label: `${size} × ${size} 图标` };
  })));
  return <WorkspaceFrame {...job}><Dropzone onFiles={job.acceptFiles} /><div className="image-controls"><label>图标尺寸<input aria-label="图标尺寸" value={sizes} onChange={(event) => setSizes(event.target.value)} /></label><button type="button" onClick={process}>生成 Favicon</button></div><p className="image-help">用英文逗号分隔尺寸。浏览器原生生成真实 PNG，可逐个下载；当前项目未引入 ZIP 依赖。</p></WorkspaceFrame>;
}

function ClipperTool() {
  const job = useImageJob();
  const [mode, setMode] = useState<'transparent' | 'custom'>('transparent');
  const [custom, setCustom] = useState({ x: 0, y: 0, width: 500, height: 500 });
  const update = (key: keyof typeof custom, value: number) => setCustom((current) => ({ ...current, [key]: value }));
  const process = () => job.run(async ([asset]) => {
    let region: Rect;
    if (mode === 'transparent') {
      const sourceCanvas = makeCanvas(asset.width, asset.height);
      const sourceContext = context2d(sourceCanvas, true);
      sourceContext.drawImage(asset.image, 0, 0);
      const imageData = sourceContext.getImageData(0, 0, asset.width, asset.height);
      const bounds = transparentBounds({ width: asset.width, height: asset.height, data: imageData.data });
      if (!bounds) throw new Error('图片完全透明，没有可保留的可见像素');
      region = bounds;
    } else {
      region = { ...custom };
      if (region.x < 0 || region.y < 0 || region.width <= 0 || region.height <= 0 || region.x + region.width > asset.width || region.y + region.height > asset.height) throw new Error('自定义裁剪区域超出图片范围');
    }
    const canvas = makeCanvas(region.width, region.height);
    context2d(canvas).drawImage(asset.image, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
    return [{ blob: await canvasBlob(canvas), name: '裁剪结果.png', label: `裁剪结果 ${region.width} × ${region.height}` }];
  });
  return <WorkspaceFrame {...job}><Dropzone onFiles={job.acceptFiles} /><div className="image-controls"><label>裁剪方式<select aria-label="裁剪方式" value={mode} onChange={(event) => setMode(event.target.value as 'transparent' | 'custom')}><option value="transparent">自动裁掉透明边缘</option><option value="custom">自定义矩形</option></select></label>{mode === 'custom' && <div className="image-coordinate-grid">{(['x', 'y', 'width', 'height'] as const).map((key) => <label key={key}>{key.toUpperCase()}<input aria-label={`裁剪 ${key}`} type="number" min="0" value={custom[key]} onChange={(event) => update(key, Number(event.target.value))} /></label>)}</div>}<button type="button" onClick={process}>裁剪图片</button></div></WorkspaceFrame>;
}

function ConverterTool() {
  const job = useImageJob();
  const capabilities = useMemo(() => getImageFormatCapabilities(), []);
  const initial = capabilities.find((item) => item.enabled)?.mime ?? '';
  const [mime, setMime] = useState(initial);
  const [quality, setQuality] = useState(0.9);
  const selected = capabilities.find((item) => item.mime === mime);
  const process = () => job.run(async ([asset]) => {
    if (!selected?.enabled) throw new Error('所选格式在当前浏览器中不能真实编码');
    const canvas = makeCanvas(asset.width, asset.height);
    const context = context2d(canvas);
    if (mime === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(asset.image, 0, 0);
    return [{ blob: await canvasBlob(canvas, selected.mime, quality), name: `转换结果.${selected.extension}`, label: `${selected.label} 转换结果` }];
  });
  return <WorkspaceFrame {...job}><Dropzone onFiles={job.acceptFiles} /><div className="image-controls"><label>输出格式<select aria-label="输出格式" value={mime} onChange={(event) => setMime(event.target.value)}>{capabilities.map((item) => <option key={item.mime} value={item.mime} disabled={!item.enabled}>{item.label}{item.enabled ? '' : '（不可用）'}</option>)}</select></label><label>图片质量<input aria-label="图片质量" type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(event) => setQuality(Number(event.target.value))} /></label><button type="button" disabled={!selected?.enabled} onClick={process}>转换并下载</button></div><ul className="format-capabilities" aria-label="格式能力说明">{capabilities.map((item) => <li key={item.mime}>{item.label}：{item.reason}</li>)}</ul></WorkspaceFrame>;
}

function SplitterTool() {
  const job = useImageJob();
  const [columns, setColumns] = useState(3);
  const [rows, setRows] = useState(3);
  const process = () => job.run(async ([asset]) => Promise.all(splitGrid(asset.width, asset.height, columns, rows).map(async (region, index) => {
    const canvas = makeCanvas(region.width, region.height);
    context2d(canvas).drawImage(asset.image, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
    return { blob: await canvasBlob(canvas), name: `切图-${index + 1}.png`, label: `切图 ${index + 1}` };
  })));
  return <WorkspaceFrame {...job}><Dropzone onFiles={job.acceptFiles} /><div className="image-controls"><label>分割列数<input aria-label="分割列数" type="number" min="1" max="20" value={columns} onChange={(event) => setColumns(Number(event.target.value))} /></label><label>分割行数<input aria-label="分割行数" type="number" min="1" max="20" value={rows} onChange={(event) => setRows(Number(event.target.value))} /></label><button type="button" onClick={process}>按网格切图</button></div></WorkspaceFrame>;
}

function StitcherTool() {
  const job = useImageJob(true);
  const [direction, setDirection] = useState<StitchDirection>('horizontal');
  const [gap, setGap] = useState(0);
  const [background, setBackground] = useState('#ffffff');
  const process = () => job.run(async (assets) => {
    const layout = stitchLayout(assets, direction, gap);
    const canvas = makeCanvas(layout.width, layout.height);
    const context = context2d(canvas);
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    assets.forEach((asset, index) => {
      const placement = layout.placements[index];
      context.drawImage(asset.image, placement.x, placement.y, placement.width, placement.height);
    });
    return [{ blob: await canvasBlob(canvas), name: '图片拼接.png', label: `${direction === 'horizontal' ? '横向' : '纵向'}拼接结果` }];
  });
  return <WorkspaceFrame {...job}><Dropzone onFiles={job.acceptFiles} multiple /><div className="image-controls"><label>拼接方向<select aria-label="拼接方向" value={direction} onChange={(event) => setDirection(event.target.value as StitchDirection)}><option value="horizontal">横向拼接</option><option value="vertical">纵向拼接</option></select></label><label>图片间距<input aria-label="图片间距" type="number" min="0" max="500" value={gap} onChange={(event) => setGap(Number(event.target.value))} /></label><label>空白颜色<input aria-label="空白颜色" type="color" value={background} onChange={(event) => setBackground(event.target.value)} /></label><button type="button" onClick={process}>拼接图片</button></div></WorkspaceFrame>;
}

function PasteImageTool() {
  const job = useImageJob();
  const paste = async () => {
    job.setOutputs([]);
    job.setImages([]);
    job.setStatus({ kind: 'loading', message: '正在读取剪贴板图片' });
    try {
      if (!navigator.clipboard?.read) throw new Error('当前浏览器未开放剪贴板图片读取能力');
      const items = await navigator.clipboard.read();
      const imageType = items.flatMap((item) => item.types).find((type) => type.startsWith('image/'));
      const owner = items.find((item) => imageType && item.types.includes(imageType));
      if (!imageType || !owner) throw new Error('剪贴板中没有图片');
      const blob = await owner.getType(imageType);
      await job.acceptFiles([new File([blob], `剪贴板图片.${imageType.split('/')[1] || 'png'}`, { type: imageType })]);
    } catch (reason) {
      job.setOutputs([]);
      job.setImages([]);
      job.setStatus({ kind: 'error', message: `无法读取剪贴板图片：${errorMessage(reason)}` });
    }
  };
  const exportImage = () => job.run(async ([asset]) => [{ blob: asset.file, name: asset.file.name || '剪贴板图片.png', label: '剪贴板图片' }]);
  return <WorkspaceFrame {...job}><Dropzone onFiles={job.acceptFiles} /><div className="image-controls"><button type="button" aria-label="粘贴剪贴板图片" onClick={paste}>粘贴剪贴板图片</button>{job.images.length > 0 && <button type="button" onClick={exportImage}>准备下载</button>}</div><p className="image-help">也可以直接在页面聚焦时使用系统粘贴，或通过上方拖放区导入截图。</p></WorkspaceFrame>;
}

function PlaceholderTool() {
  const job = useImageJob();
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(630);
  const [text, setText] = useState('1200 × 630');
  const [background, setBackground] = useState('#e2e8f0');
  const [foreground, setForeground] = useState('#334155');
  const generate = () => {
    job.setOutputs([]);
    job.setStatus({ kind: 'loading', message: '正在生成占位图' });
    try {
      const svg = createPlaceholderSvg({ width, height, text, background, foreground });
      job.setOutputs([{ blob: new Blob([svg], { type: 'image/svg+xml' }), name: `占位图-${width}x${height}.svg`, label: ' SVG' }]);
      job.setStatus({ kind: 'success', message: '占位图已生成' });
    } catch (reason) {
      job.setOutputs([]);
      job.setStatus({ kind: 'error', message: errorMessage(reason) });
    }
  };
  const importSize = async (files: File[]) => {
    await job.acceptFiles(files);
    try {
      const asset = await readLocalImage(files[0]);
      setWidth(asset.width);
      setHeight(asset.height);
      setText(`${asset.width} × ${asset.height}`);
    } catch { /* job already presents decoding errors */ }
  };
  return <WorkspaceFrame {...job}><Dropzone onFiles={importSize} /><div className="image-controls"><label>占位宽度<input aria-label="占位宽度" type="number" min="1" max="16384" value={width} onChange={(event) => setWidth(Number(event.target.value))} /></label><label>占位高度<input aria-label="占位高度" type="number" min="1" max="16384" value={height} onChange={(event) => setHeight(Number(event.target.value))} /></label><label>占位文字<input aria-label="占位文字" value={text} onChange={(event) => setText(event.target.value)} /></label><label>背景颜色<input aria-label="占位背景颜色" type="color" value={background} onChange={(event) => setBackground(event.target.value)} /></label><label>文字颜色<input aria-label="占位文字颜色" type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} /></label><button type="button" onClick={generate}>生成占位图</button></div></WorkspaceFrame>;
}

function Base64Tool() {
  const job = useImageJob();
  const [dataUrl, setDataUrl] = useState('');
  const encodeFiles = async (files: File[]) => {
    job.setOutputs([]);
    job.setStatus({ kind: 'loading', message: '正在读取图片并生成 Data URL' });
    try {
      const [file] = files;
      const value = await readFileAsDataUrl(file);
      setDataUrl(value);
      const image = await readLocalImage(file);
      job.setImages([image]);
      job.setStatus({ kind: 'success', message: `已编码 ${file.type || 'image/*'} 图片` });
    } catch (reason) {
      job.setImages([]);
      job.setOutputs([]);
      job.setStatus({ kind: 'error', message: errorMessage(reason) });
    }
  };
  const decode = () => {
    job.setOutputs([]);
    job.setStatus({ kind: 'loading', message: '正在解析图片 Data URL' });
    try {
      const decoded = decodeImageBase64(dataUrl);
      const extension = decoded.mime.split('/')[1]?.replace('jpeg', 'jpg').replace('svg+xml', 'svg') || 'bin';
      const byteCopy = new Uint8Array(decoded.bytes.length);
      byteCopy.set(decoded.bytes);
      const blob = new Blob([byteCopy.buffer], { type: decoded.mime });
      job.setOutputs([{ blob, name: `解码图片.${extension}`, label: '解码图片' }]);
      job.setStatus({ kind: 'success', message: `已解析 ${decoded.mime} 图片` });
    } catch (reason) {
      job.setOutputs([]);
      job.setStatus({ kind: 'error', message: errorMessage(reason) });
    }
  };
  return <WorkspaceFrame {...job}><Dropzone onFiles={encodeFiles} /><div className="image-controls image-controls--stack"><label>图片 Data URL<textarea aria-label="图片 Data URL" rows={7} value={dataUrl} onChange={(event) => setDataUrl(event.target.value)} placeholder="data:image/png;base64,..." /></label><div className="image-inline-actions"><button type="button" onClick={decode}>解析 Data URL</button>{dataUrl && <ResultPanel text={dataUrl} copyLabel="复制 Data URL" />}</div></div></WorkspaceFrame>;
}

function ToolContent({ toolId }: { toolId: ToolId }) {
  if (toolId === 'matte-generator') return <MatteTool />;
  if (toolId === 'scroll-generator') return <ScrollTool />;
  if (toolId === 'social-cropper') return <SocialCropTool />;
  if (toolId === 'watermarker') return <WatermarkTool />;
  if (toolId === 'artwork-enhancer') return <EnhancerTool />;
  if (toolId === 'favicon-genny') return <FaviconTool />;
  if (toolId === 'image-clipper') return <ClipperTool />;
  if (toolId === 'image-converter') return <ConverterTool />;
  if (toolId === 'image-splitter') return <SplitterTool />;
  if (toolId === 'image-stitcher') return <StitcherTool />;
  if (toolId === 'paste-image') return <PasteImageTool />;
  if (toolId === 'placeholder-genny') return <PlaceholderTool />;
  return <Base64Tool />;
}

export function ImageWorkspace({ tool }: ImageWorkspaceProps) {
  return (
    <section className="tool-page page-wrap">
      <a className="back-link" href="/">← 返回工具目录</a>
      <p className="page-kicker">{tool.englishTitle}</p>
      <h1>{tool.title}</h1>
      <p className="page-lede">{tool.description}</p>
      <p className="local-note">图片只在你的设备本地处理，不会上传到服务器。</p>
      <div className="image-workspace" aria-label={`${tool.title} 工作区`}><ToolContent toolId={tool.id} /></div>
    </section>
  );
}
