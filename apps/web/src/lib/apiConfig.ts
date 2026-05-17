const rawApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export function getApiBaseUrl(): string {
  if (!rawApiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured.');
  }

  return rawApiUrl.replace(/\/+$/, '');
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
