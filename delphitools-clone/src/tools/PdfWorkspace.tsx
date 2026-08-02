import { useEffect, useRef, useState } from 'react';

import { FileDropzone } from '../components/FileDropzone';
import { ResultPanel } from '../components/ResultPanel';
import { StatusMessage, type StatusKind } from '../components/StatusMessage';
import { ToolLayout } from '../components/ToolLayout';
import { loadImage, readFileAsText } from '../core/files';
import type { ToolDefinition, ToolId } from '../core/types';
import {
  removeBackground,
  traceImage,
  type BackgroundOptions,
  type RasterData,
  type TraceOptions,
} from '../engines/advancedImage';
import {
  createZinePdf,
  imposePdf,
  optimiseSvg,
  preflightPdf,
  zineEightPageOrder,
  type ImposeOptions,
  type NUpOptions,
  type PdfPreflightResult,
} from '../engines/pdf';
import type { WorkerResponse } from '../workers/protocol';

type PdfWorkspaceProps = { tool: ToolDefinition };
type JobState = { kind: StatusKind; message: string };
type ActiveJob = { worker: Worker; reject: (reason: Error) => void };
type TaskVersion = React.MutableRefObject<number>;

const ADVANCED_TOOL_IDS: readonly ToolId[] = ['background-remover', 'image-tracer', 'svg-optimiser', 'pdf-preflight', 'imposer', 'zine-imposer'];

export function isPdfToolId(toolId: ToolId): boolean {
  return ADVANCED_TOOL_IDS.includes(toolId);
}

function reasonMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : `处理失败：${String(reason)}`;
}

function useObjectUrl(blob?: Blob): string {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob || typeof URL.createObjectURL !== 'function') { setUrl(''); return; }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL?.(next);
  }, [blob]);
  return url;
}

function bytesBlob(bytes: Uint8Array, type: string): Blob {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type });
}

function readFileBytes(file: File): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('读取文件失败，请重试'));
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(file);
  });
}

async function loadRaster(file: File): Promise<RasterData> {
  const image = await loadImage(file);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height || width * height > 20_000_000) throw new Error('图片尺寸无效或像素过多');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('当前浏览器无法创建图片处理画布');
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  return { width, height, data: new Uint8ClampedArray(pixels.data) };
}

function rasterPng(raster: RasterData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = raster.width;
  canvas.height = raster.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器无法创建透明图片画布');
  const imageData = context.createImageData(raster.width, raster.height);
  imageData.data.set(raster.data);
  context.putImageData(imageData, 0, 0);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob?.type === 'image/png' ? resolve(blob) : reject(new Error('当前浏览器无法编码透明 PNG')), 'image/png'));
}

function createBackgroundWorker(): Worker {
  return new Worker(new URL('../workers/backgroundRemoval.worker.ts', import.meta.url), { type: 'module' });
}

function createTraceWorker(): Worker {
  return new Worker(new URL('../workers/imageTrace.worker.ts', import.meta.url), { type: 'module' });
}

function createPdfWorker(): Worker {
  return new Worker(new URL('../workers/pdf.worker.ts', import.meta.url), { type: 'module' });
}

function executeWorker<T>(
  createWorker: () => Worker,
  request: { id: string; type: string; payload: unknown },
  transfer: Transferable[],
  active: React.MutableRefObject<ActiveJob | null>,
  onProgress?: (progress: number, message: string) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const worker = createWorker();
    const finish = () => {
      worker.terminate();
      if (active.current?.worker === worker) active.current = null;
    };
    active.current = { worker, reject };
    worker.onmessage = (event: MessageEvent<WorkerResponse<T>>) => {
      const response = event.data;
      if (response.id !== request.id) return;
      if (response.type === 'progress') { onProgress?.(response.progress, response.message); return; }
      finish();
      if (response.type === 'success') resolve(response.result);
      else reject(new Error(response.message));
    };
    worker.onerror = () => { finish(); reject(new Error('后台处理线程启动失败，请重试')); };
    worker.postMessage(request, transfer);
  });
}

