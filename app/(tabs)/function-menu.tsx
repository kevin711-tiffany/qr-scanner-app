import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  WebView,
  type WebViewNavigation,
} from 'react-native-webview';

import {
  AppHeader,
} from '@/components/app-header';

import {
  ScreenContainer,
} from '@/components/screen-container';

import {
  useBasicSettings,
} from '@/hooks/use-basic-settings';

import {
  encodeForm,
  normalizePostUrl,
} from '@/services/api-service';

import {
  buildFunctionMenuParams,
} from '@/services/function-menu-service';

type FunctionMenuRequest = {
  uri: string;
  method: 'POST';
  headers: {
    'Content-Type': string;
    Accept: string;
  };
  body: string;
};

export default function FunctionMenuScreen() {
  const {
    getStoredSettings,
  } = useBasicSettings();

  const [
    request,
    setRequest,
  ] = useState<FunctionMenuRequest | null>(
    null
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    currentUrl,
    setCurrentUrl,
  ] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadFunctionMenu =
        async () => {
          setIsLoading(true);
          setError(null);
          setCurrentUrl('');
          setRequest(null);

          try {
            const settings =
              await getStoredSettings();

            const sendUrl =
              settings.sendUrl.trim();

            if (!sendUrl) {
              throw new Error(
                '請先在設定頁掃描 QR Code 帶入傳送網址'
              );
            }

            const uri =
              normalizePostUrl(sendUrl);

            const params =
              buildFunctionMenuParams(
                settings
              );

            const body =
              encodeForm(params);

            if (!active) {
              return;
            }

            setRequest({
              uri,
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/x-www-form-urlencoded',
                Accept:
                  'text/html,application/xhtml+xml,*/*',
              },
              body,
            });
          } catch (cause) {
            if (!active) {
              return;
            }

            setError(
              cause instanceof Error
                ? cause.message
                : '功能選單載入失敗'
            );

            setIsLoading(false);
          }
        };

      void loadFunctionMenu();

      return () => {
        active = false;
      };
    }, [getStoredSettings])
  );

  const handleNavigationChange =
    useCallback(
      (
        navigation:
          WebViewNavigation
      ) => {
        setCurrentUrl(
          navigation.url
        );
      },
      []
    );

  return (
    <ScreenContainer>
      <AppHeader />

      {error ? (
        <View className="bg-error/10 p-4 m-4 rounded-lg">
          <Text className="text-error font-semibold mb-2">
            錯誤
          </Text>

          <Text className="text-error text-sm">
            {error}
          </Text>

          {currentUrl ? (
            <Text className="text-error text-sm mt-2">
              {currentUrl}
            </Text>
          ) : null}
        </View>
      ) : request ? (
        <View className="flex-1 bg-white overflow-hidden">
          <WebView
            source={request}
            originWhitelist={['*']}
            style={{
              flex: 1,
              backgroundColor:
                '#ffffff',
            }}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            setSupportMultipleWindows={
              false
            }
            mixedContentMode="always"
            onNavigationStateChange={
              handleNavigationChange
            }
            onLoadStart={({
              nativeEvent,
            }) => {
              setCurrentUrl(
                nativeEvent.url
              );

              setIsLoading(true);
              setError(null);
            }}
            onLoadEnd={({
              nativeEvent,
            }) => {
              setCurrentUrl(
                nativeEvent.url
              );

              setIsLoading(false);
            }}
            onHttpError={({
              nativeEvent,
            }) => {
              setCurrentUrl(
                nativeEvent.url
              );

              setError(
                `功能頁載入失敗（HTTP ${nativeEvent.statusCode}）`
              );

              setIsLoading(false);
            }}
            onError={({
              nativeEvent,
            }) => {
              setCurrentUrl(
                nativeEvent.url
              );

              setError(
                nativeEvent.description ||
                  '功能選單網頁載入失敗'
              );

              setIsLoading(false);
            }}
          />

          {isLoading ? (
            <View className="absolute inset-0 items-center justify-center bg-white">
              <ActivityIndicator
                size="large"
              />

              <Text className="text-muted mt-3">
                功能選單載入中...
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator
            size="large"
          />

          <Text className="text-muted mt-3">
            功能選單載入中...
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
}