import { GRAPH_DEFAULTS } from '../../shared/constants';

export function normalizeUrl(rawUrl?: string): string {
  const fallback = GRAPH_DEFAULTS.fallbackUrl;

  if (!rawUrl || !rawUrl.trim()) {
    return fallback;
  }

  try {
    const url = new URL(rawUrl);

    url.hash = '';

    if (
      (url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')
    ) {
      url.port = '';
    }

    const normalizedPathname = url.pathname.replace(/\/+$/, '') || '/';
    url.pathname = normalizedPathname;

    const sortedParams = new URLSearchParams(url.search);
    const entries = Array.from(sortedParams.entries()).sort(([a], [b]) => a.localeCompare(b));

    url.search = entries.length ? `?${new URLSearchParams(entries).toString()}` : '';

    return url.toString();
  } catch {
    return rawUrl.trim() || fallback;
  }
}

export function getDisplayTitle(title?: string, url?: string): string {
  if (title && title.trim()) {
    return title.trim();
  }

  if (url && url.trim()) {
    return url.trim();
  }

  return GRAPH_DEFAULTS.fallbackTitle;
}