function stopActiveJob(active: React.MutableRefObject<ActiveJob | null>): void {
  const current = active.current;
  if (!current) return;
  active.current = null;
  current.worker.terminate();
  current.reject(new Error('处理已取消'));
}

function beginTask(version: TaskVersion, active?: React.MutableRefObject<ActiveJob | null>): number {
  version.current += 1;
  if (active) stopActiveJob(active);
  return version.current;
}

function invalidateTask(version: TaskVersion, active?: React.MutableRefObject<ActiveJob | null>): void {
  beginTask(version, active);
}

function useTaskCleanup(version: TaskVersion, active?: React.MutableRefObject<ActiveJob | null>): void {
  useEffect(() => () => {
    version.current += 1;
    if (active) stopActiveJob(active);
  }, [active, version]);
}

function WorkspaceFrame({ tool, children, note }: { tool: ToolDefinition; children: React.ReactNode; note?: string }) {
  return <ToolLayout tool={tool} localNote={note}><div className="image-workspace advanced-workspace" aria-label={`${tool.title} 工作区`}>{children}</div></ToolLayout>;
}

function BackgroundWorkspace({ tool }: PdfWorkspaceProps) {
  const [file, setFile] = useState<File>();
  const [raster, setRaster] = useState<RasterData>();
  const [options, setOptions] = useState<BackgroundOptions>({ threshold: 42, feather: 24 });
  const [output, setOutput] = useState<Blob>();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<JobState>({ kind: 'idle', message: '请选择主体清晰、背景颜色相对统一的图片' });
  const active = useRef<ActiveJob | null>(null);
  const version = useRef(0);
  useTaskCleanup(version, active);

  const select = async (files: File[]) => {
    const task = beginTask(version, active);
    setOutput(undefined); setRaster(undefined); setFile(files[0]); setProgress(0);
    try {
      setStatus({ kind: 'loading', message: '正在本地读取图片像素' });
      const next = await loadRaster(files[0]);
      if (task !== version.current) return;
      setRaster(next);
      setStatus({ kind: 'success', message: '图片已读取，可开始本地颜色背景移除' });
    } catch (reason) {
      if (task === version.current) setStatus({ kind: 'error', message: reasonMessage(reason) });
    }
  };
  const run = async () => {
    const task = beginTask(version, active);
    setOutput(undefined); setProgress(0);
    if (!raster) { setStatus({ kind: 'error', message: '请先选择图片' }); return; }
    setStatus({ kind: 'loading', message: '正在加载本地颜色分割器' });
    try {
      let result: RasterData;
      if (typeof Worker === 'undefined') {
        await Promise.resolve();
        result = removeBackground(raster, options, (value) => setProgress(value));
      } else {
        const data = raster.data.slice().buffer;
        const response = await executeWorker<{ width: number; height: number; data: ArrayBuffer }>(createBackgroundWorker, { id: crypto.randomUUID(), type: 'remove-background', payload: { width: raster.width, height: raster.height, data, options } }, [data], active, (value, message) => {
          if (task !== version.current) return;
          setProgress(value); setStatus({ kind: 'loading', message });
        });
        result = { width: response.width, height: response.height, data: new Uint8ClampedArray(response.data) };
      }
      if (task !== version.current) return;
      const blob = await rasterPng(result);
      if (task !== version.current) return;
      setOutput(blob); setProgress(100); setStatus({ kind: 'success', message: '透明 PNG 已生成' });
    } catch (reason) {
      if (task === version.current) { setOutput(undefined); setStatus({ kind: 'error', message: reasonMessage(reason) }); }
    }
  };
  const cancel = () => {
    if (!active.current) return;
    beginTask(version, active);
    setOutput(undefined);
    setStatus({ kind: 'error', message: '处理已取消' });
  };
  const updateOptions = (next: BackgroundOptions) => {
    invalidateTask(version, active);
    setOutput(undefined);
    setOptions(next);
  };
  return <WorkspaceFrame tool={tool} note="图片只在设备本地处理。本工具使用边缘取样与颜色相似度分割，不是 AI 抠图模型；复杂毛发、透明物体和多色背景可能需要专业工具。">
    <section className="image-workspace__body">
      <h2>本地颜色背景移除</h2>
      <p className="image-help">这不是 AI 抠图模型。算法从图片四角估计背景色，适合纯色或近似纯色背景。</p>
      <FileDropzone accepted={['image/*']} inputLabel="选择背景移除图片" multiple={false} onFiles={select} onError={(message) => { invalidateTask(version, active); setOutput(undefined); setProgress(0); setStatus({ kind: 'error', message }); }} />
      {file && <p>{file.name}</p>}
      <div className="image-controls">
        <label>背景相似度阈值<input aria-label="背景相似度阈值" type="range" min="0" max="220" value={options.threshold} onChange={(event) => updateOptions({ ...options, threshold: Number(event.target.value) })} /></label>
        <label>边缘羽化<input aria-label="边缘羽化" type="range" min="0" max="120" value={options.feather} onChange={(event) => updateOptions({ ...options, feather: Number(event.target.value) })} /></label>
        <button type="button" onClick={run}>移除颜色背景</button>
        <button type="button" onClick={cancel} disabled={!active.current}>取消处理</button>
        <button type="button" onClick={run}>重试处理</button>
      </div>
      {status.kind === 'loading' && <progress aria-label="处理进度" max="100" value={progress}>{progress}%</progress>}
      <StatusMessage status={status.kind} message={status.message} />
      {output && <ResultPanel download={{ blob: output, name: '本地颜色背景移除.png', label: '下载透明 PNG' }} onReset={() => setOutput(undefined)} />}
    </section>
  </WorkspaceFrame>;
}

