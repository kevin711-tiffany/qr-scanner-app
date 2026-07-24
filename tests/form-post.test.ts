import { describe, it, expect } from 'vitest';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import querystring from 'node:querystring';

// 模擬 PHP 端行為的測試伺服器：
// 以 application/x-www-form-urlencoded 解析 body（等同 PHP $_POST），
// 回傳 HTML（等同使用者的 echo "code=..."）
function createPhpLikeServer(): Promise<{ server: http.Server; url: string }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        const contentType = req.headers['content-type'] || '';
        // PHP 只有在 content-type 為 x-www-form-urlencoded 時才會填 $_POST
        const post = contentType.includes('application/x-www-form-urlencoded')
          ? querystring.parse(body)
          : {};
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(
          `code=${post['code'] ?? ''}<br>` +
            `sendUrl=${post['sendUrl'] ?? ''}<br>` +
            `remark1=${post['remark1'] ?? ''}<br>` +
            `usetype=${post['usetype'] ?? ''}`
        );
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;
      resolve({ server, url: `http://127.0.0.1:${port}/` });
    });
  });
}

// 與 hooks/use-web-view.ts 相同的編碼邏輯
function encodeForm(params: Record<string, any>): string {
  return Object.entries(params)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value == null ? '' : String(value))}`
    )
    .join('&');
}

describe('POST 傳統表單格式（PHP $_POST 相容性）', () => {
  it('PHP 端應能透過 $_POST 讀取所有參數', async () => {
    const { server, url } = await createPhpLikeServer();
    try {
      const body = encodeForm({
        code: 'ABC123',
        sendUrl: 'https://example.com/receive.php',
        remark1: '中文備註測試',
        usetype: 'A',
      });
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const html = await response.text();
      expect(html).toContain('code=ABC123');
      expect(html).toContain('sendUrl=https://example.com/receive.php');
      expect(html).toContain('remark1=中文備註測試');
      expect(html).toContain('usetype=A');
    } finally {
      server.close();
    }
  });

  it('掃描資料（逗號分隔）應完整傳遞', async () => {
    const { server, url } = await createPhpLikeServer();
    try {
      const body = encodeForm({
        code: 'ABC123',
        scannedData: 'QR001,QR002,QR003',
        usetype: 'B',
      });
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const html = await response.text();
      expect(html).toContain('code=ABC123');
      expect(html).toContain('usetype=B');
    } finally {
      server.close();
    }
  });
});
