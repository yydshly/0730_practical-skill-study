import type { EditorAction, EditorDocument, EditorLayer } from '../../engines/editor';

type LayerPanelProps = {
  document: EditorDocument;
  dispatch: (action: EditorAction) => void;
};

const TYPE_LABELS: Record<EditorLayer['type'], string> = {
  image: '图片',
  text: '文字',
  rectangle: '矩形',
  circle: '圆形',
  arrow: '箭头',
};

export function LayerPanel({ document, dispatch }: LayerPanelProps) {
  const layers = [...document.layers].reverse();
  return (
    <div className="editor-panel__body">
      <div className="editor-panel__heading">
        <div><span className="editor-panel__eyebrow">LAYERS</span><h2>图层</h2></div>
        <span>{document.layers.length} 个</span>
      </div>
      {layers.length === 0 ? <p className="editor-empty-note">画布还没有图层</p> : (
        <ul className="editor-layer-list" aria-label="图层列表">
          {layers.map((layer) => {
            const selected = layer.id === document.selectedLayerId;
            return (
              <li key={layer.id} className={selected ? 'editor-layer-item editor-layer-item--selected' : 'editor-layer-item'}>
                <button
                  type="button"
                  className="editor-layer-item__select"
                  aria-label={`选择 ${layer.name}`}
                  aria-pressed={selected}
                  onClick={() => dispatch({ type: 'select', id: layer.id })}
                >
                  <span aria-hidden="true" className={`editor-layer-icon editor-layer-icon--${layer.type}`}>{TYPE_LABELS[layer.type].slice(0, 1)}</span>
                  <span><strong>{layer.name}</strong><small>{TYPE_LABELS[layer.type]} · {Math.round(layer.width)} × {Math.round(layer.height)}</small></span>
                </button>
                <div className="editor-layer-item__actions">
                  <button type="button" aria-label={`置顶 ${layer.name}`} onClick={() => dispatch({ type: 'reorder', id: layer.id, direction: 'front' })}>⇈</button>
                  <button type="button" aria-label={`上移 ${layer.name}`} onClick={() => dispatch({ type: 'reorder', id: layer.id, direction: 'forward' })}>↑</button>
                  <button type="button" aria-label={`下移 ${layer.name}`} onClick={() => dispatch({ type: 'reorder', id: layer.id, direction: 'backward' })}>↓</button>
                  <button type="button" aria-label={`置底 ${layer.name}`} onClick={() => dispatch({ type: 'reorder', id: layer.id, direction: 'back' })}>⇊</button>
                  <button type="button" aria-label={`${layer.hidden ? '显示' : '隐藏'} ${layer.name}`} aria-pressed={layer.hidden} onClick={() => dispatch({ type: 'toggle-hidden', id: layer.id })}>{layer.hidden ? '◌' : '◉'}</button>
                  <button type="button" aria-label={`${layer.locked ? '解锁' : '锁定'} ${layer.name}`} aria-pressed={layer.locked} onClick={() => dispatch({ type: 'toggle-lock', id: layer.id })}>{layer.locked ? '🔒' : '⌁'}</button>
                  <button type="button" aria-label={`删除 ${layer.name}`} onClick={() => dispatch({ type: 'delete', id: layer.id })}>×</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
