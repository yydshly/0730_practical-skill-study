import { Component, lazy, Suspense, useMemo, useState, type ComponentType, type ErrorInfo, type ReactNode } from 'react';

import { getToolById, TOOLS } from '../data/tools';
import type { ToolDefinition, ToolId, ToolWorkspace } from '../core/types';
import { NotFoundPage } from './NotFoundPage';

type WorkspaceComponent = ComponentType<{ tool: ToolDefinition }>;
type WorkspaceModule = { default: WorkspaceComponent };
type WorkspaceLoader = () => Promise<WorkspaceModule>;

function workspaceModule<T extends Record<string, unknown>, K extends keyof T>(module: T, key: K): WorkspaceModule {
  return { default: module[key] as WorkspaceComponent };
}

export const WORKSPACE_LOADERS: Readonly<Record<ToolWorkspace, WorkspaceLoader>> = {
  image: () => import('../tools/ImageWorkspace').then((module) => workspaceModule(module, 'ImageWorkspace')),
  'advanced-media': () => import('../tools/PdfWorkspace').then((module) => workspaceModule(module, 'PdfWorkspace')),
  editor: () => import('../tools/EditorWorkspace').then((module) => workspaceModule(module, 'EditorWorkspace')),
  color: () => import('../tools/ColorWorkspace').then((module) => workspaceModule(module, 'ColorWorkspace')),
  text: () => import('../tools/TextWorkspace').then((module) => workspaceModule(module, 'TextWorkspace')),
  print: () => import('../tools/PdfWorkspace').then((module) => workspaceModule(module, 'PdfWorkspace')),
  developer: () => import('../tools/DeveloperWorkspace').then((module) => workspaceModule(module, 'DeveloperWorkspace')),
  calculator: () => import('../tools/CalculatorWorkspace').then((module) => workspaceModule(module, 'CalculatorWorkspace')),
  special: () => import('../tools/DeveloperWorkspace').then((module) => workspaceModule(module, 'DeveloperWorkspace')),
};

type WorkspaceErrorBoundaryProps = {
  children: ReactNode;
  toolTitle: string;
  resetKey: string;
  onRetry: () => void;
};

type WorkspaceErrorBoundaryState = { failed: boolean };

class WorkspaceErrorBoundary extends Component<WorkspaceErrorBoundaryProps, WorkspaceErrorBoundaryState> {
  state: WorkspaceErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): WorkspaceErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // React reports the original chunk error to the console in development.
  }

  componentDidUpdate(previous: WorkspaceErrorBoundaryProps): void {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section className="workspace-load-error" role="alert">
        <strong>{this.props.toolTitle}工作区加载失败</strong>
        <p>请检查网络或缓存状态后重试。你的本地文件尚未上传。</p>
        <button type="button" onClick={this.props.onRetry}>重试加载工作区</button>
      </section>
    );
  }
}

type ToolPageProps = { toolId: string };

function isToolId(toolId: string): toolId is ToolId {
  return TOOLS.some((tool) => tool.id === toolId);
}

function LazyWorkspace({ tool }: { tool: ToolDefinition }) {
  const [attempt, setAttempt] = useState(0);
  const Workspace = useMemo(() => lazy(WORKSPACE_LOADERS[tool.workspace]), [attempt, tool.workspace]);
  const resetKey = `${tool.id}:${attempt}`;

  return (
    <WorkspaceErrorBoundary
      toolTitle={tool.title}
      resetKey={resetKey}
      onRetry={() => setAttempt((current) => current + 1)}
    >
      <Suspense fallback={<p className="workspace-loading" role="status">正在加载{tool.title}工作区…</p>}>
        <Workspace tool={tool} />
      </Suspense>
    </WorkspaceErrorBoundary>
  );
}

export function ToolPage({ toolId }: ToolPageProps) {
  if (!isToolId(toolId)) return <NotFoundPage />;
  const tool = getToolById(toolId);
  if (!tool) return <NotFoundPage />;
  return <LazyWorkspace key={tool.id} tool={tool} />;
}
