export type StatusKind = 'idle' | 'loading' | 'success' | 'error';

type StatusMessageProps = {
  status: StatusKind;
  message?: string;
};

const DEFAULT_MESSAGES: Record<StatusKind, string> = {
  idle: '等待操作',
  loading: '正在处理中',
  success: '处理完成',
  error: '操作失败，请重试',
};

export function StatusMessage({ status, message }: StatusMessageProps) {
  const content = message ?? DEFAULT_MESSAGES[status];
  const role = status === 'error' ? 'alert' : 'status';

  return <p className={`status-message status-message--${status}`} role={role}>{content}</p>;
}
