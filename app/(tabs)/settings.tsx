import { ScrollView, Text, View, TextInput, Pressable, Alert, Switch } from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
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
import { Platform } from 'react-native';

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

    const parsed = parseSettingsQr(result.data ?? '');
    setShowScanner(false);

    if (!parsed) {
      haptic.error();
      Alert.alert(
        '格式錯誤',
        '無法解析此 QR Code。支援格式：\n1. JSON：{"code":"...","sendUrl":"...","remark1":"..."}\n2. 分隔格式：代碼;傳送網址;備註一;備註二;備註三\n3. 純網址（只帶入傳送網址）'
      );
      return;
    }

    applyFields(parsed);
    // 播放掃描成功提示音（音效關閉時以震動回饋）
    playScanSuccessFeedback();
    // 完全以掃描到的最新資料為準（含空字串欄位一併清空舊資料），
    // 直接自動執行儲存流程（不彈出確認視窗），
    // 並將資料傳送到指定網址、顯示伺服器回應網頁
    void performSave(parsed);
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
        Alert.alert('錯誤', '設定的網址無法連結，請重新確認');
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
        Alert.alert('錯誤', '設定的網址無法連結，請重新確認');
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
        <Text className="text-foreground">載入中...</Text>
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
              <Text className="text-primary font-semibold">返回設定</Text>
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
              <Text className="text-white mt-4 text-center">對準設定用 QR Code</Text>
            </View>
          </View>
          <View className="p-4 bg-surface border-t border-border">
            <Pressable
              onPress={() => setShowScanner(false)}
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              className="bg-error/20 rounded-lg p-4 items-center"
            >
              <Text className="text-error font-semibold">取消掃描</Text>
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
            <Text className="text-error font-semibold mb-2">錯誤</Text>
            <Text className="text-error text-sm">{webViewData.error}</Text>
          </View>
        ) : (
          <HtmlResponseView html={webViewData.content} />
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
            <Text className="text-2xl font-bold text-foreground mb-2">基本資料設定</Text>
            <Text className="text-muted text-sm">設定您的基本資訊和傳送網址</Text>
          </View>

          {/* 掃描 QR Code 帶入設定 */}
          <Pressable
            onPress={openScanner}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
            className="border border-primary rounded-lg p-3 items-center bg-primary/5"
          >
            <Text className="text-primary font-semibold">掃描 QR Code 帶入設定資料</Text>
          </Pressable>

          {/* 掃描提示音效開關 */}
          <View className="flex-row items-center justify-between bg-surface border border-border rounded-lg p-4">
            <View className="flex-1 mr-3">
              <Text className="text-foreground font-semibold">掃描提示音效</Text>
              <Text className="text-muted text-xs mt-1">
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

          {/* 代碼 */}
          <View>
            <Text className="text-foreground font-semibold mb-2">代碼（唯讀，由 QR Code 帶入）</Text>
            <TextInput
              value={settings.code}
              editable={false}
              placeholder="請掃描 QR Code 帶入代碼"
              placeholderTextColor="#999"
              maxLength={30}
              className={cn(
                'border border-border rounded-lg p-3',
                'bg-border/30 text-muted'
              )}
            />
            <Text className="text-muted text-xs mt-1">{settings.code.length}/30</Text>
          </View>

          {/* 傳送網址 */}
          <View>
            <Text className="text-foreground font-semibold mb-2">傳送網址（唯讀，由 QR Code 帶入）</Text>
            <TextInput
              value={settings.sendUrl}
              editable={false}
              placeholder="請掃描 QR Code 帶入傳送網址"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="url"
              className={cn(
                'border border-border rounded-lg p-3',
                'bg-border/30 text-muted'
              )}
            />
          </View>

          {/* 備註一 */}
          <View>
            <Text className="text-foreground font-semibold mb-2">備註一</Text>
            <TextInput
              value={settings.remark1}
              onChangeText={(value) => updateField('remark1', value.slice(0, 30))}
              placeholder="輸入備註（最多 30 字元）"
              placeholderTextColor="#999"
              maxLength={30}
              className={cn(
                'border border-border rounded-lg p-3 text-foreground',
                'bg-surface'
              )}
            />
            <Text className="text-muted text-xs mt-1">{settings.remark1.length}/30</Text>
          </View>

          {/* 備註二 */}
          <View>
            <Text className="text-foreground font-semibold mb-2">備註二</Text>
            <TextInput
              value={settings.remark2}
              onChangeText={(value) => updateField('remark2', value.slice(0, 30))}
              placeholder="輸入備註（最多 30 字元）"
              placeholderTextColor="#999"
              maxLength={30}
              className={cn(
                'border border-border rounded-lg p-3 text-foreground',
                'bg-surface'
              )}
            />
            <Text className="text-muted text-xs mt-1">{settings.remark2.length}/30</Text>
          </View>

          {/* 備註三 */}
          <View>
            <Text className="text-foreground font-semibold mb-2">備註三</Text>
            <TextInput
              value={settings.remark3}
              onChangeText={(value) => updateField('remark3', value.slice(0, 30))}
              placeholder="輸入備註（最多 30 字元）"
              placeholderTextColor="#999"
              maxLength={30}
              className={cn(
                'border border-border rounded-lg p-3 text-foreground',
                'bg-surface'
              )}
            />
            <Text className="text-muted text-xs mt-1">{settings.remark3.length}/30</Text>
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
            <Text className="text-white font-bold text-lg">
              {isSaving ? '儲存中...' : '儲存設定'}
            </Text>
          </Pressable>
          {/* APP 版本號 */}
          {/* 距儲存按鈕下方 20px、與版尾保持 30px 距離（外層 gap-6 已有間距，改用 style 精準控制） */}
          <View className="items-center" style={{ marginTop: 20, paddingBottom: 30 }}>
            <Text className="text-muted text-sm">
              APP 版本：{Constants.expoConfig?.version ?? '未知'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
