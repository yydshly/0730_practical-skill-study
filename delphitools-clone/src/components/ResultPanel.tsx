import { useState } from 'react';

import { copyText } from '../core/clipboard';
import { downloadBlob } from '../core/download';
import { StatusMessage } from './StatusMessage';

type ResultPanelProps = {
  text?: string;
  copyLabel?: string;
  download?: { blob: Blob; name: string; label?: string };
  onReset?: () => void;
  localOnly?: boolean;
  children?: React.ReactNode;
};

type OperationState = { status: 'success' | 'error'; message: string } | null;

export function ResultPanel({ text, copyLabel = '复制结果', download, onReset, localOnly = false, children }: ResultPanelProps) {
  const [operation, setOperation] = useState<OperationState>(null);

  const handleCopy = async () => {
    if (text === undefined) return;
    try {
      await copyText(text);
      setOperation({ status: 'success', message: '已复制到剪贴板' });
    } catch (error) {
      setOperation({ status: 'error', message: error instanceof Error ? error.message : '复制失败，请重试' });
    }
  };

  const handleDownload = () => {
    if (!download) return;
    try {
      downloadBlob(download.blob, download.name);
      setOperation({ status: 'success', message: '已开始下载文件' });
    } catch (error) {
      setOperation({ status: 'error', message: error instanceof Error ? error.message : '下载失败，请重试' });
    }
  };

  return (
    <section className="result-panel" aria-label="处理结果">
      {localOnly && <p className="result-panel__local-note">仅在本地处理</p>}
      {children}
      <div className="result-panel__actions">
        {text !== undefined && <button type="button" onClick={handleCopy}>{copyLabel}</button>}
        {download && <button type="button" onClick={handleDownload}>{download.label ?? '下载文件'}</button>}
        {onReset && <button type="button" onClick={onReset}>重新开始</button>}
      </div>
      {operation && <StatusMessage status={operation.status} message={operation.message} />}
    </section>
  );
}
