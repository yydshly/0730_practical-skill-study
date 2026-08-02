import type { ToolDefinition } from '../core/types';
import { ToolExplanationPanel } from './ToolExplanationPanel';

type ToolLayoutProps = {
  tool: ToolDefinition;
  localNote?: string;
  children: React.ReactNode;
};

export function ToolLayout({ tool, localNote = '本工具将在你的设备本地处理文件，不会上传任何内容。', children }: ToolLayoutProps) {
  return (
    <section className="tool-page page-wrap">
      <a className="back-link" href="/">← 返回工具目录</a>
      <p className="page-kicker">{tool.englishTitle}</p>
      <h1>{tool.title}</h1>
      <p className="page-lede">{tool.description}</p>
      <p className="local-note">{localNote}</p>
      {children}
      <ToolExplanationPanel toolId={tool.id} />
    </section>
  );
}
