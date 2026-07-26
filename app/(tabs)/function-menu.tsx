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

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setIsLoading(true);
      setError(null);

      void (async () => {
        try {
          const settings = await getStoredSettings();
          if (!settings.sendUrl.trim()) throw new Error('請先在設定頁掃描 QR Code 帶入傳送網址');
          const content = await fetchFunctionMenuHtml(settings);
          if (active) setHtml(content);
        } catch (cause) {
          if (active) setError(cause instanceof Error ? cause.message : '功能選單載入失敗');
        } finally {
          if (active) setIsLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [getStoredSettings])
  );

  return (
    <ScreenContainer>
      <AppHeader showFunctionMenu={false} />
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">功能選單載入中...</Text>
        </View>
      ) : error ? (
        <View className="bg-error/10 p-4 m-4 rounded-lg">
          <Text className="text-error font-semibold mb-2">錯誤</Text>
          <Text className="text-error text-sm">{error}</Text>
        </View>
      ) : (
        <HtmlResponseView html={html} />
      )}
    </ScreenContainer>
  );
}
