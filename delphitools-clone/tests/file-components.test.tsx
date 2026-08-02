/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FileDropzone } from '../src/components/FileDropzone';
import { BatchProgress } from '../src/components/BatchProgress';
import { ResultPanel } from '../src/components/ResultPanel';
import { StatusMessage } from '../src/components/StatusMessage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function DropzoneHarness() {
  const [names, setNames] = useState<string[]>([]);
  return (
    <>
      <FileDropzone accepted={['image/*']} maxSizeBytes={4} onFiles={(files) => setNames(files.map((file) => file.name))} />
      <output aria-label="已接收文件">{names.join(',')}</output>
    </>
  );
}

function SingleFileDropzoneHarness() {
  const [names, setNames] = useState<string[]>([]);
  return (
    <>
      <FileDropzone accepted={['image/*']} multiple={false} onFiles={(files) => setNames(files.map((file) => file.name))} />
      <output aria-label="单文件接收结果">{names.join(',')}</output>
    </>
  );
}

function ResultHarness() {
  const [reset, setReset] = useState(false);
  return (
    <>
      {!reset && <ResultPanel text="可复制结果" download={{ blob: new Blob(['结果']), name: 'result.txt' }} onReset={() => setReset(true)} />}
      {reset && <p>已重置</p>}
    </>
  );
}

