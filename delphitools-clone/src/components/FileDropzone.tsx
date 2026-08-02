import { useId, useRef, useState } from 'react';
import type { DragEvent, KeyboardEvent, MouseEvent } from 'react';

import { assertAcceptedFile } from '../core/files';
import { DEFAULT_BATCH_MAX_BYTES, DEFAULT_BATCH_MAX_FILES } from '../core/batch';

type FileDropzoneProps = {
  accepted: string[];
  onFiles: (files: File[]) => void;
  onError?: (message: string) => void;
  inputLabel?: string;
  maxSizeBytes?: number;
  maxFiles?: number;
  multiple?: boolean;
};

function maxSizeMessage(maxSizeBytes: number): string {
  if (maxSizeBytes === DEFAULT_BATCH_MAX_BYTES) return '文件大小不能超过 50 MiB';
  return `文件大小不能超过 ${maxSizeBytes} 字节`;
}

function hardLimit(value: number, maximum: number): number {
  if (!Number.isFinite(value)) return maximum;
  return Math.min(Math.max(0, Math.floor(value)), maximum);
}

export function FileDropzone({ accepted, onFiles, onError, inputLabel = '选择文件', maxSizeBytes = DEFAULT_BATCH_MAX_BYTES, maxFiles = DEFAULT_BATCH_MAX_FILES, multiple = true }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const directoryInputRef = useRef<HTMLInputElement | null>(null);
  const errorId = useId();
  const [error, setError] = useState('');
  const effectiveMaxSizeBytes = hardLimit(maxSizeBytes, DEFAULT_BATCH_MAX_BYTES);
  const effectiveMaxFiles = hardLimit(maxFiles, DEFAULT_BATCH_MAX_FILES);

  const acceptFiles = (files: File[]) => {
    const selectedFiles = multiple ? files : files.slice(0, 1);

    const validFiles: File[] = [];
    const errors: string[] = [];
    selectedFiles.forEach((file, index) => {
      try {
        if (index >= effectiveMaxFiles) throw new Error(`一次最多处理 ${effectiveMaxFiles} 个文件`);
        assertAcceptedFile(file, accepted);
        if (file.size > effectiveMaxSizeBytes) throw new Error(maxSizeMessage(effectiveMaxSizeBytes));
        validFiles.push(file);
      } catch (reason) {
        errors.push(reason instanceof Error ? reason.message : '文件无法处理，请重新选择');
      }
    });

    if (errors.length > 0) {
      const message = errors.length === 1 ? errors[0] : `已跳过 ${errors.length} 个不符合限制的文件`;
      setError(message);
      onError?.(message);
    } else {
      setError('');
    }

    if (validFiles.length > 0 || selectedFiles.length === 0) onFiles(validFiles);
  };

  const openPicker = () => inputRef.current?.click();
  const openDirectoryPicker = () => directoryInputRef.current?.click();

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
    <>
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
    <input
      ref={(node) => {
        directoryInputRef.current = node;
        node?.setAttribute('webkitdirectory', '');
        node?.setAttribute('directory', '');
      }}
      className="sr-only"
      type="file"
      aria-label="选择文件夹"
      accept={accepted.join(',')}
      multiple
      onChange={(event) => {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        acceptFiles(files);
      }}
    />
    <button type="button" onClick={openDirectoryPicker}>选择文件夹</button>
    </>
  );
}