function TraceWorkspace({ tool }: PdfWorkspaceProps) {
  const [file, setFile] = useState<File>();
  const [raster, setRaster] = useState<RasterData>();
  const [options, setOptions] = useState<TraceOptions>({ threshold: 128, smoothing: 25, mode: 'monochrome', maxColors: 4 });
  const [svg, setSvg] = useState('');
  const [status, setStatus] = useState<JobState>({ kind: 'idle', message: '请选择标志、线稿或简单色块图片' });
  const active = useRef<ActiveJob | null>(null);
  const version = useRef(0);
  useTaskCleanup(version, active);
  const blob = svg ? new Blob([svg], { type: 'image/svg+xml' }) : undefined;
  const preview = useObjectUrl(blob);
  const select = async (files: File[]) => {
    const task = beginTask(version, active);
    setSvg(''); setRaster(undefined); setFile(files[0]);
    try {
      setStatus({ kind: 'loading', message: '正在本地读取图片像素' });
      const next = await loadRaster(files[0]);
      if (task !== version.current) return;
      setRaster(next); setStatus({ kind: 'success', message: '图片已读取，可开始追踪' });
    } catch (reason) {
      if (task === version.current) setStatus({ kind: 'error', message: reasonMessage(reason) });
    }
  };
  const run = async () => {
    const task = beginTask(version, active);
    setSvg('');
    if (!raster) { setStatus({ kind: 'error', message: '请先选择图片' }); return; }
    setStatus({ kind: 'loading', message: '正在后台生成 SVG 路径' });
    try {
      let result: string;
      if (typeof Worker === 'undefined') { await Promise.resolve(); result = traceImage(raster, options); }
      else {
        const data = raster.data.slice().buffer;
        const response = await executeWorker<{ svg: string }>(createTraceWorker, { id: crypto.randomUUID(), type: 'trace-image', payload: { width: raster.width, height: raster.height, data, options } }, [data], active, (_value, message) => {
          if (task === version.current) setStatus({ kind: 'loading', message });
        });
        result = response.svg;
      }
      if (task !== version.current) return;
      setSvg(result); setStatus({ kind: 'success', message: 'SVG 路径已生成' });
    } catch (reason) {
      if (task === version.current) { setSvg(''); setStatus({ kind: 'error', message: reasonMessage(reason) }); }
    }
  };
  const updateOptions = (next: TraceOptions) => {
    invalidateTask(version, active);
    setSvg('');
    setOptions(next);
  };
  return <WorkspaceFrame tool={tool} note="图片在本地转换为真实 SVG 路径。该像素追踪适合图标、线稿和有限色块，不等同于专业曲线矢量化。">
    <FileDropzone accepted={['image/*']} inputLabel="选择追踪图片" multiple={false} onFiles={select} onError={(message) => { invalidateTask(version, active); setSvg(''); setStatus({ kind: 'error', message }); }} />
    {file && <p>{file.name}</p>}
    <div className="image-controls">
      {options.mode === 'monochrome' && <label>追踪阈值<input aria-label="追踪阈值" type="number" min="0" max="255" value={options.threshold} onChange={(event) => updateOptions({ ...options, threshold: Number(event.target.value) })} /></label>}
      <label>平滑度<input aria-label="平滑度" type="range" min="0" max="100" value={options.smoothing} onChange={(event) => updateOptions({ ...options, smoothing: Number(event.target.value) })} /></label>
      <label>追踪模式<select aria-label="追踪模式" value={options.mode} onChange={(event) => updateOptions({ ...options, mode: event.target.value as TraceOptions['mode'] })}><option value="monochrome">黑白</option><option value="color">有限颜色</option></select></label>
      {options.mode === 'color' && <label>最大颜色数<input aria-label="最大颜色数" type="number" min="2" max="16" value={options.maxColors} onChange={(event) => updateOptions({ ...options, maxColors: Number(event.target.value) })} /></label>}
      <button type="button" onClick={run}>生成 SVG</button>
      <button type="button" onClick={() => { if (active.current) { beginTask(version, active); setSvg(''); setStatus({ kind: 'error', message: '处理已取消' }); } }} disabled={!active.current}>取消追踪</button>
    </div>
    <StatusMessage status={status.kind} message={status.message} />
    {blob && <ResultPanel download={{ blob, name: '图片追踪.svg', label: '下载追踪 SVG' }} onReset={() => setSvg('')}>{preview && <img className="advanced-preview" src={preview} alt="追踪 SVG 预览" />}</ResultPanel>}
  </WorkspaceFrame>;
}

