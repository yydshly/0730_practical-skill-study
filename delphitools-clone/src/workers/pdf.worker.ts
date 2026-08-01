import { createZinePdf, imposePdf, preflightPdf, type ImposeOptions, type NUpOptions } from '../engines/pdf';
import { workerErrorResponse, workerProgressResponse } from './protocol';

type Request =
  | { id: string; type: 'preflight'; payload: { bytes: ArrayBuffer } }
  | { id: string; type: 'impose'; payload: { bytes: ArrayBuffer; options: ImposeOptions } }
  | { id: string; type: 'zine'; payload: { bytes: ArrayBuffer; options: Pick<NUpOptions, 'paper' | 'orientation' | 'margin' | 'gap'> } };
type WorkerScope = { onmessage: ((event: MessageEvent<Request>) => void) | null; postMessage: (message: unknown, transfer?: Transferable[]) => void };
const scope = self as unknown as WorkerScope;

scope.onmessage = async (event) => {
  const request = event.data;
  try {
    scope.postMessage(workerProgressResponse(request.id, 10, '正在读取 PDF 结构'));
    const bytes = new Uint8Array(request.payload.bytes);
    if (request.type === 'preflight') {
      const result = await preflightPdf(bytes);
      scope.postMessage({ id: request.id, type: 'success', result });
      return;
    }
    const output = request.type === 'impose'
      ? await imposePdf(bytes, request.payload.options)
      : await createZinePdf(bytes, request.payload.options);
    scope.postMessage(workerProgressResponse(request.id, 100, 'PDF 已生成'));
    const buffer = output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength) as ArrayBuffer;
    scope.postMessage({ id: request.id, type: 'success', result: { bytes: buffer } }, [buffer]);
  } catch (reason) {
    scope.postMessage(workerErrorResponse(request.id, reason));
  }
};