describe('FileDropzone', () => {
  it('空选择也通知父工作区，让单文件工具展示自己的中文提示', () => {
    const onFiles = vi.fn();
    render(<FileDropzone accepted={['image/*']} multiple={false} onFiles={onFiles} />);

    fireEvent.change(screen.getByLabelText('选择文件'), { target: { files: [] } });

    expect(onFiles).toHaveBeenCalledWith([]);
  });

  it('提供可访问的文件夹选择入口，并把目录中的多个文件完整传递', () => {
    const onFiles = vi.fn();
    render(<FileDropzone accepted={['text/*']} onFiles={onFiles} />);
    const first = new File(['a'], '文件夹/a.txt', { type: 'text/plain' });
    const second = new File(['b'], '文件夹/子目录/b.txt', { type: 'text/plain' });
    const folderInput = screen.getByLabelText('选择文件夹') as HTMLInputElement;

    expect(folderInput).toHaveAttribute('webkitdirectory');
    expect(folderInput).toHaveAttribute('directory');
    expect(folderInput).toHaveAttribute('multiple');
    fireEvent.change(folderInput, { target: { files: [first, second] } });
    expect(onFiles).toHaveBeenLastCalledWith([first, second]);

    fireEvent.drop(screen.getByRole('button', { name: '选择或拖放文件' }), { dataTransfer: { files: [first, second] } });
    expect(onFiles).toHaveBeenLastCalledWith([first, second]);
  });

  it('键盘激活独立的文件夹按钮时只打开目录输入框', async () => {
    const user = userEvent.setup();
    render(<FileDropzone accepted={['text/*']} onFiles={() => undefined} />);
    const regularInput = screen.getByLabelText('选择文件');
    const directoryInput = screen.getByLabelText('选择文件夹');
    const regularOpen = vi.fn();
    const directoryOpen = vi.fn();
    regularInput.addEventListener('click', regularOpen);
    directoryInput.addEventListener('click', directoryOpen);
    const directoryButton = screen.getByRole('button', { name: '选择文件夹' });

    directoryButton.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(directoryOpen).toHaveBeenCalledTimes(2);
    expect(regularOpen).not.toHaveBeenCalled();
  });

  it('调用方不能通过放宽数量或大小参数绕过组件层硬限制', () => {
    const onFiles = vi.fn();
    render(<FileDropzone accepted={['text/*']} maxSizeBytes={100 * 1024 * 1024} maxFiles={200} onFiles={onFiles} />);
    const files = Array.from({ length: 101 }, (_, index) => new File(['x'], `放宽-${index + 1}.txt`, { type: 'text/plain' }));
    Object.defineProperty(files[4], 'size', { configurable: true, value: 50 * 1024 * 1024 + 1 });

    fireEvent.change(screen.getByLabelText('选择文件'), { target: { files } });

    expect(onFiles).toHaveBeenCalledWith(expect.arrayContaining([files[0]]));
    expect(onFiles.mock.calls[0][0]).toHaveLength(99);
    expect(screen.getByRole('alert')).toHaveTextContent('已跳过 2 个不符合限制的文件');
  });

  it('批量选择时跳过超过默认数量和大小限制的文件，并保留可处理文件', () => {
    const onFiles = vi.fn();
    render(<FileDropzone accepted={['text/*']} onFiles={onFiles} />);
    const files = Array.from({ length: 101 }, (_, index) => new File(['x'], `文本-${index + 1}.txt`, { type: 'text/plain' }));
    Object.defineProperty(files[4], 'size', { configurable: true, value: 50 * 1024 * 1024 + 1 });

    fireEvent.change(screen.getByLabelText('选择文件'), { target: { files } });

    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles.mock.calls[0][0]).toHaveLength(99);
    expect(screen.getByRole('alert')).toHaveTextContent('已跳过 2 个不符合限制的文件');
  });
  it('文件校验失败时通知父工作区清除旧成功结果', () => {
    const onError = vi.fn();
    render(<FileDropzone accepted={['image/*']} onFiles={() => undefined} onError={onError} />);

    fireEvent.change(screen.getByLabelText('选择文件'), {
      target: { files: [new File(['文本'], 'note.txt', { type: 'text/plain' })] },
    });

    expect(onError).toHaveBeenCalledWith('请选择图片文件');
  });

  it('通过真实拖放接收可用文件，并拒绝超出大小或类型不符的文件', () => {
    render(<DropzoneHarness />);
    const dropzone = screen.getByRole('button', { name: '选择或拖放文件' });
    const accepted = new File(['png'], 'photo.png', { type: 'image/png' });
    const tooLarge = new File(['12345'], 'large.png', { type: 'image/png' });
    const wrongType = new File(['txt'], 'note.txt', { type: 'text/plain' });

    fireEvent.drop(dropzone, { dataTransfer: { files: [accepted] } });
    expect(screen.getByLabelText('已接收文件')).toHaveTextContent('photo.png');

    fireEvent.drop(dropzone, { dataTransfer: { files: [tooLarge] } });
    expect(screen.getByRole('alert')).toHaveTextContent('文件大小不能超过 4 字节');
    expect(screen.getByLabelText('已接收文件')).toHaveTextContent('photo.png');

    fireEvent.drop(dropzone, { dataTransfer: { files: [wrongType] } });
    expect(screen.getByRole('alert')).toHaveTextContent('请选择图片文件');
    expect(screen.getByLabelText('已接收文件')).toHaveTextContent('photo.png');
  });

  it('可用鼠标点击和键盘激活隐藏的文件选择框', async () => {
    const user = userEvent.setup();
    render(<DropzoneHarness />);
    const dropzone = screen.getByRole('button', { name: '选择或拖放文件' });
    const input = screen.getByLabelText('选择文件');
    const activated = vi.fn();
    input.addEventListener('click', activated);

    await user.click(dropzone);
    expect(activated).toHaveBeenCalledTimes(1);

    dropzone.focus();
    await user.keyboard('{Enter}');
    expect(activated).toHaveBeenCalledTimes(2);
    await user.keyboard(' ');
    expect(activated).toHaveBeenCalledTimes(3);
  });

  it('不会把父级 onFiles 抛出的错误当成文件校验错误吞掉', () => {
    const parentError = new Error('父级处理失败');
    let reportedError: unknown;
    const captureError = (event: ErrorEvent) => {
      reportedError = event.error;
      event.preventDefault();
    };
    window.addEventListener('error', captureError);
    render(<FileDropzone accepted={['image/*']} onFiles={() => { throw parentError; }} />);
    const dropzone = screen.getByRole('button', { name: '选择或拖放文件' });
    const file = new File(['png'], 'photo.png', { type: 'image/png' });

    try {
      fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
      expect(reportedError).toBe(parentError);
      expect(screen.queryByRole('alert')).toBeNull();
    } finally {
      window.removeEventListener('error', captureError);
    }
  });

  it('单文件模式在文件选择和拖放时都只接收第一个文件', () => {
    render(<SingleFileDropzoneHarness />);
    const dropzone = screen.getByRole('button', { name: '选择或拖放文件' });
    const input = screen.getByLabelText('选择文件');
    const pickedFirst = new File(['png'], 'picked-first.png', { type: 'image/png' });
    const pickedSecond = new File(['png'], 'picked-second.png', { type: 'image/png' });
    const droppedFirst = new File(['png'], 'dropped-first.png', { type: 'image/png' });
    const droppedSecond = new File(['png'], 'dropped-second.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [pickedFirst, pickedSecond] } });
    expect(screen.getByLabelText('单文件接收结果')).toHaveTextContent(/^picked-first\.png$/);

    fireEvent.drop(dropzone, { dataTransfer: { files: [droppedFirst, droppedSecond] } });
    expect(screen.getByLabelText('单文件接收结果')).toHaveTextContent(/^dropped-first\.png$/);
  });

  it('读取后清空文件输入，允许连续选择同一个文件', () => {
    const onFiles = vi.fn();
    render(<FileDropzone accepted={['image/*']} onFiles={onFiles} />);
    const input = screen.getByLabelText('选择文件') as HTMLInputElement;
    const file = new File(['png'], 'same.png', { type: 'image/png' });

    Object.defineProperty(input, 'value', { configurable: true, writable: true, value: 'C:\\fakepath\\same.png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(input.value).toBe('');
    expect(onFiles).toHaveBeenCalledWith([file]);
  });
});

describe('BatchProgress', () => {
  it('显示完成和失败数量，并提供取消、单项下载与全部下载操作', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onDownload = vi.fn();
    const onDownloadAll = vi.fn();
    const successFile = new File(['ok'], '成功.png', { type: 'image/png' });
    const failureFile = new File(['bad'], '失败.png', { type: 'image/png' });
    render(
      <BatchProgress
        items={[
          { id: 'success', file: successFile, status: 'success', result: { name: '成功.png' } },
          { id: 'failure', file: failureFile, status: 'error', error: '处理失败：文件损坏' },
        ]}
        onCancel={onCancel}
        onDownload={onDownload}
        onDownloadAll={onDownloadAll}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('已完成 2/2，失败 1 项');
    expect(screen.getByText('处理失败：文件损坏')).toBeVisible();
    await user.click(screen.getByRole('button', { name: '取消处理' }));
    await user.click(screen.getByRole('button', { name: '下载 成功.png' }));
    await user.click(screen.getByRole('button', { name: '下载全部结果' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledWith(expect.objectContaining({ id: 'success' }));
    expect(onDownloadAll).toHaveBeenCalledTimes(1);
  });
});

describe('ResultPanel 和 StatusMessage', () => {
  it('仅在提供对应能力时显示结果操作', () => {
    const { rerender } = render(<ResultPanel />);
    expect(screen.queryByRole('button')).toBeNull();

    rerender(<ResultPanel text="可复制结果" download={{ blob: new Blob(['结果']), name: 'result.txt' }} onReset={() => undefined} />);
    expect(screen.getByRole('button', { name: '复制结果' })).toBeVisible();
    expect(screen.getByRole('button', { name: '下载文件' })).toBeVisible();
    expect(screen.getByRole('button', { name: '重新开始' })).toBeVisible();
  });

  it('真实结果面板可以复制、下载并重置', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:result') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<ResultHarness />);

    await user.click(screen.getByRole('button', { name: '复制结果' }));
    expect(screen.getByRole('status')).toHaveTextContent('已复制到剪贴板');

    await user.click(screen.getByRole('button', { name: '下载文件' }));
    expect(screen.getByRole('status')).toHaveTextContent('已开始下载文件');

    await user.click(screen.getByRole('button', { name: '重新开始' }));
    expect(screen.getByText('已重置')).toBeVisible();
  });

  it('用文字明确区分空闲、处理中、成功和错误状态', () => {
    const { rerender } = render(<StatusMessage status="idle" />);
    expect(screen.getByRole('status')).toHaveTextContent('等待操作');

    rerender(<StatusMessage status="loading" />);
    expect(screen.getByRole('status')).toHaveTextContent('正在处理中');

    rerender(<StatusMessage status="success" />);
    expect(screen.getByRole('status')).toHaveTextContent('处理完成');

    rerender(<StatusMessage status="error" message="文件读取失败，请重试" />);
    expect(screen.getByRole('alert')).toHaveTextContent('文件读取失败，请重试');
  });
});
