import { useState } from 'react';

import type { ToolCapabilityStatus } from '../core/types';
import { PROJECT_PROVENANCE } from '../data/projectProvenance';
import { TOOL_CAPABILITY_STATUS_META, TOOL_EXPLANATION_BY_ID, TOOL_EXPLANATIONS } from '../data/toolExplanations';
import { TOOLS } from '../data/tools';

const STATUS_ORDER: readonly ToolCapabilityStatus[] = ['complete', 'core-complete', 'partial', 'unavailable'];

export function CapabilityStatusPage() {
  const [statusFilter, setStatusFilter] = useState<ToolCapabilityStatus | 'all'>('all');
  const visibleTools = statusFilter === 'all'
    ? TOOLS
    : TOOLS.filter((tool) => TOOL_EXPLANATION_BY_ID[tool.id].status === statusFilter);

  return (
    <section className="capability-status-page page-wrap">
      <p className="page-kicker">能力边界</p>
      <h1>能力与实现说明</h1>
      <p className="page-lede">入口可运行不等于能力完整复刻。以下状态基于当前本地浏览器实现，说明每项工具已覆盖的能力与仍有的限制。</p>

      <section className="project-provenance" aria-labelledby="project-provenance-title">
        <p className="project-provenance__eyebrow">项目来源</p>
        <h2 id="project-provenance-title">参考来源与实现关系</h2>
        <p>{PROJECT_PROVENANCE.relationship}</p>
        <ul className="project-provenance__links">
          <li>
            参考网页：{' '}
            <a href={PROJECT_PROVENANCE.referenceSite.url} target="_blank" rel="noopener noreferrer">
              {PROJECT_PROVENANCE.referenceSite.label}
            </a>
          </li>
          <li>
            官方源码：{' '}
            <a href={PROJECT_PROVENANCE.sourceRepository.url} target="_blank" rel="noopener noreferrer">
              {PROJECT_PROVENANCE.sourceRepository.label}
            </a>
          </li>
          <li>
            原项目许可证：{' '}
            <a href={PROJECT_PROVENANCE.license.url} target="_blank" rel="noopener noreferrer">
              {PROJECT_PROVENANCE.license.label}
            </a>
          </li>
        </ul>
        <p>{PROJECT_PROVENANCE.licenseNote}</p>
        <p className="project-provenance__progress"><strong>当前进展：</strong>{PROJECT_PROVENANCE.progress}</p>
      </section>

      <div className="capability-summary-grid" aria-label="实现状态统计">
        {STATUS_ORDER.map((status) => {
          const meta = TOOL_CAPABILITY_STATUS_META[status];
          const count = TOOL_EXPLANATIONS.filter((item) => item.status === status).length;
          return (
            <section key={status} className={`capability-summary-card capability-summary-card--${status}`}>
              <strong>{meta.label} {count}</strong>
              <p>{meta.description}</p>
            </section>
          );
        })}
      </div>

      <label className="capability-filter">
        <span>按实现状态筛选</span>
        <select aria-label="按实现状态筛选" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ToolCapabilityStatus | 'all')}>
          <option value="all">全部状态</option>
          {STATUS_ORDER.map((status) => <option key={status} value={status}>{TOOL_CAPABILITY_STATUS_META[status].label}</option>)}
        </select>
      </label>

      <div className="capability-tool-grid">
        {visibleTools.map((tool) => {
          const explanation = TOOL_EXPLANATION_BY_ID[tool.id];
          const meta = TOOL_CAPABILITY_STATUS_META[explanation.status];
          const unavailableDetail = explanation.unavailableReasons?.[0] ?? explanation.futureRequirements?.[0];
          const href = tool.id === 'editor' ? '/editor' : `/tools/${tool.id}`;
          return (
            <article key={tool.id} className="capability-tool-card" aria-label={tool.title}>
              <div className="capability-tool-card__header">
                <div>
                  <a href={href}><h2>{tool.title}</h2></a>
                  <p>{tool.englishTitle}</p>
                </div>
                <span className={`tool-status tool-status--${explanation.status}`}>{meta.label}</span>
              </div>
              <p>{explanation.summary}</p>
              <p className="capability-tool-card__limit"><strong>当前限制：</strong>{explanation.limitations[0]}</p>
              {explanation.status === 'unavailable' && unavailableDetail && (
                <p className="capability-tool-card__unavailable"><strong>无法完整实现原因：</strong>{unavailableDetail}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
