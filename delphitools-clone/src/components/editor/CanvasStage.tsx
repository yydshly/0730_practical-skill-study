import { useEffect, useRef } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';

import type { EditorAction, EditorDocument, EditorLayer } from '../../engines/editor';

type Point = { clientX: number; clientY: number };
type CanvasSize = { width: number; height: number };
type HandleDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

type CanvasStageProps = {
  document: EditorDocument;
  dispatch: (action: EditorAction) => void;
};

type DragState =
  | { kind: 'move'; id: string; start: { x: number; y: number }; layer: EditorLayer }
  | { kind: 'resize'; id: string; direction: HandleDirection; start: { x: number; y: number }; layer: EditorLayer }
  | { kind: 'rotate'; id: string; startAngle: number; layer: EditorLayer };

const HANDLES: Array<{ direction: HandleDirection; label: string }> = [
  { direction: 'nw', label: '左上' }, { direction: 'n', label: '上方' }, { direction: 'ne', label: '右上' },
  { direction: 'e', label: '右侧' }, { direction: 'se', label: '右下' }, { direction: 's', label: '下方' },
  { direction: 'sw', label: '左下' }, { direction: 'w', label: '左侧' },
];

export function clientPointToCanvas(rect: DOMRect, canvas: CanvasSize, point: Point, _devicePixelRatio = 1): { x: number; y: number } {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
  return {
    x: Math.round((point.clientX - rect.left) * canvas.width / rect.width * 100) / 100,
    y: Math.round((point.clientY - rect.top) * canvas.height / rect.height * 100) / 100,
  };
}

function layerStyle(layer: EditorLayer, canvas: CanvasSize): CSSProperties {
  return {
    left: `${layer.x / canvas.width * 100}%`,
    top: `${layer.y / canvas.height * 100}%`,
    width: `${layer.width / canvas.width * 100}%`,
    height: `${layer.height / canvas.height * 100}%`,
    opacity: layer.opacity,
    transform: `rotate(${layer.rotation}deg)`,
  };
}

function isEditingTarget(target: EventTarget | null): boolean {
  const element = target instanceof HTMLElement ? target : null;
  return Boolean(element?.closest('input, textarea, select, [contenteditable="true"]'));
}

function LayerVisual({ layer }: { layer: EditorLayer }) {
  if (layer.type === 'image') return <img src={layer.source} alt="" draggable={false} />;
  if (layer.type === 'text') return <span style={{ color: layer.color, fontFamily: layer.fontFamily, fontSize: `${Math.max(10, layer.fontSize / 2)}px`, textAlign: layer.align }}>{layer.text}</span>;
  if (layer.type === 'rectangle') return <span className="editor-shape editor-shape--rectangle" style={{ background: layer.fill, borderColor: layer.stroke, borderWidth: layer.strokeWidth }} />;
  if (layer.type === 'circle') return <span className="editor-shape editor-shape--circle" style={{ background: layer.fill, borderColor: layer.stroke, borderWidth: layer.strokeWidth }} />;
  if (layer.type === 'arrow') return <span className="editor-arrow" style={{ color: layer.color, borderTopWidth: layer.strokeWidth }}><i style={{ borderLeftColor: layer.color }} /></span>;
  return null;
}

