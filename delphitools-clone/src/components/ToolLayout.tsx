import type { ToolDefinition } from '../core/types';

type ToolLayoutProps = {
  tool: ToolDefinition;
  localNote?: string;
  children?: React.ReactNode;
};

export function ToolLayout({ tool, localNote = '本工具将在你的设备本地处理文件，不会上传任何内容。', children }: ToolLayoutProps) {
  return (
    <section className="tool-page page-wrap">
      <a className="back-link" href="/">← 返回工具目录</a>
      <p className="page-kicker">{tool.englishTitle}</p>
      <h1>{tool.title}</h1>
      <p className="page-lede">{tool.description}</p>
      <p className="local-note">{localNote}</p>
      {children ?? <div className="workspace-boundary" aria-label={`${tool.title} 工作区`}>
        <span>工具工作区</span>
        <strong>正在构建此工具</strong>
        <p>这里会承载 {tool.title} 的操作界面；当前仅提供清晰的工作区边界。</p>
      </div>}
    </section>
  );
}
