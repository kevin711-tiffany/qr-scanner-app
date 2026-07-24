import { useState } from 'react';

export interface WebViewData {
  url: string;
  content: string;
  isLoading: boolean;
  error: string | null;
}

export function useWebView() {
  const [webViewData, setWebViewData] = useState<WebViewData>({
    url: '',
    content: '',
    isLoading: false,
    error: null,
  });

  // 防呆機制：目錄形式的網址（結尾無斜線且最後一段沒有副檔名、無 query string）
  // 會被伺服器 301 重導向到加斜線的網址，導致 POST 變成 GET、參數遺失。
  // 這裡自動補上結尾斜線來避免此問題。
  // 例：http://59.126.88.156/mr → http://59.126.88.156/mr/
  //     http://example.com/receive.php → 不變（有副檔名）
  //     http://example.com/mr/?a=1 → 不變（有 query string）
  const normalizeUrl = (rawUrl: string): string => {
    const url = rawUrl.trim();
    // 有 query string 或 hash 就不處理
    if (url.includes('?') || url.includes('#')) return url;
    // 已經以斜線結尾就不處理
    if (url.endsWith('/')) return url;
    // 取出網域後的路徑部分
    const protocolIndex = url.indexOf('://');
    const pathStart = url.indexOf('/', protocolIndex >= 0 ? protocolIndex + 3 : 0);
    // 沒有路徑（純網域）：補上斜線
    if (pathStart === -1) return `${url}/`;
    // 最後一段路徑若含「.」視為檔案（如 .php、.asp），不補斜線
    const lastSegment = url.slice(url.lastIndexOf('/') + 1);
    if (lastSegment.includes('.')) return url;
    // 目錄形式：補上結尾斜線
    return `${url}/`;
  };

  // 發送 POST 請求並取得網頁內容
  // 使用傳統表單格式（application/x-www-form-urlencoded），
  // 讓 PHP 伺服器端可直接用 $_POST 讀取參數
  const fetchWebContent = async (
    rawUrl: string,
    params: Record<string, any>,
    method: 'POST' | 'GET' = 'POST'
  ) => {
    const url = normalizeUrl(rawUrl);
    setWebViewData((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      // 以 encodeURIComponent 手動組出 application/x-www-form-urlencoded 字串，
      // 避免 React Native 環境下 URLSearchParams / axios transformRequest 的相容性問題，
      // 確保 PHP 端可用 $_POST 直接讀取
      // 參數值一律轉為純字串：
      // - 陣列只取第一個元素（避免被 join 成 "A," 這類含逗號的值）
      // - 去除值尾端多餘的逗號與空白，確保如 usetype 傳出的是 "A" 而非 "A,"
      const toPlainValue = (value: any): string => {
        if (value == null) return '';
        if (Array.isArray(value)) {
          return value.length > 0 ? toPlainValue(value[0]) : '';
        }
        return String(value).replace(/[,\s]+$/, '');
      };
      const encodedBody = Object.entries(params)
        .map(
          ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(toPlainValue(value))}`
        )
        .join('&');

      let response: Response;
      if (method === 'POST') {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'text/html,application/xhtml+xml,*/*',
          },
          body: encodedBody,
        });
      } else {
        const joiner = url.includes('?') ? '&' : '?';
        response = await fetch(`${url}${joiner}${encodedBody}`, { method: 'GET' });
      }

      const content = await response.text();
      setWebViewData({
        url,
        content,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setWebViewData((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  };

  // 清除網頁內容
  const clearContent = () => {
    setWebViewData({
      url: '',
      content: '',
      isLoading: false,
      error: null,
    });
  };

  return {
    webViewData,
    fetchWebContent,
    clearContent,
  };
}
