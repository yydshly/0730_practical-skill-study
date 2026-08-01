import { useEffect, useRef } from 'react';

import { TOOL_CATEGORIES } from '../data/categories';

type SidebarProps = {
  isDrawer: boolean;
  isOpen: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
};

export function Sidebar({ isDrawer, isOpen, onClose, onToggleTheme, theme, searchQuery, onSearchQueryChange }: SidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isHidden = isDrawer && !isOpen;
  const disabledTabIndex = isHidden ? -1 : undefined;

  useEffect(() => {
    if (isDrawer && isOpen) closeButtonRef.current?.focus();
  }, [isDrawer, isOpen]);

  return (
    <>
      {isOpen && <button className="drawer-scrim" aria-label="关闭导航菜单" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} aria-hidden={isHidden || undefined} aria-label="工具导航">
        <div className="sidebar__topline">
          <a className="brand" href="/" aria-label="DelphiTools 首页" tabIndex={disabledTabIndex}>
            <span className="brand__mark" aria-hidden="true">D</span>
            <span><strong>DelphiTools</strong><small>本地创作工具集</small></span>
          </a>
          <button ref={closeButtonRef} className="icon-button sidebar__close" type="button" onClick={onClose} aria-label="关闭导航菜单" tabIndex={disabledTabIndex}>×</button>
        </div>

        <label className="search-field sidebar__search">
          <span className="sr-only">搜索工具</span>
          <span aria-hidden="true">⌕</span>
          <input type="search" role="searchbox" value={searchQuery} onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="搜索工具，例如：二维码、图片转换、颜色" tabIndex={disabledTabIndex} />
        </label>

        <nav className="sidebar__nav" aria-label="工具分类">
          <a href="#featured" onClick={onClose} tabIndex={disabledTabIndex}>精选工具</a>
          {TOOL_CATEGORIES.map((category) => (
            <a key={category.id} href={`#${category.id}`} onClick={onClose} tabIndex={disabledTabIndex}>{category.title}</a>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button className="theme-button" type="button" onClick={onToggleTheme} aria-label={theme === 'light' ? '切换到深色主题' : '切换到浅色主题'} tabIndex={disabledTabIndex}>
            {theme === 'light' ? '深色主题' : '浅色主题'}
          </button>
          <p>所有文件仅在你的设备上处理，不会上传到服务器。</p>
        </div>
      </aside>
    </>
  );
}
