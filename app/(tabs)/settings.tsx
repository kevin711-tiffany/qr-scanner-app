import { ScrollView, Text, View, Pressable, Alert, Switch } from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '@/components/screen-container';
import { AppHeader } from '@/components/app-header';
import { HtmlResponseView } from '@/components/html-response-view';
import { useBasicSettings } from '@/hooks/use-basic-settings';
import { useWebView } from '@/hooks/use-web-view';
import { useTabReset } from '@/hooks/use-tab-reset';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { getSoundEnabled, setSoundEnabled, playScanSuccessFeedback, preloadScanSound } from '@/lib/scan-feedback';
import { decryptSettingsQr } from '@/lib/qr-setting-crypto';

// 解析掃描到的 QR Code 內容，支援兩種格式：
// 1. JSON 格式：{"code":"A01","sendUrl":"http://...","remark1":"...","remark2":"...","remark3":"..."}
// 2. 分隔符號格式（; 或 , 或換行，依序為 代碼;傳送網址;備註一;備註二;備註三）
// 注意：解析結果一律回傳完整五個欄位（缺少或空值的欄位以空字串表示），
// 帶入時完全覆蓋原本設定，以最新掃描到的資料為準
export function parseSettingsQr(raw: string): {
  code: string;
  sendUrl: string;
  remark1: string;
  remark2: string;
  remark3: string;
} | null {
  const text = raw.trim();
  if (!text) return null;

  // 嘗試 JSON 格式
  if (text.startsWith('{')) {
    try {
      const obj = JSON.parse(text);
      const pick = (key: string, isUrl = false): string => {
        const value = typeof obj[key] === 'string' ? obj[key] : '';
        return isUrl ? value.trim() : value.slice(0, 30);
      };
      const hasAnyField = ['code', 'sendUrl', 'remark1', 'remark2', 'remark3'].some(
        (key) => typeof obj[key] === 'string' && obj[key] !== ''
      );
      if (!hasAnyField) return null;
      return {
        code: pick('code'),
        sendUrl: pick('sendUrl', true),
        remark1: pick('remark1'),
        remark2: pick('remark2'),
        remark3: pick('remark3'),
      };
    } catch {
      return null;
    }
  }

  // 純網址：帶入傳送網址，其餘欄位清空
  if (/^https?:\/\//i.test(text) && !text.includes(';') && !text.includes('\n')) {
    return { code: '', sendUrl: text, remark1: '', remark2: '', remark3: '' };
  }

  // 分隔符號格式：代碼;傳送網址;備註一;備註二;備註三
  const parts = text.split(/[;\n]/).map((p) => p.trim());
  if (parts.length >= 2) {
    return {
      code: (parts[0] ?? '').slice(0, 30),
      sendUrl: parts[1] ?? '',
      remark1: (parts[2] ?? '').slice(0, 30),
      remark2: (parts[3] ?? '').slice(0, 30),
      remark3: (parts[4] ?? '').slice(0, 30),
    };
  }

  return null;
}

