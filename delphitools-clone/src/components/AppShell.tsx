import { useEffect, useRef, useState, type ReactNode } from 'react';

import { applyTheme, getPreferredTheme, type Theme } from '../core/theme';
import { Sidebar } from './Sidebar';

type AppShellProps = {
  children: ReactNode;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
};

const DRAWER_BREAKPOINT = 900;

function isDrawerViewport(): boolean {
  return window.innerWidth <= DRAWER_BREAKPOINT;
}

export function AppShell({ children, searchQuery, onSearchQueryChange }: AppShellProps) {
  const [theme, setTheme] = useState<Theme>(getPreferredTheme);
  const [isDrawer, setIsDrawer] = useState(isDrawerViewport);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const restoreMenuFocusRef = useRef(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const updateDrawerMode = () => setIsDrawer(isDrawerViewport());
    window.addEventListener('resize', updateDrawerMode);
    return () => window.removeEventListener('resize', updateDrawerMode);
  }, []);

  const closeMenu = () => {
    restoreMenuFocusRef.current = isDrawer;
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (!isMenuOpen && restoreMenuFocusRef.current) {
      restoreMenuFocusRef.current = false;
      openButtonRef.current?.focus();
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDrawer && isMenuOpen) closeMenu();
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isDrawer, isMenuOpen]);

  return (
    <div className="app-shell">
      <Sidebar
        isDrawer={isDrawer}
        isOpen={isDrawer ? isMenuOpen : true}
        onClose={closeMenu}
        onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')}
        theme={theme}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
      />
      <main className="app-main" aria-hidden={isDrawer && isMenuOpen ? true : undefined} inert={isDrawer && isMenuOpen ? '' : undefined}>
        <div className="mobile-header">
          <button ref={openButtonRef} className="icon-button" type="button" onClick={() => setIsMenuOpen(true)} aria-label="打开导航菜单">☰</button>
          <a className="mobile-header__brand" href="/">DelphiTools</a>
        </div>
        {children}
      </main>
    </div>
  );
}
