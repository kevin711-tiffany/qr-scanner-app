import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AppHeader } from '@/components/app-header';
import { HtmlResponseView } from '@/components/html-response-view';
import { ScreenContainer } from '@/components/screen-container';
import { useBasicSettings } from '@/hooks/use-basic-settings';
import { fetchFunctionMenuHtml } from '@/services/function-menu-service';

export default function FunctionMenuScreen() {
  const { getStoredSettings } = useBasicSettings();

  const [html, setHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadFunctionMenu = async () => {
        setIsLoading(true);
        setError(null);

        try {
          const settings = await getStoredSettings();
          const sendUrl = settings.sendUrl.trim();

          if (!sendUrl) {
            throw new Error(
              '請先在設定頁掃描 QR Code 帶入傳送網址'
            );
          }

          const response = await fetchFunctionMenuHtml(settings);

          if (!active) {
            return;
          }

          /*
           * fetchFunctionMenuHtml 回傳 HtmlResponseData，
           * 真正的 HTML 字串位於 content 欄位。
           */
          setHtml(response.content);

          /*
           * WebView 顯示 HTML 字串時，必須保留原始伺服器網址，
           * 才能正確解析 photo.php、upload.php 等相對路徑。
           */
          setBaseUrl(response.url || sendUrl);
        } catch (cause) {
          if (!active) {
            return;
          }

          setHtml('');
          setBaseUrl('');

          setError(
            cause instanceof Error
              ? cause.message
              : '功能選單載入失敗'
          );
        } finally {
          if (active) {
            setIsLoading(false);
          }
        }
      };

      void loadFunctionMenu();

      return () => {
        active = false;
      };
    }, [getStoredSettings])
  );

  return (
    <ScreenContainer>
      <AppHeader />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">
            功能選單載入中...
          </Text>
        </View>
      ) : error ? (
        <View className="bg-error/10 p-4 m-4 rounded-lg">
          <Text className="text-error font-semibold mb-2">
            錯誤
          </Text>

          <Text className="text-error text-sm">
            {error}
          </Text>
        </View>
      ) : (
        <HtmlResponseView
          html={html}
          baseUrl={baseUrl}
        />
      )}
    </ScreenContainer>
  );
}