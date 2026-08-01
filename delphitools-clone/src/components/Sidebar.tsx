import { TOOL_CATEGORIES } from '../data/categories';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
};

export function Sidebar({ isOpen, onClose, onToggleTheme, theme }: SidebarProps) {
  return (
    <>
      {isOpen && <button className="drawer-scrim" aria-label="关闭导航菜单" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} aria-label="工具导航">
        <div className="sidebar__topline">
          <a className="brand" href="/" aria-label="DelphiTools 首页">
            <span className="brand__mark" aria-hidden="true">D</span>
            <span><strong>DelphiTools</strong><small>本地创作工具集</small></span>
          </a>
          <button className="icon-button sidebar__close" type="button" onClick={onClose} aria-label="关闭导航菜单">×</button>
        </div>

        <nav className="sidebar__nav" aria-label="工具分类">
          <a href="#featured" onClick={onClose}>精选工具</a>
          {TOOL_CATEGORIES.map((category) => (
            <a key={category.id} href={`#${category.id}`} onClick={onClose}>{category.title}</a>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button className="theme-button" type="button" onClick={onToggleTheme} aria-label={theme === 'light' ? '切换到深色主题' : '切换到浅色主题'}>
            {theme === 'light' ? '深色主题' : '浅色主题'}
          </button>
          <p>所有文件仅在你的设备上处理，不会上传到服务器。</p>
        </div>
      </aside>
    </>
  );
}