export function CanvasStage({ document, dispatch }: CanvasStageProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const selected = document.layers.find((layer) => layer.id === document.selectedLayerId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(document.canvas.width * ratio));
    canvas.height = Math.max(1, Math.round(document.canvas.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform?.(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, document.canvas.width, document.canvas.height);
    if (!document.canvas.transparent) {
      context.fillStyle = document.canvas.background;
      context.fillRect(0, 0, document.canvas.width, document.canvas.height);
    }
  }, [document.canvas]);

  const point = (event: Point) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    return rect ? clientPointToCanvas(rect, document.canvas, event, window.devicePixelRatio) : { x: 0, y: 0 };
  };

  const beginMove = (event: ReactPointerEvent, layer: EditorLayer) => {
    event.stopPropagation();
    dispatch({ type: 'select', id: layer.id });
    if (layer.locked) return;
    dragRef.current = { kind: 'move', id: layer.id, start: point(event), layer: { ...layer } };
  };

  const beginResize = (event: ReactPointerEvent, direction: HandleDirection, layer: EditorLayer) => {
    event.stopPropagation();
    dragRef.current = { kind: 'resize', id: layer.id, direction, start: point(event), layer: { ...layer } };
  };

  const beginRotate = (event: ReactPointerEvent, layer: EditorLayer) => {
    event.stopPropagation();
    const current = point(event);
    const center = { x: layer.x + layer.width / 2, y: layer.y + layer.height / 2 };
    dragRef.current = { kind: 'rotate', id: layer.id, startAngle: Math.atan2(current.y - center.y, current.x - center.x) * 180 / Math.PI - layer.rotation, layer: { ...layer } };
  };

  const handlePointerMove = (event: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const current = point(event);
    if (drag.kind === 'move') {
      dispatch({ type: 'move', id: drag.id, x: drag.layer.x + current.x - drag.start.x, y: drag.layer.y + current.y - drag.start.y, source: 'canvas' });
      return;
    }
    if (drag.kind === 'rotate') {
      const center = { x: drag.layer.x + drag.layer.width / 2, y: drag.layer.y + drag.layer.height / 2 };
      const angle = Math.atan2(current.y - center.y, current.x - center.x) * 180 / Math.PI;
      dispatch({ type: 'rotate', id: drag.id, rotation: angle - drag.startAngle, source: 'canvas' });
      return;
    }
    const dx = current.x - drag.start.x;
    const dy = current.y - drag.start.y;
    const west = drag.direction.includes('w');
    const east = drag.direction.includes('e');
    const north = drag.direction.includes('n');
    const south = drag.direction.includes('s');
    const width = west ? drag.layer.width - dx : east ? drag.layer.width + dx : drag.layer.width;
    const height = north ? drag.layer.height - dy : south ? drag.layer.height + dy : drag.layer.height;
    dispatch({
      type: 'resize', id: drag.id, width, height,
      x: west ? drag.layer.x + dx : drag.layer.x,
      y: north ? drag.layer.y + dy : drag.layer.y,
      source: 'canvas',
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isEditingTarget(event.target) || !selected) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      dispatch({ type: 'delete', id: selected.id });
      return;
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) || selected.locked) return;
    event.preventDefault();
    const step = event.shiftKey ? 10 : 1;
    dispatch({
      type: 'move', id: selected.id,
      x: selected.x + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0),
      y: selected.y + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0),
      source: 'canvas',
    });
  };

  return (
    <div className="editor-stage" role="application" aria-label="Substrata 画布编辑区" tabIndex={0} onKeyDown={handleKeyDown}>
      <div
        ref={surfaceRef}
        className={document.canvas.transparent ? 'editor-stage__surface editor-stage__surface--transparent' : 'editor-stage__surface'}
        style={{ aspectRatio: `${document.canvas.width} / ${document.canvas.height}` }}
        onPointerMove={handlePointerMove}
        onPointerUp={() => { dragRef.current = null; }}
        onPointerCancel={() => { dragRef.current = null; }}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget || event.target === canvasRef.current) dispatch({ type: 'select', id: null });
        }}
      >
        <canvas ref={canvasRef} aria-label={`画布 ${document.canvas.width} × ${document.canvas.height}`} />
        {document.layers.filter((layer) => !layer.hidden).map((layer) => (
          <button
            key={layer.id}
            type="button"
            className={layer.id === document.selectedLayerId ? 'editor-layer-hit editor-layer-hit--selected' : 'editor-layer-hit'}
            style={layerStyle(layer, document.canvas)}
            aria-label={`在画布选择 ${layer.name}`}
            aria-pressed={layer.id === document.selectedLayerId}
            onPointerDown={(event) => beginMove(event, layer)}
          >
            <LayerVisual layer={layer} />
          </button>
        ))}
        {selected && !selected.hidden && !selected.locked && <div className="editor-selection" style={layerStyle(selected, document.canvas)} role="group" aria-label="图层变换手柄">
          {HANDLES.map(({ direction, label }) => <button key={direction} type="button" className={`editor-handle editor-handle--${direction}`} aria-label={`${label}缩放手柄`} onPointerDown={(event) => beginResize(event, direction, selected)} />)}
          <button type="button" className="editor-rotate-handle" aria-label="旋转手柄" onPointerDown={(event) => beginRotate(event, selected)}>↻</button>
        </div>}
      </div>
      <p className="editor-stage__meta">{document.canvas.width} × {document.canvas.height} · {document.canvas.transparent ? '透明背景' : document.canvas.background}</p>
    </div>
  );
}
