export const normalizePostUrl = (rawUrl: string): string => {
  const url = rawUrl.trim();
  if (!url || url.includes('?') || url.includes('#') || url.endsWith('/')) return url;

  const protocolIndex = url.indexOf('://');
  const pathStart = url.indexOf('/', protocolIndex >= 0 ? protocolIndex + 3 : 0);
  if (pathStart === -1) return `${url}/`;

  const lastSegment = url.slice(url.lastIndexOf('/') + 1);
  return lastSegment.includes('.') ? url : `${url}/`;
};

export const encodeForm = <T extends object>(params: T): string => {
  const toPlainValue = (value: unknown): string => {
    if (value == null) return '';
    if (Array.isArray(value)) return value.length > 0 ? toPlainValue(value[0]) : '';
    return String(value).replace(/[,\s]+$/, '');
  };

  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(toPlainValue(value))}`)
    .join('&');
};

export async function postFormForHtml<T extends object>(rawUrl: string, params: T): Promise<string> {
  const url = normalizePostUrl(rawUrl);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html,application/xhtml+xml,*/*',
    },
    body: encodeForm(params),
  });
  return response.text();
}