function SvgWorkspace({ tool }: PdfWorkspaceProps) {
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<ReturnType<typeof optimiseSvg>>();
  const [status, setStatus] = useState<JobState>({ kind: 'idle', message: '请选择需要安全清理和压缩的 SVG' });
  const version = useRef(0);
  useTaskCleanup(version);
  const blob = result ? new Blob([result.svg], { type: 'image/svg+xml' }) : undefined;
  const preview = useObjectUrl(blob);
  const process = async (files: File[]) => {
    const task = beginTask(version);
    const selected = files[0]; setFile(selected); setResult(undefined); setStatus({ kind: 'loading', message: '正在读取并净化 SVG' });
    try {
      const next = optimiseSvg(await readFileAsText(selected));
      if (task !== version.current) return;
      setResult(next); setStatus({ kind: 'success', message: next.removedUnsafe ? 'SVG 已净化并移除不安全内容' : 'SVG 已安全优化' });
    } catch (reason) {
      if (task === version.current) { setResult(undefined); setStatus({ kind: 'error', message: reasonMessage(reason) }); }
    }
  };
  return <WorkspaceFrame tool={tool}>
    <FileDropzone accepted={['image/svg+xml', '.svg']} inputLabel="选择 SVG 文件" multiple={false} onFiles={process} onError={(message) => { invalidateTask(version); setResult(undefined); setStatus({ kind: 'error', message }); }} />
    {file && <p>{file.name}</p>}
    <StatusMessage status={status.kind} message={status.message} />
    {result && blob && <ResultPanel download={{ blob, name: `${file?.name.replace(/\.svg$/i, '') || '优化结果'}-优化.svg`, label: '下载优化后的 SVG' }} onReset={() => setResult(undefined)}>
      <p>优化前 {result.beforeBytes} 字节 · 优化后 {result.afterBytes} 字节</p>
      {preview && <img className="advanced-preview" src={preview} alt="安全 SVG 预览" />}
    </ResultPanel>}
  </WorkspaceFrame>;
}

