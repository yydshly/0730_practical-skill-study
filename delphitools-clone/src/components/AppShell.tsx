import { useEffect, useState, type ReactNode } from 'react';

import { applyTheme, getPreferredTheme, type Theme } from '../core/theme';
import { Sidebar } from './Sidebar';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [theme, setTheme] = useState<Theme>(getPreferredTheme);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onToggleTheme={() => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')}
        theme={theme}
      />
      <main className="app-main">
        <div className="mobile-header">
          <button className="icon-button" type="button" onClick={() => setIsMenuOpen(true)} aria-label="打开导航菜单">☰</button>
          <a className="mobile-header__brand" href="/">DelphiTools</a>
        </div>
        {children}
      </main>
    </div>
  );
}
