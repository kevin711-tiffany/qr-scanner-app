import { describe, it, expect } from 'vitest';

// 與 hooks/use-web-view.ts 中 normalizeUrl 相同的邏輯（hook 無法在 node 環境直接呼叫，故複製驗證）
function normalizeUrl(rawUrl: string): string {
  const url = rawUrl.trim();
  if (url.includes('?') || url.includes('#')) return url;
  if (url.endsWith('/')) return url;
  const protocolIndex = url.indexOf('://');
  const pathStart = url.indexOf('/', protocolIndex >= 0 ? protocolIndex + 3 : 0);
  if (pathStart === -1) return `${url}/`;
  const lastSegment = url.slice(url.lastIndexOf('/') + 1);
  if (lastSegment.includes('.')) return url;
  return `${url}/`;
}

describe('normalizeUrl 防呆機制', () => {
  it('目錄形式網址應自動補上結尾斜線', () => {
    expect(normalizeUrl('http://59.126.88.156/mr')).toBe('http://59.126.88.156/mr/');
    expect(normalizeUrl('https://example.com/api/receive')).toBe('https://example.com/api/receive/');
  });

  it('純網域網址應補上斜線', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('有副檔名的網址不應變更', () => {
    expect(normalizeUrl('http://59.126.88.156/mr/index.php')).toBe('http://59.126.88.156/mr/index.php');
    expect(normalizeUrl('https://example.com/receive.asp')).toBe('https://example.com/receive.asp');
  });

  it('已以斜線結尾的網址不應變更', () => {
    expect(normalizeUrl('http://59.126.88.156/mr/')).toBe('http://59.126.88.156/mr/');
  });

  it('含 query string 或 hash 的網址不應變更', () => {
    expect(normalizeUrl('http://example.com/mr?a=1')).toBe('http://example.com/mr?a=1');
    expect(normalizeUrl('http://example.com/mr#top')).toBe('http://example.com/mr#top');
  });

  it('前後空白應被移除', () => {
    expect(normalizeUrl('  http://59.126.88.156/mr  ')).toBe('http://59.126.88.156/mr/');
  });
});
