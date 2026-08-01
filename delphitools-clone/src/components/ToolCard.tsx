import type { ToolDefinition } from '../core/types';

type ToolCardProps = {
  tool: ToolDefinition;
};

export function ToolCard({ tool }: ToolCardProps) {
  const href = tool.id === 'editor' ? '/editor' : `/tools/${tool.id}`;

  return (
    <a className="tool-card" href={href} aria-label={tool.title}>
      <span className="tool-card__eyebrow">{tool.englishTitle}</span>
      <span className="tool-card__title">{tool.title}</span>
      <span className="tool-card__description">{tool.description}</span>
      <span className="tool-card__action" aria-hidden="true">打开工具 →</span>
    </a>
  );
}
