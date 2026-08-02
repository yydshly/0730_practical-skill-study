import type { BatchItem } from '../core/batch';

type BatchProgressProps = {
  items: readonly BatchItem[];
  onCancel?: () => void;
  onDownload?: (item: BatchItem) => void;
  onDownloadAll?: () => void;
};

export function BatchProgress({ items, onCancel, onDownload, onDownloadAll }: BatchProgressProps) {
  const completed = items.filter((item) => item.status === 'success' || item.status === 'error').length;
  const failures = items.filter((item) => item.status === 'error').length;
  const successes = items.filter((item) => item.status === 'success');

  return (
    <section aria-label="批处理进度">
      <p role="status" aria-live="polite">已完成 {completed}/{items.length}，失败 {failures} 项</p>
      <div>
        {onCancel && <button type="button" onClick={onCancel}>取消处理</button>}
        {onDownloadAll && successes.length > 0 && <button type="button" onClick={onDownloadAll}>下载全部结果</button>}
      </div>
      <ul aria-label="批处理结果">
        {items.map((item) => (
          <li key={item.id}>
            <span>{item.file.name}</span>
            {item.status === 'success' && <span>处理完成</span>}
            {item.status === 'running' && <span>正在处理</span>}
            {item.status === 'queued' && <span>等待处理</span>}
            {item.error && <span role="alert">{item.error}</span>}
            {item.status === 'success' && onDownload && (
              <button type="button" aria-label={`下载 ${item.file.name}`} onClick={() => onDownload(item)}>下载</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
