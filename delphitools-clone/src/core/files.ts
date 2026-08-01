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

function readWithFileReader(file: File, method: 'readAsText' | 'readAsDataURL'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`读取文件失败，请重试：${reader.error?.message ?? '浏览器无法读取该文件'}`));
    reader.onload = () => resolve(String(reader.result));
    reader[method](file);
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return readWithFileReader(file, 'readAsDataURL');
}

export function readFileAsText(file: File): Promise<string> {
  return readWithFileReader(file, 'readAsText');
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  let objectUrl: string;
  try {
    objectUrl = URL.createObjectURL(file);
  } catch (error) {
    throw new Error(`无法创建图片预览，请重试：${error instanceof Error ? error.message : String(error)}`);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const release = () => URL.revokeObjectURL(objectUrl);
    image.onload = () => {
      release();
      resolve(image);
    };
    image.onerror = () => {
      release();
      reject(new Error('图片加载失败，请确认文件完整后重试'));
    };
    image.src = objectUrl;
  });
}
