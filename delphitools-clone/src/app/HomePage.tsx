import { useState } from 'react';

import { ToolCard } from '../components/ToolCard';
import { TOOL_CATEGORIES } from '../data/categories';
import { searchTools, TOOLS } from '../data/tools';

export function HomePage() {
  const [query, setQuery] = useState('');
  const visibleTools = searchTools(query);
  const featuredTools = TOOLS.slice(0, 3);

  return (
    <div className="page-wrap home-page">
      <header className="hero">
        <p className="page-kicker">免费 · 本地 · 无需登录</p>
        <h1>为日常创作准备的实用工具</h1>
        <p className="page-lede">处理图片、文字、颜色、代码和版式。打开即用，文件始终留在你的设备上。</p>
        <label className="search-field">
          <span className="sr-only">搜索工具</span>
          <span aria-hidden="true">⌕</span>
          <input type="search" role="searchbox" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索工具，例如：二维码、图片转换、颜色" />
        </label>
      </header>

      {!query && (
        <section id="featured" className="catalog-section" aria-labelledby="featured-heading">
          <div className="section-heading"><div><p className="page-kicker">开始使用</p><h2 id="featured-heading">精选工具</h2></div></div>
          <div className="tool-grid">{featuredTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}</div>
        </section>
      )}

      {TOOL_CATEGORIES.map((category) => {
        const categoryTools = visibleTools.filter((tool) => tool.category === category.id);
        if (!categoryTools.length) return null;

        return (
          <section id={category.id} className="catalog-section" key={category.id} aria-labelledby={`${category.id}-heading`}>
            <div className="section-heading"><div><h2 id={`${category.id}-heading`}>{category.title}</h2><p>{category.description}</p></div><span>{categoryTools.length} 个工具</span></div>
            <div className="tool-grid">{categoryTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}</div>
          </section>
        );
      })}

      {visibleTools.length === 0 && <p className="empty-state">没有找到匹配的工具，换个关键词试试。</p>}
    </div>
  );
}
