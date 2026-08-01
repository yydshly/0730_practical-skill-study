function recoverableClipboardError(error: unknown): Error {
  const detail = error instanceof Error ? error.message : String(error);
  return new Error(`无法复制到剪贴板，请检查浏览器权限后重试：${detail}`);
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      throw recoverableClipboardError(error);
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();

  try {
    if (!document.execCommand('copy')) throw new Error('浏览器拒绝复制请求');
  } catch (error) {
    throw recoverableClipboardError(error);
  } finally {
    textarea.remove();
  }
}
