import { removeBackground, type BackgroundOptions } from '../engines/pdf';
import { workerErrorResponse, workerProgressResponse } from './protocol';

type Request = { id: string; type: 'remove-background'; payload: { width: number; height: number; data: ArrayBuffer; options: BackgroundOptions } } | { id: string; type: 'cancel' };
type WorkerScope = { onmessage: ((event: MessageEvent<Request>) => void) | null; postMessage: (message: unknown, transfer?: Transferable[]) => void };
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
    scope.postMessage(workerProgressResponse(request.id, 5, '本地颜色分割器已加载'));
    const result = removeBackground(
      { width: request.payload.width, height: request.payload.height, data: new Uint8ClampedArray(request.payload.data) },
      request.payload.options,
      (progress) => {
        if (cancelled.has(request.id)) throw new Error('处理已取消');
        scope.postMessage(workerProgressResponse(request.id, progress, '正在按边缘背景颜色分割'));
      },
    );
    if (cancelled.has(request.id)) throw new Error('处理已取消');
    scope.postMessage({ id: request.id, type: 'success', result: { width: result.width, height: result.height, data: result.data.buffer } }, [result.data.buffer]);
  } catch (reason) {
    scope.postMessage(workerErrorResponse(request.id, reason));
  } finally {
    cancelled.delete(request.id);
  }
};
