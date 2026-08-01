import { useEffect, useState } from 'react';

import { AppShell } from '../components/AppShell';
import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';
import { ToolPage } from './ToolPage';

function getPathname(): string {
  return window.location.pathname;
}

export function App() {
  const [pathname, setPathname] = useState(getPathname);

  useEffect(() => {
    const updatePathname = () => setPathname(getPathname());
    window.addEventListener('popstate', updatePathname);
    return () => window.removeEventListener('popstate', updatePathname);
  }, []);

  const toolMatch = pathname.match(/^\/tools\/([^/]+)$/);
  const content = pathname === '/'
    ? <HomePage />
    : pathname === '/editor'
      ? <ToolPage toolId="editor" />
      : toolMatch
        ? <ToolPage toolId={decodeURIComponent(toolMatch[1])} />
        : <NotFoundPage />;

  return <AppShell>{content}</AppShell>;
}
