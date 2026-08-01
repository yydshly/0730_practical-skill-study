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
