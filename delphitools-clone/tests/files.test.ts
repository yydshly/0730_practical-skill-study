/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  assertAcceptedFile,
  loadImage,
  readFileAsDataUrl,
  readFileAsText,
} from '../src/core/files';
import { copyText } from '../src/core/clipboard';
import { downloadBlob } from '../src/core/download';

const originalClipboard = navigator.clipboard;
const originalCreateObjectUrl = URL.createObjectURL;
const originalRevokeObjectUrl = URL.revokeObjectURL;
const originalImage = globalThis.Image;
const originalExecCommand = document.execCommand;

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: originalClipboard });
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreateObjectUrl });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevokeObjectUrl });
  Object.defineProperty(document, 'execCommand', { configurable: true, value: originalExecCommand });
  vi.stubGlobal('Image', originalImage);
  document.body.replaceChildren();
});

describe('本地文件工具', () => {
  it('图片上传拒绝非图片文件并返回中文错误', () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });

    expect(() => assertAcceptedFile(file, ['image/*'])).toThrow('请选择图片文件');
  });

  it('接受精确匹配的 MIME 类型', () => {
    const file = new File(['{}'], 'data.json', { type: 'application/json' });

    expect(() => assertAcceptedFile(file, ['application/json'])).not.toThrow();
  });

  it('接受通配 MIME 类型', () => {
    const file = new File(['png'], 'photo.png', { type: 'image/png' });

    expect(() => assertAcceptedFile(file, ['image/*'])).not.toThrow();
  });

  it('仅在 MIME 为空时按图片扩展名回退', () => {
    const unknownImage = new File(['png'], 'photo.PNG', { type: '' });
    const mislabelledImage = new File(['png'], 'photo.png', { type: 'text/plain' });

    expect(() => assertAcceptedFile(unknownImage, ['image/*'])).not.toThrow();
    expect(() => assertAcceptedFile(mislabelledImage, ['image/*'])).toThrow('请选择图片文件');
  });

  it('MIME 为空时按文本扩展名匹配文本通配类型', () => {
    const textFile = new File(['内容'], 'note.TXT', { type: '' });

    expect(() => assertAcceptedFile(textFile, ['text/*'])).not.toThrow();
  });

  it('成功读取本地文本文件', async () => {
    const file = new File(['本地内容'], 'note.txt', { type: 'text/plain' });

    await expect(readFileAsText(file)).resolves.toBe('本地内容');
  });

  it('成功读取本地文件为 data URL', async () => {
    const file = new File(['hi'], 'note.txt', { type: 'text/plain' });

    await expect(readFileAsDataUrl(file)).resolves.toBe('data:text/plain;base64,aGk=');
  });

  it('图片加载完成后释放临时对象 URL', async () => {
    const revoke = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:preview') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });

    class TestImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', TestImage);

    const image = await loadImage(new File(['png'], 'photo.png', { type: 'image/png' }));

    expect(image).toBeInstanceOf(TestImage);
    expect(revoke).toHaveBeenCalledWith('blob:preview');
  });
});

describe('浏览器操作', () => {
  it('剪贴板权限错误会以中文可恢复错误向调用方传播', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('permission denied')) },
    });

    await expect(copyText('要复制的文本')).rejects.toThrow('无法复制到剪贴板，请检查浏览器权限后重试：permission denied');
  });

  it('Clipboard API 不可用时使用临时文本框并立刻移除', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn(() => true) });

    await copyText('离线复制');

    expect(document.querySelector('textarea')).toBeNull();
  });

  it('下载错误会以中文可恢复错误向调用方传播并释放对象 URL', () => {
    const revoke = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:download') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      throw new Error('download blocked');
    });

    expect(() => downloadBlob(new Blob(['结果']), 'result.txt')).toThrow('下载失败，请检查浏览器下载权限后重试：download blocked');
    expect(revoke).toHaveBeenCalledWith('blob:download');
  });
});