export default function SettingsScreen() {
  const { settings, saveSettings, updateField, applyFields, isLoading } = useBasicSettings();
  const { fetchWebContent, webViewData } = useWebView();
  const [isSaving, setIsSaving] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scanLockRef = useRef(false);
  const [soundOn, setSoundOn] = useState(true);
  const isConfigured = settings.code.trim() !== '';

  // 每次進入設定分頁時重置回基本資料表單畫面（不停留在上次的傳送結果或掃描頁）
  useFocusEffect(
    useCallback(() => {
      setShowWebView(false);
      setShowScanner(false);
      // 載入音效開關設定
      getSoundEnabled().then(setSoundOn);
    }, [])
  );

  // 已在設定分頁時再次點擊「設定」按鈕：重置回基本資料表單畫面
  useTabReset('settings', () => {
    setShowWebView(false);
    setShowScanner(false);
  });

  // 切換掃描提示音效開關
  const toggleSound = async (value: boolean) => {
    setSoundOn(value);
    await setSoundEnabled(value);
    haptic.light();
  };

  // 開啟掃描器（必要時先請求相機權限）
  const openScanner = async () => {
    haptic.light();
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('錯誤', '需要相機權限才能掃描 QR Code');
        return;
      }
    }
    scanLockRef.current = false;
    setShowScanner(true);
    // 預先載入提示音，讓掃描成功的音效不延遲
    preloadScanSound();
  };

  // 處理設定 QR Code 掃描結果
  const handleSettingsQrScanned = (result: any) => {
    if (scanLockRef.current) return;
    scanLockRef.current = true;

    setShowScanner(false);

    try {
      const decryptedText = decryptSettingsQr(result.data ?? '');
      const parsed = parseSettingsQr(decryptedText);

      if (!parsed) {
        throw new Error('解密後的設定資料格式錯誤');
      }

      // 加密 QR Code 只寫入 code、sendUrl、remark1、remark2；remark3 保留原設定。
      const importedSettings = {
        ...settings,
        code: parsed.code,
        sendUrl: parsed.sendUrl,
        remark1: parsed.remark1,
        remark2: parsed.remark2,
      };

      applyFields(importedSettings);
      playScanSuccessFeedback();
      void performSave(importedSettings);
    } catch (error) {
      haptic.error();
      Alert.alert(
        '格式錯誤',
        error instanceof Error ? error.message : '無法讀取此設定 QR Code'
      );
    }
  };

  // 儲存前驗證網址是否可連線（任何 HTTP 回應皆視為可連線，僅網路層錯誤視為失敗）
  const checkUrlReachable = async (rawUrl: string): Promise<boolean> => {
    try {
      const url = rawUrl.trim();
      if (!/^https?:\/\//i.test(url)) return false;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      await fetch(url, { method: 'GET', signal: controller.signal });
      clearTimeout(timer);
      return true;
    } catch {
      return false;
    }
  };

  // 執行儲存流程：驗證網址 → 本地儲存 → 傳送 usetype=A → 顯示回應網頁
  const performSave = async (target: typeof settings) => {
    if (!target.sendUrl.trim()) {
      Alert.alert('錯誤', '請輸入傳送網址');
      return;
    }

    setIsSaving(true);
    haptic.light();

    try {
      // 步驟 1：先驗證網址是否可連線，不可連線則不儲存
      const reachable = await checkUrlReachable(target.sendUrl);
      if (!reachable) {
        Alert.alert(
          '無法連線到設定的伺服器',
          '請確認：\n• Wi-Fi 或行動網路是否正常\n• 伺服器目前可能己下班，請於上班時間再連線'
        );
        haptic.error();
        return;
      }

      // 步驟 2：將所有欄位儲存於手機本地，方便日後 APP 讀取
      await saveSettings(target);

      // 步驟 3：準備傳送參數（含 usetype=A）
      const paramA = {
        code: target.code,
        sendUrl: target.sendUrl,
        remark1: target.remark1,
        remark2: target.remark2,
        remark3: target.remark3,
        usetype: 'A',
      };

      // 步驟 4：傳送到指定 URL 測試設定是否正確
      const success = await fetchWebContent(target.sendUrl, paramA);

      if (success) {
        haptic.success();
        setShowWebView(true);
      } else {
        Alert.alert(
          '無法連線到設定的伺服器',
          '請確認：\n• Wi-Fi 或行動網路是否正常\n• 伺服器目前可能己下班，請於上班時間再連線'
        );
        haptic.error();
      }
    } catch (error) {
      Alert.alert('錯誤', error instanceof Error ? error.message : '發生未知錯誤');
      haptic.error();
    } finally {
      setIsSaving(false);
    }
  };

  // 手動按「儲存設定」按鈕：以目前表單內容執行儲存流程
  const handleSave = () => performSave(settings);

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-foreground">載入中...</Text>
      </ScreenContainer>
    );
  }

  // 掃描 QR Code 帶入設定
  if (showScanner) {
    return (
      <ScreenContainer>
        <View className="flex-1">
          <AppHeader>
            <Pressable
              onPress={() => setShowScanner(false)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-primary font-semibold">返回設定</Text>
            </Pressable>
          </AppHeader>
          <View className="flex-1 relative bg-black">
            <CameraView
              onBarcodeScanned={handleSettingsQrScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              style={{ flex: 1 }}
            />
            <View className="absolute inset-0 items-center justify-center pointer-events-none">
              <View className="w-64 h-64 border-4 border-primary rounded-lg" />
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white mt-4 text-center">對準設定用 QR Code</Text>
            </View>
          </View>
          <View className="p-4 bg-surface border-t border-border">
            <Pressable
              onPress={() => setShowScanner(false)}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              className="bg-error/20 rounded-lg p-4 items-center"
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-error font-semibold">取消掃描</Text>
            </Pressable>
          </View>
        </View>
      </ScreenContainer>
    );
  }

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

  return (
    <ScreenContainer>
      <AppHeader />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-6">
          {/* 標題 */}
          <View>
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-2xl font-bold text-foreground mb-2">基本資料設定</Text>
          </View>

          {/* 掃描 QR Code 帶入設定 */}
          <Pressable
            onPress={openScanner}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            className="border border-primary rounded-lg p-3 items-center bg-primary/5"
          >
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-primary font-semibold">掃描 QR Code 設定資料</Text>
          </Pressable>

          {/* 掃描提示音效開關 */}
          <View className="flex-row items-center justify-between bg-surface border border-border rounded-lg p-4">
            <View className="flex-1 mr-3">
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-foreground font-semibold">掃描提示音效</Text>
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-muted text-xs mt-1">
                {soundOn ? '掃描成功時播放提示音' : '已關閉，掃描成功時以震動回饋'}
              </Text>
            </View>
            <Switch
              value={soundOn}
              onValueChange={toggleSound}
              trackColor={{ false: '#d1d5db', true: '#0a7ea4' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* code 與備註欄位已隱藏，資料仍保留並照常傳送。 */}

          {/* 設定狀態：放在儲存按鈕上方 */}
          <View className="items-center bg-surface border border-border rounded-2xl p-5">
            <Image
              source={
                isConfigured
                  ? require('@/assets/images/unlock1.jpg')
                  : require('@/assets/images/lock1.jpg')
              }
              style={{ width: 190, height: 190 }}
              contentFit="contain"
            />

            <Text
              allowFontScaling={false}
              maxFontSizeMultiplier={1}
              className="text-foreground text-lg font-semibold mt-3 text-center"
            >
              {isConfigured
                ? '設定已完成'
                : '尚未使用 QR Code 進行設定'}
            </Text>

            {!isConfigured && (
              <Text
                allowFontScaling={false}
                maxFontSizeMultiplier={1}
                className="text-muted text-sm mt-2 text-center"
              >
                請掃描設定用 QR Code
              </Text>
            )}
          </View>

          {/* 儲存按鈕 */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            className={cn(
              'bg-primary rounded-lg p-4 items-center justify-center',
              isSaving && 'opacity-60'
            )}
          >
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white font-bold text-lg">
              {isSaving ? '儲存中...' : '儲存設定'}
            </Text>
          </Pressable>
          {/* 關於本程式：點擊後顯示完整版本資訊 */}
          <Pressable
            onPress={() => {
              haptic.light();
              router.push('/(tabs)/version-info');
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
            className="bg-surface border border-border rounded-xl p-4 flex-row items-center justify-between"
          >
            <View className="flex-1 mr-3">
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-foreground font-semibold">關於本程式</Text>
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-muted text-xs mt-1">
                APP 版本：{Constants.expoConfig?.version ?? '未知'}
              </Text>
            </View>
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-primary text-xl font-semibold">›</Text>
          </Pressable>

          <View style={{ paddingBottom: 30 }} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}