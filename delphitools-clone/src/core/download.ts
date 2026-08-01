function recoverableDownloadError(error: unknown): Error {
  const detail = error instanceof Error ? error.message : String(error);
  return new Error(`下载失败，请检查浏览器下载权限后重试：${detail}`);
}

export function downloadBlob(blob: Blob, name: string): void {
  let objectUrl = '';
  let link: HTMLAnchorElement | undefined;
  let failure: unknown;

  try {
    objectUrl = URL.createObjectURL(blob);
    link = document.createElement('a');
    link.href = objectUrl;
    link.download = name;
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
