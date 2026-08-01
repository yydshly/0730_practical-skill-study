export const HISTORY_LIMIT = 50;

export type EditorCanvas = {
  width: number;
  height: number;
  background: string;
  transparent: boolean;
};

type LayerBase = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  hidden: boolean;
  locked: boolean;
};

export type ImageLayer = LayerBase & { type: 'image'; source: string };
export type TextLayer = LayerBase & {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: CanvasTextAlign;
};
export type ShapeLayer = LayerBase & {
  type: 'rectangle' | 'circle';
  fill: string;
  stroke: string;
  strokeWidth: number;
};
export type ArrowLayer = LayerBase & {
  type: 'arrow';
  color: string;
  strokeWidth: number;
};

export type EditorLayer = ImageLayer | TextLayer | ShapeLayer | ArrowLayer;
export type EditorLayerType = EditorLayer['type'];
export type ReorderDirection = 'forward' | 'backward' | 'front' | 'back';

type Snapshot = {
  canvas: EditorCanvas;
  layers: EditorLayer[];
  selectedLayerId: string | null;
  nextLayerNumber: number;
};

export type EditorDocument = Snapshot & {
  history: Snapshot[];
  future: Snapshot[];
};

export type EditorLayerInput = {
  id?: string;
  type: EditorLayerType;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  hidden?: boolean;
  locked?: boolean;
  source?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  align?: CanvasTextAlign;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

export type EditorAction =
  | ({ type: 'add'; layerType: EditorLayerType } & Omit<EditorLayerInput, 'type'>)
  | { type: 'select'; id: string | null }
  | { type: 'move'; id: string; x: number; y: number; source?: 'canvas' | 'inspector' }
  | { type: 'resize'; id: string; width: number; height: number; x?: number; y?: number; source?: 'canvas' | 'inspector' }
  | { type: 'rotate'; id: string; rotation: number; source?: 'canvas' | 'inspector' }
  | { type: 'update'; id: string; changes: Partial<EditorLayer>; source?: 'canvas' | 'inspector' }
  | { type: 'toggle-hidden'; id: string }
  | { type: 'toggle-lock'; id: string }
  | { type: 'delete'; id: string }
  | { type: 'reorder'; id: string; direction: ReorderDirection }
  | { type: 'set-canvas'; canvas: Partial<EditorCanvas> }
  | { type: 'undo' }
  | { type: 'redo' };

type RenderOptions = {
  canvasFactory?: () => HTMLCanvasElement;
  imageLoader?: (source: string) => Promise<CanvasImageSource>;
};

const TYPE_NAMES: Record<EditorLayerType, string> = {
  image: '图片',
  text: '文字',
  rectangle: '矩形',
  circle: '圆形',
  arrow: '箭头',
};

function finite(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function rounded(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizedDimension(value: number | undefined, fallback: number): number {
  return rounded(Math.max(1, finite(value, fallback)));
}

function normalizedRotation(value: number | undefined, fallback = 0): number {
  const rotation = finite(value, fallback) % 360;
  return rounded(rotation < 0 ? rotation + 360 : rotation);
}

function normalizedOpacity(value: number | undefined, fallback = 1): number {
  return rounded(Math.min(1, Math.max(0, finite(value, fallback))));
}

function normalizeColor(value: string | undefined, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function createLayer(input: EditorLayerInput, fallbackId: string, index = 0): EditorLayer {
  const id = input.id?.trim() || fallbackId;
  const base: LayerBase = {
    id,
    name: input.name?.trim() || `${TYPE_NAMES[input.type]} ${index + 1}`,
    x: rounded(finite(input.x, 80 + index * 18)),
    y: rounded(finite(input.y, 80 + index * 18)),
    width: normalizedDimension(input.width, input.type === 'text' ? 240 : 160),
    height: normalizedDimension(input.height, input.type === 'text' ? 64 : 120),
    rotation: normalizedRotation(input.rotation),
    opacity: normalizedOpacity(input.opacity),
    hidden: Boolean(input.hidden),
    locked: Boolean(input.locked),
  };

  if (input.type === 'image') return { ...base, type: 'image', source: input.source ?? '' };
  if (input.type === 'text') {
    return {
      ...base,
      type: 'text',
      text: input.text ?? '双击编辑文字',
      fontSize: normalizedDimension(input.fontSize, 36),
      fontFamily: input.fontFamily?.trim() || 'Microsoft YaHei, sans-serif',
      color: normalizeColor(input.color, '#18231d'),
      align: input.align ?? 'left',
    };
  }
  if (input.type === 'arrow') {
    return {
      ...base,
      type: 'arrow',
      color: normalizeColor(input.color, '#236644'),
      strokeWidth: normalizedDimension(input.strokeWidth, 6),
    };
  }
  return {
    ...base,
    type: input.type,
    fill: normalizeColor(input.fill, input.type === 'circle' ? '#d8f3dc' : '#dbeafe'),
    stroke: normalizeColor(input.stroke, '#236644'),
    strokeWidth: normalizedDimension(input.strokeWidth, 2),
  };
}

function cloneLayer(layer: EditorLayer): EditorLayer {
  return { ...layer } as EditorLayer;
}

function snapshot(document: EditorDocument): Snapshot {
  return {
    canvas: { ...document.canvas },
    layers: document.layers.map(cloneLayer),
    selectedLayerId: document.selectedLayerId,
    nextLayerNumber: document.nextLayerNumber,
  };
}

function restore(current: EditorDocument, value: Snapshot, history: Snapshot[], future: Snapshot[]): EditorDocument {
  return {
    canvas: { ...value.canvas },
    layers: value.layers.map(cloneLayer),
    selectedLayerId: value.selectedLayerId,
    nextLayerNumber: value.nextLayerNumber,
    history,
    future,
  };
}

function commit(document: EditorDocument, next: Snapshot): EditorDocument {
  const history = [...document.history, snapshot(document)].slice(-HISTORY_LIMIT);
  return restore(document, next, history, []);
}

function updateLayer(document: EditorDocument, id: string, updater: (layer: EditorLayer) => EditorLayer, source: 'canvas' | 'inspector' = 'inspector'): EditorDocument {
  const index = document.layers.findIndex((layer) => layer.id === id);
  if (index < 0 || (source === 'canvas' && document.layers[index].locked)) return document;
  const layers = document.layers.map((layer, layerIndex) => layerIndex === index ? updater(layer) : cloneLayer(layer));
  if (JSON.stringify(layers[index]) === JSON.stringify(document.layers[index])) return document;
  return commit(document, { ...snapshot(document), layers });
}

export function createDocument(inputs: EditorLayerInput[] = [], canvas: Partial<EditorCanvas> = {}): EditorDocument {
  const usedIds = new Set<string>();
  const layers = inputs.map((input, index) => {
    let fallbackId = `layer-${index + 1}`;
    while (usedIds.has(input.id?.trim() || fallbackId)) fallbackId = `layer-${index + 2}`;
    const layer = createLayer(input, fallbackId, index);
    usedIds.add(layer.id);
    return layer;
  });
  return {
    canvas: {
      width: Math.round(Math.min(8192, normalizedDimension(canvas.width, 1200))),
      height: Math.round(Math.min(8192, normalizedDimension(canvas.height, 800))),
      background: normalizeColor(canvas.background, '#ffffff'),
      transparent: Boolean(canvas.transparent),
    },
    layers,
    selectedLayerId: null,
    nextLayerNumber: layers.length + 1,
    history: [],
    future: [],
  };
}

export function editorReducer(document: EditorDocument, action: EditorAction): EditorDocument {
  if (action.type === 'undo') return undo(document);
  if (action.type === 'redo') return redo(document);
  if (action.type === 'select') {
    const selectedLayerId = action.id && document.layers.some((layer) => layer.id === action.id) ? action.id : null;
    return selectedLayerId === document.selectedLayerId ? document : { ...document, selectedLayerId };
  }
  if (action.type === 'add') {
    let id = action.id?.trim() || `layer-${document.nextLayerNumber}`;
    let counter = document.nextLayerNumber;
    while (document.layers.some((layer) => layer.id === id)) id = `layer-${++counter}`;
    const layer = createLayer({ ...action, id, type: action.layerType }, id, document.layers.length);
    return commit(document, {
      ...snapshot(document),
      layers: [...document.layers.map(cloneLayer), layer],
      selectedLayerId: layer.id,
      nextLayerNumber: counter + 1,
    });
  }
  if (action.type === 'move') {
    return updateLayer(document, action.id, (layer) => ({
      ...layer,
      x: rounded(finite(action.x, layer.x)),
      y: rounded(finite(action.y, layer.y)),
    }), action.source);
  }
  if (action.type === 'resize') {
    return updateLayer(document, action.id, (layer) => ({
      ...layer,
      x: rounded(finite(action.x, layer.x)),
      y: rounded(finite(action.y, layer.y)),
      width: normalizedDimension(action.width, layer.width),
      height: normalizedDimension(action.height, layer.height),
    }), action.source);
  }
  if (action.type === 'rotate') {
    return updateLayer(document, action.id, (layer) => ({ ...layer, rotation: normalizedRotation(action.rotation, layer.rotation) }), action.source);
  }
  if (action.type === 'update') {
    return updateLayer(document, action.id, (layer) => {
      const changes = action.changes as Partial<EditorLayer>;
      return {
        ...layer,
        ...changes,
        id: layer.id,
        type: layer.type,
        x: rounded(finite(changes.x, layer.x)),
        y: rounded(finite(changes.y, layer.y)),
        width: normalizedDimension(changes.width, layer.width),
        height: normalizedDimension(changes.height, layer.height),
        rotation: normalizedRotation(changes.rotation, layer.rotation),
        opacity: normalizedOpacity(changes.opacity, layer.opacity),
      } as EditorLayer;
    }, action.source);
  }
  if (action.type === 'toggle-hidden') return updateLayer(document, action.id, (layer) => ({ ...layer, hidden: !layer.hidden }));
  if (action.type === 'toggle-lock') return updateLayer(document, action.id, (layer) => ({ ...layer, locked: !layer.locked }));
  if (action.type === 'delete') {
    if (!document.layers.some((layer) => layer.id === action.id)) return document;
    return commit(document, {
      ...snapshot(document),
      layers: document.layers.filter((layer) => layer.id !== action.id).map(cloneLayer),
      selectedLayerId: document.selectedLayerId === action.id ? null : document.selectedLayerId,
    });
  }
  if (action.type === 'reorder') {
    const index = document.layers.findIndex((layer) => layer.id === action.id);
    if (index < 0) return document;
    const target = action.direction === 'front'
      ? document.layers.length - 1
      : action.direction === 'back'
        ? 0
        : action.direction === 'forward'
          ? Math.min(document.layers.length - 1, index + 1)
          : Math.max(0, index - 1);
    if (target === index) return document;
    const layers = document.layers.map(cloneLayer);
    const [layer] = layers.splice(index, 1);
    layers.splice(target, 0, layer);
    return commit(document, { ...snapshot(document), layers });
  }
  const canvas = {
    width: Math.round(Math.min(8192, normalizedDimension(action.canvas.width, document.canvas.width))),
    height: Math.round(Math.min(8192, normalizedDimension(action.canvas.height, document.canvas.height))),
    background: normalizeColor(action.canvas.background, document.canvas.background),
    transparent: action.canvas.transparent ?? document.canvas.transparent,
  };
  if (JSON.stringify(canvas) === JSON.stringify(document.canvas)) return document;
  return commit(document, { ...snapshot(document), canvas });
}

export function addImageLayer(document: EditorDocument, input: Omit<EditorLayerInput, 'type'> & { source: string }): EditorDocument {
  return editorReducer(document, { type: 'add', layerType: 'image', ...input });
}

export function moveLayer(document: EditorDocument, id: string, x: number, y: number, options: { source?: 'canvas' | 'inspector' } = {}): EditorDocument {
  return editorReducer(document, { type: 'move', id, x, y, source: options.source });
}

export function resizeLayer(document: EditorDocument, id: string, width: number, height: number, options: { source?: 'canvas' | 'inspector'; x?: number; y?: number } = {}): EditorDocument {
  return editorReducer(document, { type: 'resize', id, width, height, x: options.x, y: options.y, source: options.source });
}

export function rotateLayer(document: EditorDocument, id: string, rotation: number, options: { source?: 'canvas' | 'inspector' } = {}): EditorDocument {
  return editorReducer(document, { type: 'rotate', id, rotation, source: options.source });
}

export function reorderLayer(document: EditorDocument, id: string, direction: ReorderDirection): EditorDocument {
  return editorReducer(document, { type: 'reorder', id, direction });
}

export function undo(document: EditorDocument): EditorDocument {
  const previous = document.history[document.history.length - 1];
  if (!previous) return document;
  return restore(document, previous, document.history.slice(0, -1), [...document.future, snapshot(document)].slice(-HISTORY_LIMIT));
}

export function redo(document: EditorDocument): EditorDocument {
  const next = document.future[document.future.length - 1];
  if (!next) return document;
  return restore(document, next, [...document.history, snapshot(document)].slice(-HISTORY_LIMIT), document.future.slice(0, -1));
}

function loadRenderableImage(source: string): Promise<{ image: HTMLImageElement; release: () => void }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const release = () => {
      image.onload = null;
      image.onerror = null;
      image.src = '';
    };
    if (/^https?:/i.test(source)) image.crossOrigin = 'anonymous';
    image.onload = () => resolve({ image, release });
    image.onerror = () => {
      release();
      reject(new Error('浏览器无法解码图片'));
    };
    image.src = source;
  });
}

function drawLayer(context: CanvasRenderingContext2D, layer: Exclude<EditorLayer, ImageLayer>, image?: CanvasImageSource): void {
  context.save();
  context.globalAlpha = layer.opacity;
  context.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
  context.rotate(layer.rotation * Math.PI / 180);
  if (layer.type === 'text') {
    context.fillStyle = layer.color;
    context.font = `${layer.fontSize}px ${layer.fontFamily}`;
    context.textAlign = layer.align;
    context.textBaseline = 'top';
    const x = layer.align === 'center' ? 0 : layer.align === 'right' ? layer.width / 2 : -layer.width / 2;
    context.fillText(layer.text, x, -layer.height / 2, layer.width);
  } else if (layer.type === 'rectangle') {
    context.fillStyle = layer.fill;
    context.strokeStyle = layer.stroke;
    context.lineWidth = layer.strokeWidth;
    context.fillRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
    if (layer.strokeWidth > 0) context.strokeRect(-layer.width / 2, -layer.height / 2, layer.width, layer.height);
  } else if (layer.type === 'circle') {
    context.beginPath();
    context.ellipse(0, 0, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2);
    context.fillStyle = layer.fill;
    context.fill();
    if (layer.strokeWidth > 0) {
      context.strokeStyle = layer.stroke;
      context.lineWidth = layer.strokeWidth;
      context.stroke();
    }
  } else if (layer.type === 'arrow') {
    const half = layer.width / 2;
    context.beginPath();
    context.moveTo(-half, 0);
    context.lineTo(half, 0);
    context.moveTo(half, 0);
    context.lineTo(half - Math.min(24, layer.width / 4), -Math.min(16, layer.height / 2));
    context.moveTo(half, 0);
    context.lineTo(half - Math.min(24, layer.width / 4), Math.min(16, layer.height / 2));
    context.strokeStyle = layer.color;
    context.lineWidth = layer.strokeWidth;
    context.stroke();
  } else if (image) {
    context.drawImage(image, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
  }
  context.restore();
}

function encodePng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob || blob.type !== 'image/png') {
          reject(new Error('当前浏览器无法真实编码 PNG，请换用支持 Canvas 的浏览器'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : String(reason);
      reject(new Error(`PNG 导出失败，画布可能包含不允许跨域读取的图片：${detail}`));
    }
  });
}

export async function renderDocument(document: EditorDocument, options: RenderOptions = {}): Promise<Blob> {
  const canvas = options.canvasFactory?.() ?? window.document.createElement('canvas');
  canvas.width = document.canvas.width;
  canvas.height = document.canvas.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器无法创建 Canvas 画布');
  if (document.canvas.transparent) context.clearRect(0, 0, canvas.width, canvas.height);
  else {
    context.fillStyle = document.canvas.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  for (const layer of document.layers) {
    if (layer.hidden) continue;
    if (layer.type === 'image') {
      try {
        if (options.imageLoader) {
          const image = await options.imageLoader(layer.source);
          drawLayer(context, layer as never, image);
        } else {
          const resource = await loadRenderableImage(layer.source);
          try {
            drawLayer(context, layer as never, resource.image);
          } finally {
            resource.release();
          }
        }
      } catch (reason) {
        const detail = reason instanceof Error ? reason.message : String(reason);
        throw new Error(`图片图层“${layer.name}”解码失败，请重新导入本地图片：${detail}`);
      }
    } else drawLayer(context, layer);
  }
  return encodePng(canvas);
}
