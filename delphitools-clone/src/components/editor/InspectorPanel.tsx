import type { EditorAction, EditorCanvas, EditorDocument, EditorLayer } from '../../engines/editor';

type InspectorPanelProps = {
  document: EditorDocument;
  dispatch: (action: EditorAction) => void;
  showCanvasSettings?: boolean;
};

function numberValue(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function InspectorPanel({ document, dispatch, showCanvasSettings = false }: InspectorPanelProps) {
  const layer = document.layers.find((item) => item.id === document.selectedLayerId);
  const updateLayer = (changes: Partial<EditorLayer>) => {
    if (layer) dispatch({ type: 'update', id: layer.id, changes });
  };
  const updateCanvas = (changes: Partial<EditorCanvas>) => dispatch({ type: 'set-canvas', canvas: changes });

  return (
    <div className="editor-panel__body inspector-panel">
      <div className="editor-panel__heading">
        <div><span className="editor-panel__eyebrow">INSPECTOR</span><h2>{showCanvasSettings ? '画布设置' : '属性'}</h2></div>
      </div>
      {showCanvasSettings ? (
        <div className="inspector-form">
          <label>画布宽度<input aria-label="画布宽度" type="number" min="64" max="8192" value={document.canvas.width} onChange={(event) => updateCanvas({ width: numberValue(event.target.value, document.canvas.width) })} /></label>
          <label>画布高度<input aria-label="画布高度" type="number" min="64" max="8192" value={document.canvas.height} onChange={(event) => updateCanvas({ height: numberValue(event.target.value, document.canvas.height) })} /></label>
          <label>画布背景<input aria-label="画布背景" type="color" value={document.canvas.background} disabled={document.canvas.transparent} onChange={(event) => updateCanvas({ background: event.target.value })} /></label>
          <label className="inspector-check"><input aria-label="透明背景" type="checkbox" checked={document.canvas.transparent} onChange={(event) => updateCanvas({ transparent: event.target.checked })} />透明背景</label>
        </div>
      ) : !layer ? (
        <p className="editor-empty-note">选择一个图层后可调整位置、尺寸、旋转和样式。</p>
      ) : (
        <div className="inspector-form">
          {layer.locked && <p className="editor-lock-note" role="status">图层已锁定，请先在图层面板解锁。</p>}
          <label>图层名称<input aria-label="图层名称" value={layer.name} disabled={layer.locked} onChange={(event) => updateLayer({ name: event.target.value })} /></label>
          <div className="inspector-grid">
            <label>X<input aria-label="图层 X 坐标" type="number" value={layer.x} disabled={layer.locked} onChange={(event) => updateLayer({ x: numberValue(event.target.value, layer.x) })} /></label>
            <label>Y<input aria-label="图层 Y 坐标" type="number" value={layer.y} disabled={layer.locked} onChange={(event) => updateLayer({ y: numberValue(event.target.value, layer.y) })} /></label>
            <label>宽度<input aria-label="图层宽度" type="number" min="1" value={layer.width} disabled={layer.locked} onChange={(event) => updateLayer({ width: numberValue(event.target.value, layer.width) })} /></label>
            <label>高度<input aria-label="图层高度" type="number" min="1" value={layer.height} disabled={layer.locked} onChange={(event) => updateLayer({ height: numberValue(event.target.value, layer.height) })} /></label>
          </div>
          <label>旋转角度<input aria-label="图层旋转角度" type="number" value={layer.rotation} disabled={layer.locked} onChange={(event) => updateLayer({ rotation: numberValue(event.target.value, layer.rotation) })} /></label>
          <label>不透明度 <output>{Math.round(layer.opacity * 100)}%</output><input aria-label="图层不透明度" type="range" min="0" max="1" step="0.01" value={layer.opacity} disabled={layer.locked} onChange={(event) => updateLayer({ opacity: numberValue(event.target.value, layer.opacity) })} /></label>
          {layer.type === 'text' && <>
            <label>文字内容<textarea aria-label="文字内容" value={layer.text} disabled={layer.locked} onChange={(event) => updateLayer({ text: event.target.value } as Partial<EditorLayer>)} /></label>
            <label>字号<input aria-label="文字字号" type="number" min="1" value={layer.fontSize} disabled={layer.locked} onChange={(event) => updateLayer({ fontSize: numberValue(event.target.value, layer.fontSize) } as Partial<EditorLayer>)} /></label>
            <label>字体<input aria-label="文字字体" value={layer.fontFamily} disabled={layer.locked} onChange={(event) => updateLayer({ fontFamily: event.target.value } as Partial<EditorLayer>)} /></label>
            <label>文字颜色<input aria-label="文字颜色" type="color" value={layer.color} disabled={layer.locked} onChange={(event) => updateLayer({ color: event.target.value } as Partial<EditorLayer>)} /></label>
          </>}
          {(layer.type === 'rectangle' || layer.type === 'circle') && <>
            <label>填充颜色<input aria-label="填充颜色" type="color" value={layer.fill} disabled={layer.locked} onChange={(event) => updateLayer({ fill: event.target.value } as Partial<EditorLayer>)} /></label>
            <label>描边颜色<input aria-label="描边颜色" type="color" value={layer.stroke} disabled={layer.locked} onChange={(event) => updateLayer({ stroke: event.target.value } as Partial<EditorLayer>)} /></label>
            <label>描边宽度<input aria-label="描边宽度" type="number" min="0" value={layer.strokeWidth} disabled={layer.locked} onChange={(event) => updateLayer({ strokeWidth: numberValue(event.target.value, layer.strokeWidth) } as Partial<EditorLayer>)} /></label>
          </>}
          {layer.type === 'arrow' && <>
            <label>箭头颜色<input aria-label="箭头颜色" type="color" value={layer.color} disabled={layer.locked} onChange={(event) => updateLayer({ color: event.target.value } as Partial<EditorLayer>)} /></label>
            <label>线条宽度<input aria-label="箭头线条宽度" type="number" min="1" value={layer.strokeWidth} disabled={layer.locked} onChange={(event) => updateLayer({ strokeWidth: numberValue(event.target.value, layer.strokeWidth) } as Partial<EditorLayer>)} /></label>
          </>}
        </div>
      )}
    </div>
  );
}