function PdfFileInput({ file, onFiles, onError }: { file?: File; onFiles: (files: File[]) => void; onError: (message: string) => void }) {
  return <><FileDropzone accepted={['application/pdf', '.pdf']} inputLabel="选择 PDF 文件" multiple={false} onFiles={onFiles} onError={onError} maxSizeBytes={100 * 1024 * 1024} />{file && <p>{file.name} · {Math.max(1, Math.round(file.size / 1024))} KB</p>}</>;
}

async function runPdfWorker<T>(
  type: 'preflight' | 'impose' | 'zine',
  file: File,
  options: unknown,
  active: React.MutableRefObject<ActiveJob | null>,
  onProgress: (message: string) => void,
  isCurrent: () => boolean,
): Promise<T> {
  const bytes = await readFileBytes(file);
  if (!isCurrent()) throw new Error('处理已取消');
  if (typeof Worker === 'undefined') {
    if (type === 'preflight') return await preflightPdf(bytes) as T;
    if (type === 'impose') return { bytes: (await imposePdf(bytes, options as ImposeOptions)).buffer } as T;
    return { bytes: (await createZinePdf(bytes, options as Pick<NUpOptions, 'paper' | 'orientation' | 'margin' | 'gap'>)).buffer } as T;
  }
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return executeWorker<T>(createPdfWorker, { id: crypto.randomUUID(), type, payload: { bytes: buffer, ...(type === 'preflight' ? {} : { options }) } }, [buffer], active, (_progress, message) => onProgress(message));
}

