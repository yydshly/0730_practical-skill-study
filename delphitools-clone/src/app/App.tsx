import { useEffect, useState } from 'react';

import { AppShell } from '../components/AppShell';
import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';
import { ToolPage } from './ToolPage';

function getPathname(): string {
  return window.location.pathname;
}

function decodeToolId(encodedToolId: string): string | undefined {
  try {
    return decodeURIComponent(encodedToolId);
  } catch {
    return undefined;
  }
}

export function App() {
  const [pathname, setPathname] = useState(getPathname);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const updatePathname = () => setPathname(getPathname());
    window.addEventListener('popstate', updatePathname);
    return () => window.removeEventListener('popstate', updatePathname);
  }, []);

  const toolMatch = pathname.match(/^\/tools\/([^/]+)$/);
  const toolId = toolMatch ? decodeToolId(toolMatch[1]) : undefined;
  const updateSearchQuery = (query: string) => {
    setSearchQuery(query);
    if (pathname !== '/') {
      window.history.pushState({}, '', '/');
      setPathname('/');
    }
  };
  const content = pathname === '/'
    ? <HomePage query={searchQuery} />
    : pathname === '/editor'
      ? <ToolPage toolId="editor" />
      : toolId
        ? <ToolPage toolId={toolId} />
        : <NotFoundPage />;

  return <AppShell searchQuery={searchQuery} onSearchQueryChange={updateSearchQuery}>{content}</AppShell>;
}
