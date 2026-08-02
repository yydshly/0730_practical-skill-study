/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FileDropzone } from '../src/components/FileDropzone';
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