function PreflightWorkspace({ tool }: PdfWorkspaceProps) {
  const [file, setFile] = useState<File>();
  const [report, setReport] = useState<PdfPreflightResult>();
  const [status, setStatus] = useState<JobState>({ kind: 'idle', message: '请选择 PDF 开始本地预检' });
  const active = useRef<ActiveJob | null>(null);
  const version = useRef(0);
  useTaskCleanup(version, active);
  const inspect = async (selected = file) => {
    const task = beginTask(version, active);
    setReport(undefined);
    if (!selected) { setStatus({ kind: 'error', message: '请先选择 PDF 文件' }); return; }
    setStatus({ kind: 'loading', message: '正在本地解析 PDF' });
    try {
      const next = await runPdfWorker<PdfPreflightResult>('preflight', selected, undefined, active, (message) => {
        if (task === version.current) setStatus({ kind: 'loading', message });
      }, () => task === version.current);
      if (task !== version.current) return;
      setReport(next); setStatus({ kind: 'success', message: 'PDF 预检完成' });
    } catch (reason) {
      if (task === version.current) { setReport(undefined); setStatus({ kind: 'error', message: reasonMessage(reason) }); }
    }
  };
  const select = (files: File[]) => { setFile(files[0]); void inspect(files[0]); };
  return <WorkspaceFrame tool={tool}>
    <PdfFileInput file={file} onFiles={select} onError={(message) => { beginTask(version, active); setReport(undefined); setStatus({ kind: 'error', message }); }} />
    <div className="image-controls"><button type="button" onClick={() => void inspect()}>重新预检</button></div>
    <StatusMessage status={status.kind} message={status.message} />
    {report && <section aria-label="PDF 预检结果" className="preflight-report"><h2>{report.pageCount} 页</h2><dl><dt>标题</dt><dd>{report.metadata.title || '未设置'}</dd><dt>作者</dt><dd>{report.metadata.author || '未设置'}</dd></dl><table><thead><tr><th>页码</th><th>尺寸（pt）</th><th>方向</th></tr></thead><tbody>{report.pages.map((page) => <tr key={page.number}><td>{page.number}</td><td>{page.width} × {page.height}</td><td>{page.orientation === 'portrait' ? '纵向' : '横向'}</td></tr>)}</tbody></table>{report.warnings.length > 0 && <ul>{report.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}</section>}
  </WorkspaceFrame>;
}

function PrintControls({ options, setOptions }: { options: ImposeOptions; setOptions: (next: ImposeOptions) => void }) {
  return <div className="image-controls">
    <label>纸张尺寸<select aria-label="纸张尺寸" value={options.paper} onChange={(event) => setOptions({ ...options, paper: event.target.value as ImposeOptions['paper'] })}><option>A4</option><option>A3</option><option>A5</option><option>Letter</option></select></label>
    <label>纸张方向<select aria-label="纸张方向" value={options.orientation} onChange={(event) => setOptions({ ...options, orientation: event.target.value as ImposeOptions['orientation'] })}><option value="portrait">纵向</option><option value="landscape">横向</option></select></label>
    <label>边距（pt）<input aria-label="边距" type="number" min="0" value={options.margin} onChange={(event) => setOptions({ ...options, margin: Number(event.target.value) })} /></label>
    <label>间距（pt）<input aria-label="间距" type="number" min="0" value={options.gap} onChange={(event) => setOptions({ ...options, gap: Number(event.target.value) })} /></label>
    <label>输出模式<select aria-label="输出模式" value={options.mode} onChange={(event) => {
      const mode = event.target.value as ImposeOptions['mode'];
      setOptions({ ...options, mode, duplex: mode === 'booklet' ? 'double' : options.duplex });
    }}><option value="nup">N-up</option><option value="booklet">小册子 / 骑马订</option></select></label>
    {options.mode === 'nup' && <><label>每行列数<input aria-label="每行列数" type="number" min="1" max="8" value={options.columns} onChange={(event) => setOptions({ ...options, columns: Number(event.target.value) })} /></label><label>每页行数<input aria-label="每页行数" type="number" min="1" max="8" value={options.rows} onChange={(event) => setOptions({ ...options, rows: Number(event.target.value) })} /></label></>}
    {options.mode === 'nup' && <label>单双面<select aria-label="单双面" value={options.duplex} onChange={(event) => setOptions({ ...options, duplex: event.target.value as ImposeOptions['duplex'] })}><option value="single">单面输出</option><option value="double">双面打印</option></select></label>}
    {(options.mode === 'booklet' || options.duplex === 'double') && <label>翻转方式<select aria-label="翻转方式" value={options.flip} onChange={(event) => setOptions({ ...options, flip: event.target.value as ImposeOptions['flip'] })}><option value="long-edge">{options.orientation === 'portrait' ? '长边翻转（纵向纸张：左右镜像）' : '长边翻转（横向纸张：上下镜像）'}</option><option value="short-edge">{options.orientation === 'portrait' ? '短边翻转（纵向纸张：上下镜像）' : '短边翻转（横向纸张：左右镜像）'}</option></select></label>}
    <p className="image-help">长边指纸张较长的物理边，短边指较短的物理边。{options.mode === 'booklet' ? '小册子固定双面输出，背面会按纸张方向和所选翻转边镜像版位。' : '单面输出按正常顺序排版；双面输出会在背面按纸张方向和所选物理翻转边镜像版位。'}</p>
  </div>;
}

function ImposerWorkspace({ tool }: PdfWorkspaceProps) {
  const [file, setFile] = useState<File>();
  const [options, setOptions] = useState<ImposeOptions>({ mode: 'nup', paper: 'A4', orientation: 'landscape', columns: 2, rows: 2, margin: 18, gap: 8, duplex: 'double', flip: 'long-edge' });
  const [output, setOutput] = useState<Blob>();
  const [status, setStatus] = useState<JobState>({ kind: 'idle', message: '请选择 PDF 并设置拼版参数' });
  const active = useRef<ActiveJob | null>(null);
  const version = useRef(0);
  useTaskCleanup(version, active);
  const run = async () => {
    const task = beginTask(version, active);
    setOutput(undefined);
    if (!file) { setStatus({ kind: 'error', message: '请先选择 PDF 文件' }); return; }
    setStatus({ kind: 'loading', message: '正在后台生成拼版 PDF' });
    try {
      const result = await runPdfWorker<{ bytes: ArrayBuffer }>('impose', file, options, active, (message) => {
        if (task === version.current) setStatus({ kind: 'loading', message });
      }, () => task === version.current);
      if (task !== version.current) return;
      setOutput(new Blob([result.bytes], { type: 'application/pdf' })); setStatus({ kind: 'success', message: '真实拼版 PDF 已生成' });
    } catch (reason) {
      if (task === version.current) { setOutput(undefined); setStatus({ kind: 'error', message: reasonMessage(reason) }); }
    }
  };
  return <WorkspaceFrame tool={tool}>
    <PdfFileInput file={file} onFiles={(files) => { beginTask(version, active); setFile(files[0]); setOutput(undefined); setStatus({ kind: 'success', message: 'PDF 已选择，请确认拼版参数' }); }} onError={(message) => { beginTask(version, active); setOutput(undefined); setStatus({ kind: 'error', message }); }} />
    <PrintControls options={options} setOptions={(next) => { beginTask(version, active); setOptions(next); setOutput(undefined); }} />
    <div className="image-controls"><button type="button" onClick={run}>生成拼版 PDF</button></div>
    <StatusMessage status={status.kind} message={status.message} />
    {output && <ResultPanel download={{ blob: output, name: 'PDF-拼版.pdf', label: '下载拼版 PDF' }} onReset={() => setOutput(undefined)} />}
  </WorkspaceFrame>;
}

function ZineWorkspace({ tool }: PdfWorkspaceProps) {
  const [file, setFile] = useState<File>();
  const [output, setOutput] = useState<Blob>();
  const [status, setStatus] = useState<JobState>({ kind: 'idle', message: '请选择恰好 8 页的 PDF' });
  const active = useRef<ActiveJob | null>(null);
  const version = useRef(0);
  useTaskCleanup(version, active);
  const options = { paper: 'A4' as const, orientation: 'landscape' as const, margin: 12, gap: 4 };
  const run = async () => {
    const task = beginTask(version, active);
    setOutput(undefined);
    if (!file) { setStatus({ kind: 'error', message: '请先选择 8 页 PDF' }); return; }
    setStatus({ kind: 'loading', message: '正在生成单张 Zine 拼版' });
    try {
      const result = await runPdfWorker<{ bytes: ArrayBuffer }>('zine', file, options, active, (message) => {
        if (task === version.current) setStatus({ kind: 'loading', message });
      }, () => task === version.current);
      if (task !== version.current) return;
      setOutput(new Blob([result.bytes], { type: 'application/pdf' })); setStatus({ kind: 'success', message: '8 页 Zine PDF 已生成' });
    } catch (reason) {
      if (task === version.current) { setOutput(undefined); setStatus({ kind: 'error', message: reasonMessage(reason) }); }
    }
  };
  return <WorkspaceFrame tool={tool}>
    <section aria-label="8 页固定顺序" className="zine-order"><h2>8 页固定顺序</h2><p>{zineEightPageOrder().join('、')}</p></section>
    <p className="image-help">打印后沿中线裁切并折叠，再按页码方向压出 8 页 mini-zine。输入必须恰好 8 页。</p>
    <PdfFileInput file={file} onFiles={(files) => { beginTask(version, active); setFile(files[0]); setOutput(undefined); setStatus({ kind: 'success', message: 'PDF 已选择，可生成 Zine' }); }} onError={(message) => { beginTask(version, active); setOutput(undefined); setStatus({ kind: 'error', message }); }} />
    <div className="image-controls"><button type="button" onClick={run}>生成 8 页 Zine PDF</button></div>
    <StatusMessage status={status.kind} message={status.message} />
    {output && <ResultPanel download={{ blob: output, name: '8页-Zine-拼版.pdf', label: '下载 Zine PDF' }} onReset={() => setOutput(undefined)} />}
  </WorkspaceFrame>;
}

export function PdfWorkspace({ tool }: PdfWorkspaceProps) {
  switch (tool.id) {
    case 'background-remover': return <BackgroundWorkspace tool={tool} />;
    case 'image-tracer': return <TraceWorkspace tool={tool} />;
    case 'svg-optimiser': return <SvgWorkspace tool={tool} />;
    case 'pdf-preflight': return <PreflightWorkspace tool={tool} />;
    case 'imposer': return <ImposerWorkspace tool={tool} />;
    case 'zine-imposer': return <ZineWorkspace tool={tool} />;
    default: return <ToolLayout tool={tool}><p role="alert">工具路由配置错误，请返回目录后重试。</p></ToolLayout>;
  }
}
