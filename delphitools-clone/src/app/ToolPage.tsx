import { getToolById, TOOLS } from '../data/tools';
import type { ToolId } from '../core/types';
import { NotFoundPage } from './NotFoundPage';
import { ToolLayout } from '../components/ToolLayout';
import { ColorWorkspace, isColorToolId } from '../tools/ColorWorkspace';

type ToolPageProps = {
  toolId: string;
};

function isToolId(toolId: string): toolId is ToolId {
  return TOOLS.some((tool) => tool.id === toolId);
}

export function ToolPage({ toolId }: ToolPageProps) {
  if (!isToolId(toolId)) return <NotFoundPage />;

  const tool = getToolById(toolId);
  if (!tool) return <NotFoundPage />;
  return isColorToolId(tool.id) ? <ColorWorkspace tool={tool} /> : <ToolLayout tool={tool} />;
}
