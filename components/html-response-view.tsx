import { Linking, Platform, View } from 'react-native';
import {
  WebView,
  type WebViewNavigation,
} from 'react-native-webview';

import { webViewFileUploadCompatibilityScript } from '@/lib/webview-file-upload';

interface HtmlResponseViewProps {
  html: string;
  baseUrl?: string;
}

interface WebViewOpenWindowEvent {
  nativeEvent: {
    targetUrl: string;
  };
}

const escapeHtmlAttribute = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const normalizeBaseUrl = (rawUrl?: string): string | undefined => {
  const url = rawUrl?.trim();

  if (!url) {
    return undefined;
  }

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

  if (/<html[\s>]/i.test(html)) {
    if (/<head[\s>]/i.test(html)) {
      return html.replace(
        /<head([^>]*)>/i,
        `<head$1>${headContent}`
      );
    }

    return html.replace(
      /<html([^>]*)>/i,
      `<html$1><head>${headContent}</head>`
    );
  }

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>${headContent}</head>
<body>${html}</body>
</html>`;
};

export function HtmlResponseView({
  html,
  baseUrl,
}: HtmlResponseViewProps) {
  const documentHtml = buildDocument(html, baseUrl);
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  if (Platform.OS === 'web') {
    return (
      <View className="flex-1 bg-white overflow-hidden">
        <iframe
          srcDoc={documentHtml}
          style={{
            flex: 1,
            border: 'none',
            width: '100%',
            height: '100%',
          }}
          sandbox="allow-forms allow-same-origin allow-scripts allow-top-navigation-by-user-activation allow-popups"
        />
      </View>
    );
  }

  const openExternalUrl = async (url: string): Promise<void> => {
    try {
      const canOpen = await Linking.canOpenURL(url);

      if (!canOpen) {
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.warn('無法開啟外部網址：', error);
    }
  };

  const handleShouldStartLoad = (
    request: WebViewNavigation
  ): boolean => {
    const requestUrl = request.url;

    if (
      requestUrl === 'about:blank' ||
      requestUrl.startsWith('data:text/html')
    ) {
      return true;
    }

    if (
      request.navigationType === 'click' &&
      /^https?:\/\//i.test(requestUrl)
    ) {
      void openExternalUrl(requestUrl);
      return false;
    }

    return true;
  };

  const handleOpenWindow = (
    event: WebViewOpenWindowEvent
  ): void => {
    const targetUrl = event.nativeEvent.targetUrl;

    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
      return;
    }

    void openExternalUrl(targetUrl);
  };

  return (
    <View className="flex-1 bg-white overflow-hidden">
      <WebView
        originWhitelist={[
          'http://*',
          'https://*',
          'about:*',
          'data:*',
        ]}
        source={
          normalizedBaseUrl
            ? {
                html: documentHtml,
                baseUrl: normalizedBaseUrl,
              }
            : {
                html: documentHtml,
              }
        }
        style={{
          flex: 1,
          backgroundColor: '#ffffff',
        }}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        mixedContentMode="always"
        setSupportMultipleWindows
        allowsBackForwardNavigationGestures
        injectedJavaScriptBeforeContentLoaded={
          webViewFileUploadCompatibilityScript
        }
        onShouldStartLoadWithRequest={
          handleShouldStartLoad
        }
        onOpenWindow={handleOpenWindow}
      />
    </View>
  );
}