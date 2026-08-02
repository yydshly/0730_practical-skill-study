import { useId, useRef, useState } from 'react';
import type { DragEvent, KeyboardEvent, MouseEvent } from 'react';

import { assertAcceptedFile } from '../core/files';

type FileDropzoneProps = {
  accepted: string[];
  onFiles: (files: File[]) => void;
  onError?: (message: string) => void;
  inputLabel?: string;
  maxSizeBytes?: number;
  multiple?: boolean;
};

function maxSizeMessage(maxSizeBytes: number): string {
  return `文件大小不能超过 ${maxSizeBytes} 字节`;
}

export function FileDropzone({ accepted, onFiles, onError, inputLabel = '选择文件', maxSizeBytes, multiple = true }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [error, setError] = useState('');

  const acceptFiles = (files: File[]) => {
    const selectedFiles = multiple ? files : files.slice(0, 1);

    try {
      selectedFiles.forEach((file) => {
        assertAcceptedFile(file, accepted);
        if (maxSizeBytes !== undefined && file.size > maxSizeBytes) throw new Error(maxSizeMessage(maxSizeBytes));
      });
      setError('');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : '文件无法处理，请重新选择';
      setError(message);
      onError?.(message);
      return;
    }

    onFiles(selectedFiles);
  };

  const openPicker = () => inputRef.current?.click();

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    acceptFiles(Array.from(event.dataTransfer.files));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== inputRef.current) openPicker();
  };

  return (
    <div
      className="file-dropzone"
      role="button"
      tabIndex={0}
      aria-label="选择或拖放文件"
      aria-describedby={error ? errorId : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        aria-label={inputLabel}
        accept={accepted.join(',')}
        multiple={multiple}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          acceptFiles(files);
        }}
      />
      <strong>选择文件或拖放到这里</strong>
      <span>文件只会在你的设备本地处理</span>
      {error && <p id={errorId} role="alert">{error}</p>}
    </div>
  );
}
