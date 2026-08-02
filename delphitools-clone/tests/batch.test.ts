import { describe, expect, it, vi } from 'vitest';

import { runBatch } from '../src/core/batch';
import { releaseObjectUrls, sanitizeDownloadName } from '../src/core/download';

function file(name: string, size = 1): File {
  const value = new File(['x'], name, { type: 'text/plain' });
  Object.defineProperty(value, 'size', { configurable: true, value: size });
  return value;
}

const MEBIBYTE = 1024 * 1024;

describe('runBatch', () => {
  it('调用方不能把 50 MiB 的硬上限放宽为更大的值', async () => {
    const tooLarge = file('超过硬上限.txt', 52_428_801);
    const worker = vi.fn(async (selected: File) => selected.name);

    const items = await runBatch([tooLarge], worker, { maxBytes: 100 * MEBIBYTE });

    expect(worker).not.toHaveBeenCalled();
    expect(items).toEqual([expect.objectContaining({ status: 'error', error: '文件大小不能超过 50 MiB' })]);
  });

  it('默认跳过超过 100 项和 50 MiB 的文件，同时继续处理其余文件', async () => {
    const files = Array.from({ length: 101 }, (_, index) => file(`文件-${index + 1}.txt`));
    files[5] = file('过大.txt', 50 * MEBIBYTE + 1);
    const worker = vi.fn(async (selected: File) => selected.name);

    const items = await runBatch(files, worker);

    expect(items).toHaveLength(101);
    expect(items[0]).toMatchObject({ file: files[0], status: 'success', result: '文件-1.txt' });
    expect(items[5]).toMatchObject({ file: files[5], status: 'error', error: '文件大小不能超过 50 MiB' });
    expect(items[100]).toMatchObject({ file: files[100], status: 'error', error: '一次最多处理 100 个文件' });
    expect(worker).toHaveBeenCalledTimes(99);
  });

  it('按原始顺序返回结果，并且并发数不会超过指定上限', async () => {
    const files = ['first.txt', 'second.txt', 'third.txt', 'fourth.txt'].map((name) => file(name));
    let running = 0;
    let highestRunning = 0;

    const items = await runBatch(files, async (selected) => {
      running += 1;
      highestRunning = Math.max(highestRunning, running);
      await new Promise((resolve) => setTimeout(resolve, selected.name === 'first.txt' ? 12 : 2));
      running -= 1;
      return selected.name.toUpperCase();
    }, { concurrency: 2 });

    expect(highestRunning).toBe(2);
    expect(items.map((item) => item.result)).toEqual(['FIRST.TXT', 'SECOND.TXT', 'THIRD.TXT', 'FOURTH.TXT']);
  });

  it('把单项失败保留为中文错误，且不阻断其他文件', async () => {
    const files = ['正常-a.txt', '失败.txt', '正常-b.txt'].map((name) => file(name));

    const items = await runBatch(files, async (selected) => {
      if (selected.name === '失败.txt') throw new Error('读取失败');
      return selected.name;
    });

    expect(items.map((item) => item.status)).toEqual(['success', 'error', 'success']);
    expect(items[1]).toMatchObject({ error: '处理失败：读取失败' });
    expect(items[2]).toMatchObject({ result: '正常-b.txt' });
  });

  it('收到 AbortSignal 后不再启动排队文件，并保留已取消状态', async () => {
    const controller = new AbortController();
    const files = ['第一个.txt', '第二个.txt', '第三个.txt'].map((name) => file(name));
    const started: string[] = [];

    const items = await runBatch(files, async (selected, signal) => {
      started.push(selected.name);
      if (selected.name === '第一个.txt') controller.abort();
      await new Promise((resolve) => setTimeout(resolve, 1));
      if (signal.aborted) throw new DOMException('操作已取消', 'AbortError');
      return selected.name;
    }, { concurrency: 1, signal: controller.signal });

    expect(started).toEqual(['第一个.txt']);
    expect(items.map((item) => item.status)).toEqual(['error', 'error', 'error']);
    expect(items.map((item) => item.error)).toEqual(['操作已取消', '操作已取消', '操作已取消']);
  });
});

describe('本地下载资源', () => {
  it('下载文件名移除路径分隔符和控制字符，并在空白时回退', () => {
    expect(sanitizeDownloadName('../报告\\原始\u0000名称.pdf', '结果.pdf')).toBe('..报告原始名称.pdf');
    expect(sanitizeDownloadName(' \t\n ', '结果.pdf')).toBe('结果.pdf');
  });

  it('逐项释放所有 object URL，即使其中一项释放失败也继续', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url) => {
      if (url === 'blob:broken') throw new Error('已失效');
    });

    expect(() => releaseObjectUrls(['blob:first', 'blob:broken', 'blob:last'])).not.toThrow();
    expect(revoke).toHaveBeenCalledTimes(3);
    expect(revoke).toHaveBeenNthCalledWith(3, 'blob:last');
  });
});
