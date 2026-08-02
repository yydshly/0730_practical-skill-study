import { useEffect, useState } from 'react';

import { AppShell } from '../components/AppShell';
import { createRouteHref, resolveRoutePath } from '../core/navigation';
import { CapabilityStatusPage } from './CapabilityStatusPage';
import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';
import { ToolPage } from './ToolPage';

function getPathname(): string {
  return resolveRoutePath(window.location.pathname, window.location.hash);
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
    window.addEventListener('hashchange', updatePathname);
    return () => {
      window.removeEventListener('popstate', updatePathname);
      window.removeEventListener('hashchange', updatePathname);
    };
  }, []);

  const toolMatch = pathname.match(/^\/tools\/([^/]+)$/);
  const toolId = toolMatch ? decodeToolId(toolMatch[1]) : undefined;
  const updateSearchQuery = (query: string) => {
    setSearchQuery(query);
    if (pathname !== '/') {
      if (import.meta.env.PROD) {
        window.location.hash = createRouteHref('/', true).slice(1);
      } else {
        window.history.pushState({}, '', '/');
      }
      setPathname('/');
    }
  };
  const content = pathname === '/'
    ? <HomePage query={searchQuery} />
    : pathname === '/capabilities'
      ? <CapabilityStatusPage />
    : pathname === '/editor'
      ? <ToolPage toolId="editor" />
      : toolId
        ? <ToolPage toolId={toolId} />
        : <NotFoundPage />;

  return <AppShell searchQuery={searchQuery} onSearchQueryChange={updateSearchQuery}>{content}</AppShell>;
}
