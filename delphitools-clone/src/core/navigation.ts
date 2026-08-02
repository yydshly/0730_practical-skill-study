const APP_PATH_PATTERN = /^\/(?:$|capabilities$|editor$|tools\/[^/]+$)/;

export function resolveRoutePath(pathname: string, hash: string): string {
  if (hash.startsWith('#/')) {
    return hash.slice(1);
  }
  return APP_PATH_PATTERN.test(pathname) ? pathname : '/';
}

export function createRouteHref(path: string, useHash = import.meta.env.PROD): string {
  return useHash ? `#${path}` : path;
}
