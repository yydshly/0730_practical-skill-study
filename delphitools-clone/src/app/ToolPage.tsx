import { getToolById, TOOLS } from '../data/tools';
import type { ToolId } from '../core/types';
import { NotFoundPage } from './NotFoundPage';
import { ToolLayout } from '../components/ToolLayout';
import { ColorWorkspace, isColorToolId } from '../tools/ColorWorkspace';
import { DeveloperWorkspace, isDeveloperToolId } from '../tools/DeveloperWorkspace';
import { isTextToolId, TextWorkspace } from '../tools/TextWorkspace';

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
  if (isColorToolId(tool.id)) return <ColorWorkspace tool={tool} />;
  if (isTextToolId(tool.id)) return <TextWorkspace tool={tool} />;
  if (isDeveloperToolId(tool.id)) return <DeveloperWorkspace tool={tool} />;
  return <ToolLayout tool={tool} />;
}
