import { getToolById, TOOLS } from '../data/tools';
import type { ToolId } from '../core/types';
import { NotFoundPage } from './NotFoundPage';
import { ToolLayout } from '../components/ToolLayout';

type ToolPageProps = {
  toolId: string;
};

function isToolId(toolId: string): toolId is ToolId {
  return TOOLS.some((tool) => tool.id === toolId);
}

export function ToolPage({ toolId }: ToolPageProps) {
  if (!isToolId(toolId)) return <NotFoundPage />;

  const tool = getToolById(toolId);
  return tool ? <ToolLayout tool={tool} /> : <NotFoundPage />;
}
