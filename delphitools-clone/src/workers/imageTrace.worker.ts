import { traceImage, type TraceOptions } from '../engines/advancedImage';
import { workerErrorResponse, workerProgressResponse } from './protocol';

type Request = { id: string; type: 'trace-image'; payload: { width: number; height: number; data: ArrayBuffer; options: TraceOptions } } | { id: string; type: 'cancel' };
type WorkerScope = { onmessage: ((event: MessageEvent<Request>) => void) | null; postMessage: (message: unknown) => void };
const scope = self as unknown as WorkerScope;
const cancelled = new Set<string>();

scope.onmessage = (event) => {
  const request = event.data;
  if (request.type === 'cancel') {
    cancelled.add(request.id);
    scope.postMessage({ id: request.id, type: 'cancelled', message: '处理已取消' });
    return;
  }
  try {
    scope.postMessage(workerProgressResponse(request.id, 10, '正在读取图片像素'));
    if (cancelled.has(request.id)) throw new Error('处理已取消');
    const svg = traceImage(
      { width: request.payload.width, height: request.payload.height, data: new Uint8ClampedArray(request.payload.data) },
      request.payload.options,
    );
    scope.postMessage(workerProgressResponse(request.id, 100, 'SVG 路径已生成'));
    scope.postMessage({ id: request.id, type: 'success', result: { svg } });
  } catch (reason) {
    scope.postMessage(workerErrorResponse(request.id, reason));
  } finally {
    cancelled.delete(request.id);
  }
};
