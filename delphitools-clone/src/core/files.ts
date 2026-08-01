const IMAGE_EXTENSIONS = new Set(['avif', 'bmp', 'gif', 'ico', 'jpeg', 'jpg', 'png', 'svg', 'webp']);
const TEXT_EXTENSIONS = new Set(['csv', 'css', 'html', 'js', 'json', 'md', 'txt', 'xml', 'yaml', 'yml']);

function extensionOf(name: string): string {
  const lastDot = name.lastIndexOf('.');
  return lastDot === -1 ? '' : name.slice(lastDot + 1).toLowerCase();
}

function matchesMime(mimeType: string, accepted: string): boolean {
  const normalizedAccepted = accepted.toLowerCase();
  const normalizedMime = mimeType.toLowerCase();

  if (normalizedAccepted.endsWith('/*')) {
    return normalizedMime.startsWith(normalizedAccepted.slice(0, -1));
  }

  return normalizedMime === normalizedAccepted;
}

function matchesEmptyMimeByExtension(file: File, accepted: string): boolean {
  const extension = extensionOf(file.name);
  const normalizedAccepted = accepted.toLowerCase();

  if (normalizedAccepted.startsWith('.')) return normalizedAccepted.slice(1) === extension;
  if (normalizedAccepted === 'image/*') return IMAGE_EXTENSIONS.has(extension);
  if (normalizedAccepted === 'text/*') return TEXT_EXTENSIONS.has(extension);
  if (normalizedAccepted.startsWith('image/')) return normalizedAccepted.slice(6) === extension || (normalizedAccepted === 'image/jpeg' && extension === 'jpg');

  return false;
}

function acceptedFileMessage(accepted: string[]): string {
  if (accepted.some((type) => type.toLowerCase() === 'image/*' || type.toLowerCase().startsWith('image/'))) {
    return '请选择图片文件';
  }
  if (accepted.some((type) => type.toLowerCase() === 'text/*' || type.toLowerCase().startsWith('text/'))) {
    return '请选择文本文件';
  }
  return '文件类型不受支持，请选择允许的文件';
}

export function assertAcceptedFile(file: File, accepted: string[]): void {
  if (accepted.length === 0) return;

  const isAccepted = file.type
    ? accepted.some((type) => matchesMime(file.type, type))
    : accepted.some((type) => matchesEmptyMimeByExtension(file, type));

  if (!isAccepted) throw new Error(acceptedFileMessage(accepted));
}

function abortError(): DOMException {
  return new DOMException('操作已取消', 'AbortError');
}

function readWithFileReader(file: File, method: 'readAsText' | 'readAsDataURL', signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const reader = new FileReader();
    let settled = false;
    const cleanup = () => {
      reader.onload = null;
      reader.onerror = null;
      reader.onabort = null;
      signal?.removeEventListener('abort', handleSignalAbort);
    };
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const rejectAbort = () => finish(() => reject(abortError()));
    const handleSignalAbort = () => {
      try {
        reader.abort();
      } finally {
        rejectAbort();
      }
    };
    reader.onerror = () => finish(() => reject(new Error(`读取文件失败，请重试：${reader.error?.message ?? '浏览器无法读取该文件'}`)));
    reader.onabort = rejectAbort;
    reader.onload = () => finish(() => resolve(String(reader.result)));
    signal?.addEventListener('abort', handleSignalAbort, { once: true });
    try {
      reader[method](file);
    } catch (reason) {
      finish(() => reject(reason));
    }
  });
}

export function readFileAsDataUrl(file: File, signal?: AbortSignal): Promise<string> {
  return readWithFileReader(file, 'readAsDataURL', signal);
}

export function readFileAsText(file: File, signal?: AbortSignal): Promise<string> {
  return readWithFileReader(file, 'readAsText', signal);
}

export function loadImage(file: File, signal?: AbortSignal): Promise<HTMLImageElement> {
  let objectUrl: string;
  try {
    objectUrl = URL.createObjectURL(file);
  } catch (error) {
    throw new Error(`无法创建图片预览，请重试：${error instanceof Error ? error.message : String(error)}`);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      URL.revokeObjectURL(objectUrl);
    };
    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener('abort', handleAbort);
    };
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      release();
      callback();
    };
    const handleAbort = () => {
      image.src = '';
      finish(() => reject(abortError()));
    };
    image.onload = () => {
      finish(() => resolve(image));
    };
    image.onerror = () => {
      image.src = '';
      finish(() => reject(new Error('图片加载失败，请确认文件完整后重试')));
    };
    if (signal?.aborted) {
      handleAbort();
      return;
    }
    signal?.addEventListener('abort', handleAbort, { once: true });
    try {
      image.src = objectUrl;
    } catch (reason) {
      finish(() => reject(reason));
    }
  });
}
