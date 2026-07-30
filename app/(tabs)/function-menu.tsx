import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Platform,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  WebView,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from 'react-native-webview';

import Constants from 'expo-constants';

import {
  AppHeader,
} from '@/components/app-header';

import { NativeCameraModal } from '@/components/native-camera-modal';

import { webViewFileUploadCompatibilityScript } from '@/lib/webview-file-upload';
import {
  buildBridgeInfoResultScript,
  buildCameraResultScript,
  nativeBridgeBootstrapScript,
  parseNativeBridgeMessage,
  type NativeCameraResult,
} from '@/lib/native-bridge';


import {
  ScreenContainer,
} from '@/components/screen-container';

import {
  useBasicSettings,
} from '@/hooks/use-basic-settings';

import {
  subscribeTabReset,
} from '@/lib/tab-reset';

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
  const webViewRef = useRef<WebView>(null);

  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraRequestId, setCameraRequestId] = useState<string | undefined>();
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

  /*
   * 每次功能選單收到重置信號時增加此值。
   *
   * reloadKey 改變後，useFocusEffect 會重新執行，
   * 再次 POST 至 sendUrl，讓 WebView 回到功能選單首頁。
   */
  const [
    reloadKey,
    setReloadKey,
  ] = useState(0);

  /*
   * AppHeader 在目前已位於 /function-menu 時，
   * 再次點擊右上角選單 ICON，會送出：
   *
   * emitTabReset('function-menu')
   *
   * 此處接收訊號並重新載入功能選單。
   */
  useEffect(() => {
    const unsubscribe =
      subscribeTabReset(
        'function-menu',
        () => {
          setReloadKey(
            (currentValue) =>
              currentValue + 1
          );
        }
      );

    return unsubscribe;
  }, []);

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
    }, [
      getStoredSettings,
      reloadKey,
    ])
  );

  const handleBridgeMessage = useCallback((event: WebViewMessageEvent) => {
    const message = parseNativeBridgeMessage(event.nativeEvent.data);

    if (!message) return;

    switch (message.action) {
      case 'camera':
        setCameraRequestId(message.requestId);
        setCameraVisible(true);
        break;

      case 'version':
        webViewRef.current?.injectJavaScript(
          buildBridgeInfoResultScript('hojie:version-result', {
            requestId: message.requestId,
            version: Constants.expoConfig?.version ?? 'unknown',
          })
        );
        break;

      case 'platform':
        webViewRef.current?.injectJavaScript(
          buildBridgeInfoResultScript('hojie:platform-result', {
            requestId: message.requestId,
            platform: Platform.OS,
          })
        );
        break;

      default:
        webViewRef.current?.injectJavaScript(
          buildBridgeInfoResultScript('hojie:bridge-error', {
            requestId: message.requestId,
            action: message.action,
            message: `目前版本尚未啟用 ${message.action} 功能`,
          })
        );
    }
  }, []);

  const handleCameraCaptured = useCallback((result: NativeCameraResult) => {
    setCameraVisible(false);
    setCameraRequestId(undefined);
    webViewRef.current?.injectJavaScript(buildCameraResultScript(result));
  }, []);

  const handleCameraCancel = useCallback(() => {
    setCameraVisible(false);
    setCameraRequestId(undefined);
  }, []);

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
          <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-error font-semibold mb-2">
            錯誤
          </Text>

          <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-error text-sm">
            {error}
          </Text>

          {currentUrl ? (
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-error text-sm mt-2">
              {currentUrl}
            </Text>
          ) : null}
        </View>
      ) : request ? (
        <View className="flex-1 bg-white overflow-hidden">
          <WebView
            ref={webViewRef}
            /*
             * reloadKey 改變時重新建立 WebView，
             * 確保 POST 請求與網頁瀏覽紀錄完整重置。
             */
            key={`function-menu-${reloadKey}`}
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
            injectedJavaScriptBeforeContentLoaded={`
              ${nativeBridgeBootstrapScript}
              ${webViewFileUploadCompatibilityScript ?? ''}
              true;
            `}
            onMessage={handleBridgeMessage}
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

              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-muted mt-3">
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

          <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-muted mt-3">
            功能選單載入中...
          </Text>
        </View>
      )}

      <NativeCameraModal
        visible={cameraVisible}
        requestId={cameraRequestId}
        onCancel={handleCameraCancel}
        onCaptured={handleCameraCaptured}
      />
    </ScreenContainer>
  );
}