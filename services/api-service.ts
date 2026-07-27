export interface HtmlResponseData {
  content: string;
  url: string;
}

export const normalizePostUrl = (rawUrl: string): string => {
  const url = rawUrl.trim();

  if (
    !url ||
    url.includes('?') ||
    url.includes('#') ||
    url.endsWith('/')
  ) {
    return url;
  }

  const protocolIndex = url.indexOf('://');
  const pathStart = url.indexOf(
    '/',
    protocolIndex >= 0 ? protocolIndex + 3 : 0
  );

  if (pathStart === -1) {
    return `${url}/`;
  }

  const lastSegment = url.slice(url.lastIndexOf('/') + 1);

  return lastSegment.includes('.') ? url : `${url}/`;
};

export const encodeForm = <T extends object>(params: T): string => {
  const toPlainValue = (value: unknown): string => {
    if (value == null) {
      return '';
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? toPlainValue(value[0]) : '';
    }

    return String(value).replace(/[,\s]+$/, '');
  };

  return Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(
          toPlainValue(value)
        )}`
    )
    .join('&');
};

const postForm = async <T extends object>(
  rawUrl: string,
  params: T
): Promise<Response> => {
  const url = normalizePostUrl(rawUrl);

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html,application/xhtml+xml,*/*',
    },
    body: encodeForm(params),
  });
};

export async function postFormForHtml<T extends object>(
  rawUrl: string,
  params: T
): Promise<string> {
  const response = await postForm(rawUrl, params);

  return response.text();
}

export async function postFormForHtmlResponse<T extends object>(
  rawUrl: string,
  params: T
): Promise<HtmlResponseData> {
  const response = await postForm(rawUrl, params);
  const content = await response.text();

  return {
    content,
    url: response.url || normalizePostUrl(rawUrl),
  };
}