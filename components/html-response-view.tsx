import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ANDROID_FILE_UPLOAD_COMPATIBILITY_SCRIPT } from '@/lib/webview-file-upload';

interface HtmlResponseViewProps {
  html: string;
  baseUrl?: string;
}

const escapeHtmlAttribute = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const normalizeBaseUrl = (rawUrl?: string): string | undefined => {
  const url = rawUrl?.trim();
  if (!url) return undefined;

  try {
    return new URL('.', url).toString();
  } catch {
    return undefined;
  }
};

const buildDocument = (html: string, baseUrl?: string): string => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const baseTag = normalizedBaseUrl
    ? `<base href="${escapeHtmlAttribute(normalizedBaseUrl)}" />`
    : '';
  const headContent = `${baseTag}
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 16px;
    margin: 0;
    padding: 0;
    color: #11181c;
  }
</style>`;

  // 伺服器若已回傳完整 HTML 文件，就只補入 head，避免形成巢狀 html/body。
  if (/<html[\s>]/i.test(html)) {
    if (/<head[\s>]/i.test(html)) {
      return html.replace(/<head([^>]*)>/i, `<head$1>${headContent}`);
    }

    return html.replace(/<html([^>]*)>/i, `<html$1><head>${headContent}</head>`);
  }

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>${headContent}</head>
<body>${html}</body>
</html>`;
};

export function HtmlResponseView({ html, baseUrl }: HtmlResponseViewProps) {
  const documentHtml = buildDocument(html, baseUrl);
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  if (Platform.OS === 'web') {
    return (
      <View className="flex-1 bg-white overflow-hidden">
        <iframe
          srcDoc={documentHtml}
          style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
          sandbox="allow-forms allow-same-origin allow-scripts allow-top-navigation-by-user-activation allow-popups"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white overflow-hidden">
      <WebView
        originWhitelist={['http://*', 'https://*', 'about:*', 'data:*']}
        source={
          normalizedBaseUrl
            ? { html: documentHtml, baseUrl: normalizedBaseUrl }
            : { html: documentHtml }
        }
        style={{ flex: 1, backgroundColor: '#ffffff' }}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures
        injectedJavaScriptBeforeContentLoaded={
          Platform.OS === 'android'
            ? ANDROID_FILE_UPLOAD_COMPATIBILITY_SCRIPT
            : undefined
        }
        injectedJavaScript={
          Platform.OS === 'android'
            ? ANDROID_FILE_UPLOAD_COMPATIBILITY_SCRIPT
            : undefined
        }
      />
    </View>
  );
}