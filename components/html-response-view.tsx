import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface HtmlResponseViewProps {
  html: string;
}

// 以 WebView 渲染伺服器回應的 HTML 內容，支援 <br>、表格等 HTML 語法。
// 加上 viewport meta 讓文字在手機上以合理大小顯示。
// 支援伺服器回應中的自動跳轉：
// - JavaScript 導向（window.location.href = '...' / location.replace）
// - meta refresh（<meta http-equiv="refresh" content="0;url=...">）
// WebView 會直接載入目標網址並顯示該網頁。
const wrapHtml = (html: string) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: -apple-system, sans-serif; font-size: 16px; margin: 0; padding: 0; color: #11181C; }
</style>
</head>
<body>${html}</body>
</html>`;

export function HtmlResponseView({ html }: HtmlResponseViewProps) {
  if (Platform.OS === 'web') {
    // Web 預覽環境：使用 iframe srcdoc 呈現 HTML
    // 允許執行 script 以支援 JS 自動跳轉（sandbox 需開放 allow-scripts）
    return (
      <View className="flex-1 bg-white overflow-hidden">
        <iframe
          srcDoc={wrapHtml(html)}
          style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
          sandbox="allow-scripts allow-top-navigation-by-user-activation allow-popups"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white overflow-hidden">
      <WebView
        originWhitelist={['*']}
        source={{ html: wrapHtml(html) }}
        style={{ flex: 1, backgroundColor: '#ffffff' }}
        // 開啟 JS 執行，讓伺服器回應中的 location.href 自動跳轉生效
        javaScriptEnabled
        // 支援 meta refresh 與 JS 導向到外部網址
        setSupportMultipleWindows={false}
      />
    </View>
  );
}
