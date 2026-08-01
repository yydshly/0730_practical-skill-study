import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';

import { CanvasStage } from '../components/editor/CanvasStage';
import { InspectorPanel } from '../components/editor/InspectorPanel';
import { LayerPanel } from '../components/editor/LayerPanel';
import { ResultPanel } from '../components/ResultPanel';
import { StatusMessage } from '../components/StatusMessage';
import { loadImage, readFileAsDataUrl } from '../core/files';
import type { ToolDefinition } from '../core/types';
import { createDocument, editorReducer, renderDocument } from '../engines/editor';
import type { EditorAction } from '../engines/editor';

type EditorWorkspaceProps = { tool: ToolDefinition };
type MobilePanel = 'layers' | 'inspector' | null;
type ExportState = { kind: 'idle' | 'loading' | 'success' | 'error'; message: string; blob?: Blob };

function useMobileEditor(): boolean {
  const query = '(max-width: 900px)';
  const [mobile, setMobile] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia(query).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(query);
    const update = () => setMobile(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  return mobile;
}

function isFormTarget(target: EventTarget | null): boolean {
  const element = target instanceof HTMLElement ? target : null;
  return Boolean(element?.closest('input, textarea, select, [contenteditable="true"]'));
}

function isAbortError(reason: unknown): boolean {
  return reason instanceof DOMException && reason.name === 'AbortError';
}

function MobileDrawer({ label, closeLabel, onClose, children }: { label: string; closeLabel: string; onClose: () => void; children: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  return <div className="editor-mobile-layer">
    <button type="button" className="editor-mobile-scrim" aria-label={`点击遮罩${closeLabel}`} onClick={onClose} />
    <section className="editor-mobile-drawer" role="dialog" aria-modal="true" aria-label={label} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } }}>
      <button ref={closeRef} type="button" className="editor-drawer-close" aria-label={closeLabel} onClick={onClose}>关闭</button>
      {children}
    </section>
  </div>;
}

