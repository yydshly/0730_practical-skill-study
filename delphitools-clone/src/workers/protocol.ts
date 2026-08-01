export type WorkerProgressResponse = { id: string; type: 'progress'; progress: number; message: string };
export type WorkerSuccessResponse<T = unknown> = { id: string; type: 'success'; result: T };
export type WorkerErrorResponse = { id: string; type: 'error'; message: string };
export type WorkerCancelledResponse = { id: string; type: 'cancelled'; message: string };
export type WorkerResponse<T = unknown> = WorkerProgressResponse | WorkerSuccessResponse<T> | WorkerErrorResponse | WorkerCancelledResponse;

export function workerErrorResponse(id: string, reason: unknown): WorkerErrorResponse {
  return {
    id,
    type: 'error',
    message: reason instanceof Error ? reason.message : `处理失败：${String(reason)}`,
  };
}

export function workerProgressResponse(id: string, progress: number, message: string): WorkerProgressResponse {
  return { id, type: 'progress', progress: Math.max(0, Math.min(100, Math.round(progress))), message };
}
