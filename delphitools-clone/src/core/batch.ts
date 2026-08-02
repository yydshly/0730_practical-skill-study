export const DEFAULT_BATCH_MAX_FILES = 100;
export const DEFAULT_BATCH_MAX_BYTES = 50 * 1024 * 1024;
export const DEFAULT_BATCH_CONCURRENCY = 2;

export type BatchStatus = 'queued' | 'running' | 'success' | 'error';

export type BatchItem<T = unknown> = {
  id: string;
  file: File;
  status: BatchStatus;
  error?: string;
  result?: T;
};

export type RunBatchOptions = {
  concurrency?: number;
  maxFiles?: number;
  maxBytes?: number;
  signal?: AbortSignal;
};

function cancelledError(): string {
  return '操作已取消';
}

function asChineseError(reason: unknown): string {
  if (reason instanceof DOMException && reason.name === 'AbortError') return cancelledError();
  if (reason instanceof Error) return `处理失败：${reason.message}`;
  return '处理失败：发生未知错误';
}

function limit(value: number | undefined, fallback: number, maximum: number): number {
  if (!Number.isFinite(value) || value === undefined) return fallback;
  return Math.min(Math.max(1, Math.floor(value)), maximum);
}

function maxSizeError(maxBytes: number): string {
  if (maxBytes === DEFAULT_BATCH_MAX_BYTES) return '文件大小不能超过 50 MiB';
  return `文件大小不能超过 ${maxBytes} 字节`;
}

export async function runBatch<T>(
  files: readonly File[],
  worker: (file: File, signal: AbortSignal) => Promise<T>,
  options: RunBatchOptions = {},
): Promise<BatchItem<T>[]> {
  const maxFiles = limit(options.maxFiles, DEFAULT_BATCH_MAX_FILES, DEFAULT_BATCH_MAX_FILES);
  const maxBytes = limit(options.maxBytes, DEFAULT_BATCH_MAX_BYTES, DEFAULT_BATCH_MAX_BYTES);
  const concurrency = limit(options.concurrency, DEFAULT_BATCH_CONCURRENCY, DEFAULT_BATCH_CONCURRENCY);
  const signal = options.signal ?? new AbortController().signal;
  const items: BatchItem<T>[] = files.map((file, index) => ({ id: `batch-${index + 1}`, file, status: 'queued' }));
  const queue: number[] = [];

  for (const [index, item] of items.entries()) {
    if (index >= maxFiles) {
      item.status = 'error';
      item.error = `一次最多处理 ${maxFiles} 个文件`;
    } else if (item.file.size > maxBytes) {
      item.status = 'error';
      item.error = maxSizeError(maxBytes);
    } else {
      queue.push(index);
    }
  }

  const cancelQueued = () => {
    for (const index of queue) {
      const item = items[index];
      if (item.status === 'queued') {
        item.status = 'error';
        item.error = cancelledError();
      }
    }
  };

  const consume = async () => {
    while (queue.length > 0) {
      if (signal.aborted) {
        cancelQueued();
        return;
      }
      const index = queue.shift();
      if (index === undefined) return;
      const item = items[index];
      if (item.status !== 'queued') continue;
      item.status = 'running';
      try {
        const result = await worker(item.file, signal);
        if (signal.aborted) {
          item.status = 'error';
          item.error = cancelledError();
        } else {
          item.status = 'success';
          item.result = result;
        }
      } catch (reason) {
        item.status = 'error';
        item.error = signal.aborted ? cancelledError() : asChineseError(reason);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, () => consume()));
  if (signal.aborted) cancelQueued();
  return items;
}
