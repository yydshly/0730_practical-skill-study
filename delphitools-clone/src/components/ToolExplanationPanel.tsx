import type { ToolId } from '../core/types';
import { PROJECT_PROVENANCE } from '../data/projectProvenance';
import { getToolCapabilityStatusLabel, getToolExplanation } from '../data/toolExplanations';

type ToolExplanationPanelProps = { toolId: ToolId };

export function ToolExplanationPanel({ toolId }: ToolExplanationPanelProps) {
  const explanation = getToolExplanation(toolId);
  const hasUnavailableContent = (explanation.unavailableReasons?.length ?? 0) + (explanation.futureRequirements?.length ?? 0) > 0;

  return (
    <section className="tool-explanation" aria-labelledby={`tool-explanation-${toolId}`}>
      <header className="tool-explanation__header">
        <div>
          <p className="tool-explanation__eyebrow">中文能力说明</p>
          <h2 id={`tool-explanation-${toolId}`}>能力与实现说明</h2>
        </div>
        <span className={`tool-status tool-status--${explanation.status}`}>
          {getToolCapabilityStatusLabel(explanation.status)}
        </span>
      </header>
      <p>{explanation.summary}</p>
      <section aria-labelledby={`tool-principle-${toolId}`}>
        <h3 id={`tool-principle-${toolId}`}>算法与实现原理</h3>
        <ul>{explanation.principle.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <details>
        <summary>支持的输入与输出</summary>
        <h3>输入</h3>
        <ul>{explanation.inputs.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>输出</h3>
        <ul>{explanation.outputs.map((item) => <li key={item}>{item}</li>)}</ul>
        <p>{explanation.privacy}</p>
      </details>
      <details>
        <summary>推荐操作流程</summary>
        <ol>{explanation.workflow.map((item) => <li key={item}>{item}</li>)}</ol>
      </details>
      <details>
        <summary>当前限制与差异</summary>
        <ul>{explanation.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
      </details>
      {hasUnavailableContent && (
        <details>
          <summary>为什么暂时无法完整实现</summary>
          <ul>
            {[...(explanation.unavailableReasons ?? []), ...(explanation.futureRequirements ?? [])]
              .map((item) => <li key={item}>{item}</li>)}
          </ul>
        </details>
      )}
      <footer className="tool-explanation__provenance">
        <p>
          参考来源：{' '}
          <a href={PROJECT_PROVENANCE.referenceSite.url} target="_blank" rel="noopener noreferrer">
            {PROJECT_PROVENANCE.referenceSite.label}
          </a>
          {' · '}
          <a href={PROJECT_PROVENANCE.sourceRepository.url} target="_blank" rel="noopener noreferrer">
            {PROJECT_PROVENANCE.sourceRepository.label}
          </a>
        </p>
        <p>{PROJECT_PROVENANCE.toolNote}</p>
      </footer>
    </section>
  );
}
