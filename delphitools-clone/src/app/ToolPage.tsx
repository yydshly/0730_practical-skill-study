import { getToolById, TOOLS } from '../data/tools';
import type { ToolId } from '../core/types';
import { NotFoundPage } from './NotFoundPage';
import { ToolLayout } from '../components/ToolLayout';
import { ColorWorkspace, isColorToolId } from '../tools/ColorWorkspace';
import { CalculatorWorkspace, isCalculatorToolId } from '../tools/CalculatorWorkspace';
import { DeveloperWorkspace, isDeveloperToolId } from '../tools/DeveloperWorkspace';
import { isTextToolId, TextWorkspace } from '../tools/TextWorkspace';
import { ImageWorkspace, isImageToolId } from '../tools/ImageWorkspace';
import { isPdfToolId, PdfWorkspace } from '../tools/PdfWorkspace';
import { EditorWorkspace } from '../tools/EditorWorkspace';

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
  if (tool.id === 'editor') return <EditorWorkspace tool={tool} />;
  if (isColorToolId(tool.id)) return <ColorWorkspace tool={tool} />;
  if (isTextToolId(tool.id)) return <TextWorkspace tool={tool} />;
  if (isDeveloperToolId(tool.id)) return <DeveloperWorkspace tool={tool} />;
  if (isCalculatorToolId(tool.id)) return <CalculatorWorkspace tool={tool} />;
  if (isPdfToolId(tool.id)) return <PdfWorkspace tool={tool} />;
  if (isImageToolId(tool.id)) return <ImageWorkspace tool={tool} />;
  return <ToolLayout tool={tool} />;
}