export function EditorWorkspace({ tool }: EditorWorkspaceProps) {
  const [document, baseDispatch] = useReducer(editorReducer, undefined, () => createDocument());
  const [showCanvasSettings, setShowCanvasSettings] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [exportState, setExportState] = useState<ExportState>({ kind: 'idle', message: '添加图层后即可编辑并导出 PNG' });
  const [imageStatus, setImageStatus] = useState('');
  const mobile = useMobileEditor();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const layerTriggerRef = useRef<HTMLButtonElement>(null);
  const inspectorTriggerRef = useRef<HTMLButtonElement>(null);
  const importVersion = useRef(0);
  const importAbortRef = useRef<AbortController | null>(null);
  const exportVersion = useRef(0);
  const exportAbortRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    importVersion.current += 1;
    exportVersion.current += 1;
    importAbortRef.current?.abort();
    exportAbortRef.current?.abort();
    importAbortRef.current = null;
    exportAbortRef.current = null;
  }, []);

  const dispatch = useCallback((action: EditorAction) => {
    if (action.type !== 'select') {
      exportVersion.current += 1;
      exportAbortRef.current?.abort();
      exportAbortRef.current = null;
    }
    baseDispatch(action);
    if (action.type !== 'select') setExportState({ kind: 'idle', message: '画布已更新，可重新导出 PNG' });
  }, []);

  const addLayer = (layerType: 'text' | 'rectangle' | 'circle' | 'arrow') => {
    dispatch({ type: 'add', layerType });
    setShowCanvasSettings(false);
  };

  const importImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    importAbortRef.current?.abort();
    const controller = new AbortController();
    importAbortRef.current = controller;
    const version = ++importVersion.current;
    setImageStatus('正在本地解码图片');
    setExportState({ kind: 'idle', message: '正在添加图片图层' });
    try {
      if (!file.type.startsWith('image/')) throw new Error('请选择图片文件');
      const [source, image] = await Promise.all([readFileAsDataUrl(file, controller.signal), loadImage(file, controller.signal)]);
      if (version !== importVersion.current || controller.signal.aborted) return;
      const naturalWidth = image.naturalWidth || image.width;
      const naturalHeight = image.naturalHeight || image.height;
      if (!naturalWidth || !naturalHeight) throw new Error('图片尺寸无效，请重新选择完整图片');
      const scale = Math.min(1, document.canvas.width * 0.7 / naturalWidth, document.canvas.height * 0.7 / naturalHeight);
      dispatch({ type: 'add', layerType: 'image', source, name: file.name, width: naturalWidth * scale, height: naturalHeight * scale });
      setImageStatus(`已添加图片：${file.name}`);
      setShowCanvasSettings(false);
    } catch (reason) {
      if (version !== importVersion.current || controller.signal.aborted || isAbortError(reason)) return;
      const message = reason instanceof Error ? reason.message : '图片解码失败，请重试';
      setImageStatus(message);
      setExportState({ kind: 'error', message });
    } finally {
      if (importAbortRef.current === controller) importAbortRef.current = null;
    }
  };

  const exportPng = async () => {
    exportAbortRef.current?.abort();
    const controller = new AbortController();
    exportAbortRef.current = controller;
    const version = ++exportVersion.current;
    setExportState({ kind: 'loading', message: '正在本地渲染 PNG' });
    try {
      const blob = await renderDocument(document, { signal: controller.signal });
      if (version !== exportVersion.current || controller.signal.aborted) return;
      setExportState({ kind: 'success', message: 'PNG 已生成，可下载', blob });
    } catch (reason) {
      if (version !== exportVersion.current || controller.signal.aborted || isAbortError(reason)) return;
      const message = reason instanceof Error ? reason.message : 'PNG 导出失败，请重试';
      setExportState({ kind: 'error', message });
    } finally {
      if (exportAbortRef.current === controller) exportAbortRef.current = null;
    }
  };

  const closeMobilePanel = () => {
    const target = mobilePanel === 'layers' ? layerTriggerRef.current : inspectorTriggerRef.current;
    target?.focus();
    setMobilePanel(null);
  };

  const toggleCanvasSettings = () => {
    const next = !showCanvasSettings;
    setShowCanvasSettings(next);
    if (mobile) setMobilePanel('inspector');
  };

  const handleWorkspaceKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (isFormTarget(event.target) || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
    event.preventDefault();
    dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
  };

  return (
    <section className="tool-page editor-page" onKeyDown={handleWorkspaceKeyDown}>
      <div className="editor-page__intro page-wrap">
        <a className="back-link" href="/">← 返回工具目录</a>
        <p className="page-kicker">{tool.englishTitle}</p>
        <h1>{tool.title}</h1>
        <p className="page-lede">{tool.description}</p>
        <p className="local-note">所有图片与编辑状态都只保留在当前浏览器页面，不会上传到服务器。</p>
      </div>
      <div className="substrata-workspace" aria-label="Substrata 图片编辑器工作区">
        <div className="editor-toolbar" role="toolbar" aria-label="编辑器工具栏">
          <button type="button" onClick={() => imageInputRef.current?.click()} aria-label="添加图片图层">＋ 图片</button>
          <input ref={imageInputRef} className="sr-only" type="file" accept="image/*" aria-label="选择图片图层文件" onChange={importImage} />
          <button type="button" onClick={() => addLayer('text')} aria-label="添加文字图层">＋ 文字</button>
          <button type="button" onClick={() => addLayer('rectangle')} aria-label="添加矩形图层">▭ 矩形</button>
          <button type="button" onClick={() => addLayer('circle')} aria-label="添加圆形图层">○ 圆形</button>
          <button type="button" onClick={() => addLayer('arrow')} aria-label="添加箭头图层">→ 箭头</button>
          <span className="editor-toolbar__separator" aria-hidden="true" />
          <button type="button" disabled={document.history.length === 0} onClick={() => dispatch({ type: 'undo' })} aria-label="撤销">↶ 撤销</button>
          <button type="button" disabled={document.future.length === 0} onClick={() => dispatch({ type: 'redo' })} aria-label="重做">↷ 重做</button>
          <button type="button" aria-pressed={showCanvasSettings} onClick={toggleCanvasSettings} aria-label="画布设置">⚙ 画布</button>
          {mobile && <>
            <button ref={layerTriggerRef} type="button" onClick={() => setMobilePanel('layers')} aria-label="打开图层面板">图层</button>
            <button ref={inspectorTriggerRef} type="button" onClick={() => { setShowCanvasSettings(false); setMobilePanel('inspector'); }} aria-label="打开属性面板">属性</button>
          </>}
          <button type="button" className="editor-toolbar__export" onClick={exportPng} disabled={exportState.kind === 'loading'} aria-label="导出 PNG">{exportState.kind === 'loading' ? '导出中…' : '导出 PNG'}</button>
        </div>
        {imageStatus && <p className="editor-import-status" role="status">{imageStatus}</p>}
        <div className="editor-layout">
          {!mobile && <aside className="editor-panel editor-panel--layers" aria-label="图层面板"><LayerPanel document={document} dispatch={dispatch} /></aside>}
          <main className="editor-canvas-column"><CanvasStage document={document} dispatch={dispatch} /></main>
          {!mobile && <aside className="editor-panel editor-panel--inspector" aria-label="属性面板"><InspectorPanel document={document} dispatch={dispatch} showCanvasSettings={showCanvasSettings} /></aside>}
        </div>
        <div className="editor-export-state">
          <StatusMessage status={exportState.kind === 'idle' ? 'idle' : exportState.kind} message={exportState.message} />
          {exportState.blob && <ResultPanel download={{ blob: exportState.blob, name: 'Substrata-画布.png', label: '下载 PNG' }} />}
        </div>
      </div>
      {mobilePanel === 'layers' && <MobileDrawer label="移动端图层面板" closeLabel="关闭图层面板" onClose={closeMobilePanel}><LayerPanel document={document} dispatch={dispatch} /></MobileDrawer>}
      {mobilePanel === 'inspector' && <MobileDrawer label="移动端属性面板" closeLabel="关闭属性面板" onClose={closeMobilePanel}><InspectorPanel document={document} dispatch={dispatch} showCanvasSettings={showCanvasSettings} /></MobileDrawer>}
    </section>
  );
}
