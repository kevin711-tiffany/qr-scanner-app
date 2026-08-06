import { Text, View, Pressable, Alert, FlatList, StyleSheet } from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '@/components/screen-container';
import { AppHeader } from '@/components/app-header';
import { HtmlResponseView } from '@/components/html-response-view';
import { useBasicSettings } from '@/hooks/use-basic-settings';
import { useWebView } from '@/hooks/use-web-view';
import { useTabReset } from '@/hooks/use-tab-reset';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { playScanSuccessFeedback, preloadScanSound } from '@/lib/scan-feedback';
import { PrimaryButton, DangerButton, ACTION_BUTTON_TOKENS } from '@/components/ui/action-button';

interface ScannedItem {
  id: string;
  value: string;
  timestamp: number;
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const { loadSettings, getStoredSettings } = useBasicSettings();
  const { fetchWebContent, webViewData } = useWebView();
  
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'warning'; text: string } | null>(null);
  const lastScanRef = useRef<{ value: string; time: number }>({ value: '', time: 0 });
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 每次進入掃描分頁時重置回初始掃描畫面（不停留在上次的傳送結果頁）
  useFocusEffect(
    useCallback(() => {
      setShowWebView(false);
      setScannedItems([]);
      setBanner(null);
      lastScanRef.current = { value: '', time: 0 };
      // 重新載入已儲存設定，確保拿到設定頁最新儲存的傳送網址
      loadSettings();
    }, [loadSettings])
  );

  // 已在掃描分頁時再次點擊「掃描」按鈕：重置回初始掃描畫面
  useTabReset('scan', () => {
    setShowWebView(false);
    setScannedItems([]);
    setBanner(null);
    lastScanRef.current = { value: '', time: 0 };
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

  // 清除橫幅提示計時器
  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  // 顯示非阻塞的提示橫幅（自動消失，不會卡住掃描）
  const showBanner = (type: 'success' | 'warning', text: string) => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }
    setBanner({ type, text });
    bannerTimerRef.current = setTimeout(() => setBanner(null), 1500);
  };

  const handleBarCodeScanned = (result: any) => {
    const scannedValue = result.data;
    const now = Date.now();

    // 節流：相機每秒觸發多次掃描事件，同一條碼 2 秒內只處理一次，
    // 避免重複提示連續彈出造成畫面卡住
    if (
      lastScanRef.current.value === scannedValue &&
      now - lastScanRef.current.time < 2000
    ) {
      return;
    }
    lastScanRef.current = { value: scannedValue, time: now };

    // 檢查是否已存在相同的掃描結果
    const isDuplicate = scannedItems.some((item) => item.value === scannedValue);

    if (isDuplicate) {
      haptic.warning();
      // 使用非阻塞橫幅提示取代 Alert，避免相機持續觸發掃描事件
      // 導致 Alert 重複彈出、OK 按鈕無法點擊的卡機問題
      showBanner('warning', `重複：已掃描過此條碼`);
      return;
    }

    // 新增掃描結果
    const newItem: ScannedItem = {
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      value: scannedValue,
      timestamp: now,
    };

    setScannedItems((prev) => [newItem, ...prev]);

    playScanSuccessFeedback();
    showBanner('success', '讀取成功');
  };

  const handleComplete = async () => {
    if (scannedItems.length === 0) {
      Alert.alert('錯誤', '請先掃描至少一個 QR Code');
      return;
    }

    // 送出時直接從本地儲存讀取最新設定，避免 state 過期導致誤報未設定
    const currentSettings = await getStoredSettings();

    if (!currentSettings.sendUrl || !currentSettings.sendUrl.trim()) {
      Alert.alert('錯誤', '請先在設定中輸入傳送網址');
      return;
    }

    setIsSubmitting(true);
    haptic.light();

    try {
      // 將掃描結果以逗號分隔
      const scannedData = scannedItems.map((item) => item.value).join(',');

      // 準備參數 B
      const paramB = {
        code: currentSettings.code,
        remark1: currentSettings.remark1,
        remark2: currentSettings.remark2,
        remark3: currentSettings.remark3,
        scannedData: scannedData,
        usetype: 'B',
      };

      // 傳送到指定 URL
      const success = await fetchWebContent(currentSettings.sendUrl, paramB);

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
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    Alert.alert('確認', '確定要清除所有掃描結果嗎？', [
      { text: '取消', onPress: () => {} },
      {
        text: '清除',
        onPress: () => {
          setScannedItems([]);
          haptic.light();
        },
      },
    ]);
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
        <Pressable
          onPress={requestPermission}
          className="bg-primary rounded-lg p-4"
        >
          <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white font-bold">授予權限</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer className="items-center justify-center p-4">
        <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-foreground text-center mb-4">相機權限被拒絕</Text>
        <Pressable
          onPress={requestPermission}
          className="bg-primary rounded-lg p-4"
        >
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
              onBarcodeScanned={handleBarCodeScanned}
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
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white mt-4 text-center">對準 QR Code</Text>
          </View>

          {/* 已掃描計數 */}
          <View className="absolute top-4 right-4 bg-black/70 px-4 py-2 rounded-lg">
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white font-bold text-lg">
              已掃描：{scannedItems.length}
            </Text>
          </View>

          {/* 非阻塞提示橫幅（取代 Alert，避免卡機） */}
          {banner && (
            <View
              className={cn(
                'absolute top-4 left-4 right-28 px-4 py-2 rounded-lg',
                banner.type === 'warning' ? 'bg-white/95' : 'bg-success/90'
              )}
            >
              <Text
                allowFontScaling={false}
                maxFontSizeMultiplier={1}
                className={cn(
                  'font-bold text-center',
                  banner.type === 'warning' ? 'text-red-600' : 'text-white'
                )}
              >
                {banner.text}
              </Text>
            </View>
          )}
        </View>

        {/* 掃描結果列表 */}
        <View className="bg-surface border-t border-border p-4 max-h-48">
          {scannedItems.length > 0 ? (
            <FlatList
              data={scannedItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View className="bg-background p-3 rounded-lg mb-2 border border-border">
                  <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-foreground text-sm font-mono break-words">
                    {item.value}
                  </Text>
                </View>
              )}
              scrollEnabled
              nestedScrollEnabled
            />
          ) : (
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-muted text-center py-4">尚未掃描任何 QR Code</Text>
          )}
        </View>

        {/* 操作按鈕：固定尺寸、水平置中，並與底部分頁保留 50px 距離 */}
			<View style={styles.actionArea}>
			  <View style={styles.actionRow}>
				<PrimaryButton
				  title={isSubmitting ? '傳送中...' : '完成'}
				  onPress={handleComplete}
				  disabled={isSubmitting || scannedItems.length === 0}
				/>

				<DangerButton
				  title="清除"
				  onPress={handleClear}
				  disabled={scannedItems.length === 0}
				/>
			  </View>
			</View>
      </View>
    </ScreenContainer>
  );
}


const styles = StyleSheet.create({
  actionArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: ACTION_BUTTON_TOKENS.bottomSpacing,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: ACTION_BUTTON_TOKENS.gap,
  },
});
