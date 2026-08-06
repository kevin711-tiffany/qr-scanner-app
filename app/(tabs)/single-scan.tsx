import { Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '@/components/screen-container';
import { AppHeader } from '@/components/app-header';
import { HtmlResponseView } from '@/components/html-response-view';
import { useBasicSettings } from '@/hooks/use-basic-settings';
import { useWebView } from '@/hooks/use-web-view';
import { useTabReset } from '@/hooks/use-tab-reset';
import { haptic } from '@/lib/haptics';
import { playScanSuccessFeedback, preloadScanSound } from '@/lib/scan-feedback';

/**
 * 單獨掃描分頁：掃描到單一 QR Code 後立即自動傳送（usetype=D），
 * 不需按任何按鈕，傳送完成後直接顯示伺服器回應結果。
 * 不論掃描內容為文字或網址，都交由 PHP 處理並顯示伺服器回應結果。
 */
export default function SingleScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const { loadSettings, getStoredSettings } = useBasicSettings();
  const { fetchWebContent, webViewData } = useWebView();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  // 防止相機連續觸發掃描事件造成重複送出
  const processingRef = useRef(false);

  // 每次進入分頁時重置回初始掃描畫面
  useFocusEffect(
    useCallback(() => {
      setShowWebView(false);
      setIsSubmitting(false);
      setErrorText(null);
      processingRef.current = false;
      // 重新載入已儲存設定，確保拿到設定頁最新儲存的傳送網址
      loadSettings();
    }, [loadSettings])
  );

  // 已在單獨掃描分頁時再次點擊「單獨掃描」按鈕：重置回初始掃描畫面
  useTabReset('single-scan', () => {
    setShowWebView(false);
    setIsSubmitting(false);
    setErrorText(null);
    processingRef.current = false;
    loadSettings();
  });

  // 請求相機權限
  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // 預先載入提示音，讓第一次掃描的音效不延遲
  useEffect(() => {
    preloadScanSound();
  }, []);

  const handleBarCodeScanned = async (result: any) => {
    if (processingRef.current) return;
    processingRef.current = true;

    const scannedValue = String(result?.data ?? '');
    if (!scannedValue) {
      processingRef.current = false;
      return;
    }

    playScanSuccessFeedback();

    // 送出時直接從本地儲存讀取最新設定，避免 state 過期
    const currentSettings = await getStoredSettings();

    if (!currentSettings.sendUrl || !currentSettings.sendUrl.trim()) {
      setErrorText('請先在設定中輸入傳送網址');
      // 3 秒後允許重新掃描
      setTimeout(() => {
        setErrorText(null);
        processingRef.current = false;
      }, 3000);
      return;
    }

    setIsSubmitting(true);
    setErrorText(null);

    try {
      const paramD = {
        code: currentSettings.code,
        remark1: currentSettings.remark1,
        remark2: currentSettings.remark2,
        remark3: currentSettings.remark3,
        scannedData: scannedValue,
        usetype: 'D',
      };

      const success = await fetchWebContent(currentSettings.sendUrl, paramD);

      if (success) {
        haptic.success();
        // 不在 App 端判斷 scannedData 是否為網址，統一顯示 PHP 回傳內容。
        // 若 PHP 判斷為網址，可在回傳 HTML 中輸出可點擊連結。
        setShowWebView(true);
      } else {
        haptic.error();
        setErrorText('無法連接到指定網址');
        setTimeout(() => {
          setErrorText(null);
          processingRef.current = false;
        }, 3000);
      }
    } catch (error) {
      haptic.error();
      setErrorText(error instanceof Error ? error.message : '發生未知錯誤');
      setTimeout(() => {
        setErrorText(null);
        processingRef.current = false;
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showWebView) {
    return (
      <ScreenContainer>
        <AppHeader />

        {webViewData.error ? (
          <View className="bg-error/10 p-4 m-4 rounded-lg">
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-error font-semibold mb-2">錯誤</Text>
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-error text-sm">{webViewData.error}</Text>
          </View>
        ) : (
          <HtmlResponseView html={webViewData.content} baseUrl={webViewData.url} />
        )}
      </ScreenContainer>
    );
  }

  if (!permission) {
    return (
      <ScreenContainer className="items-center justify-center p-4">
        <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-foreground text-center mb-4">需要相機權限</Text>
        <Pressable onPress={requestPermission} className="bg-primary rounded-lg p-4">
          <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white font-bold">授予權限</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer className="items-center justify-center p-4">
        <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-foreground text-center mb-4">相機權限被拒絕</Text>
        <Pressable onPress={requestPermission} className="bg-primary rounded-lg p-4">
          <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white font-bold">重新請求權限</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* 固定版頭 */}
        <AppHeader />

        {/* 相機預覽 */}
        <View className="flex-1 relative bg-black">
          {/* 僅在此分頁為焦點時掛載相機：切換到其他分頁自動關閉相機以節省電力 */}
          {isFocused ? (
            <CameraView
              onBarcodeScanned={isSubmitting ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              style={{ flex: 1 }}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white/70">相機已暫停</Text>
            </View>
          )}

          {/* 掃描框 */}
          <View className="absolute inset-0 items-center justify-center pointer-events-none">
            <View className="w-64 h-64 border-4 border-primary rounded-lg" />
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white mt-4 text-center">
              對準 QR Code，掃描後立即傳送
            </Text>
          </View>

          {/* 錯誤提示橫幅 */}
          {errorText && (
            <View className="absolute top-4 left-4 right-4 px-4 py-2 rounded-lg bg-white/95">
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="font-bold text-center text-red-600">{errorText}</Text>
            </View>
          )}

          {/* 傳送中 overlay：防止重複觸發 */}
          {isSubmitting && (
            <View className="absolute inset-0 bg-black/60 items-center justify-center">
              <ActivityIndicator size="large" color="#ffffff" />
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white font-bold text-lg mt-4">傳送中...</Text>
            </View>
          )}
        </View>

        {/* 說明文字 */}
        <View className="bg-surface border-t border-border p-4">
          <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-muted text-center text-sm">
            單獨掃描模式：掃描到 QR Code 後會立即自動傳送資料
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}