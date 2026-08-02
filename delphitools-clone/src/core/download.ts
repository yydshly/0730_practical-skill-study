function recoverableDownloadError(error: unknown): Error {
  const detail = error instanceof Error ? error.message : String(error);
  return new Error(`下载失败，请检查浏览器下载权限后重试：${detail}`);
}

export function sanitizeDownloadName(name: string, fallback: string): string {
  const cleaned = name.replace(/[\\/\u0000-\u001F\u007F]/g, '').trim();
  if (cleaned) return cleaned;
  const safeFallback = fallback.replace(/[\\/\u0000-\u001F\u007F]/g, '').trim();
  return safeFallback || '下载结果';
}

export function releaseObjectUrls(urls: Iterable<string>): void {
  for (const url of urls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // 某个 URL 已被浏览器释放时，仍需继续清理其余结果。
    }
  }
}

export function downloadBlob(blob: Blob, name: string): void {
  let objectUrl = '';
  let link: HTMLAnchorElement | undefined;
  let failure: unknown;

  try {
    objectUrl = URL.createObjectURL(blob);
    link = document.createElement('a');
    link.href = objectUrl;
    link.download = sanitizeDownloadName(name, '下载结果');
    link.style.display = 'none';
    document.body.append(link);
    link.click();
  } catch (error) {
    failure = error;
  } finally {
    link?.remove();
    if (objectUrl) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch (error) {
        failure ??= error;
      }
    }
  }

  if (failure) throw recoverableDownloadError(failure);
}
