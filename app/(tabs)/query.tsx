import { ScrollView, Text, View, Pressable, Alert, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '@/components/screen-container';
import { AppHeader } from '@/components/app-header';
import { HtmlResponseView } from '@/components/html-response-view';
import { useBasicSettings } from '@/hooks/use-basic-settings';
import { useWebView } from '@/hooks/use-web-view';
import { useTabReset } from '@/hooks/use-tab-reset';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

export default function QueryScreen() {
  const { loadSettings, getStoredSettings } = useBasicSettings();
  const { fetchWebContent, webViewData } = useWebView();

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [quickRange, setQuickRange] = useState<'today' | 'week' | 'month' | null>('today');

  // 每次進入查詢分頁時重置回日期設定畫面（不停留在上次的查詢結果頁）
  useFocusEffect(
    useCallback(() => {
      setShowWebView(false);
      setShowStartPicker(false);
      setShowEndPicker(false);
      // 重新載入已儲存設定，確保拿到設定頁最新儲存的傳送網址
      loadSettings();
    }, [loadSettings])
  );

  // 已在查詢分頁時再次點擊「查詢」按鈕：重置回日期設定畫面
  useTabReset('query', () => {
    setShowWebView(false);
    setShowStartPicker(false);
    setShowEndPicker(false);
    loadSettings();
  });

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const applyQuickRange = (range: 'today' | 'week' | 'month') => {
    const today = new Date();
    let start = new Date();
    if (range === 'week') {
      start = new Date(today);
      start.setDate(today.getDate() - 6);
    } else if (range === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    setStartDate(start);
    setEndDate(today);
    setQuickRange(range);
    setShowStartPicker(false);
    setShowEndPicker(false);
    haptic.light();
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (selectedDate) {
      setStartDate(selectedDate);
      setQuickRange(null);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (selectedDate) {
      setEndDate(selectedDate);
      setQuickRange(null);
    }
  };

  const handleQuery = async () => {
    if (startDate > endDate) {
      Alert.alert('錯誤', '起始日期不能晚於結束日期');
      return;
    }

    // 送出時直接從本地儲存讀取最新設定，避免 state 過期導致誤報未設定
    const currentSettings = await getStoredSettings();

    if (!currentSettings.sendUrl || !currentSettings.sendUrl.trim()) {
      Alert.alert('錯誤', '請先在設定中輸入傳送網址');
      return;
    }

    setIsQuerying(true);
    haptic.light();

    try {
      // 準備參數 C
      const paramC = {
        code: currentSettings.code,
        remark1: currentSettings.remark1,
        remark2: currentSettings.remark2,
        remark3: currentSettings.remark3,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        usetype: 'C',
      };

      // 傳送到指定 URL
      const success = await fetchWebContent(currentSettings.sendUrl, paramC);

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
      setIsQuerying(false);
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

  return (
    <ScreenContainer>
      <AppHeader />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        <View className="gap-6">
          {/* 標題 */}
          <View>
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-2xl font-bold text-foreground mb-2">資料查詢</Text>
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-muted text-sm">按日期區間查詢掃描記錄</Text>
          </View>

          {/* 快速日期選項 */}
          <View>
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-foreground font-semibold mb-2">快速選擇</Text>
            <View className="flex-row gap-3">
              {(
                [
                  { key: 'today', label: '今天' },
                  { key: 'week', label: '最近 7 天' },
                  { key: 'month', label: '本月' },
                ] as const
              ).map((option) => (
                <Pressable
                  key={option.key}
                  onPress={() => applyQuickRange(option.key)}
                  style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.7 : 1 }]}
                >
                  <View
                    className={cn(
                      'rounded-lg p-3 items-center justify-center border',
                      quickRange === option.key
                        ? 'bg-primary border-primary'
                        : 'bg-surface border-border'
                    )}
                  >
                    <Text
                      allowFontScaling={false}
                      maxFontSizeMultiplier={1}
                      className={cn(
                        'font-semibold',
                        quickRange === option.key ? 'text-white' : 'text-foreground'
                      )}
                    >
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 起始日期 */}
          <View>
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-foreground font-semibold mb-2">起始日期</Text>
            <Pressable
              onPress={() => setShowStartPicker(true)}
              className="border border-border rounded-lg p-4 bg-surface"
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-foreground text-lg">{formatDate(startDate)}</Text>
            </Pressable>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                locale="zh-TW"
                onChange={handleStartDateChange}
              />
            )}

            {Platform.OS === 'ios' && showStartPicker && (
              <Pressable
                onPress={() => setShowStartPicker(false)}
                className="mt-2 bg-primary rounded-lg p-3"
              >
                <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white text-center font-semibold">確認</Text>
              </Pressable>
            )}
          </View>

          {/* 結束日期 */}
          <View>
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-foreground font-semibold mb-2">結束日期</Text>
            <Pressable
              onPress={() => setShowEndPicker(true)}
              className="border border-border rounded-lg p-4 bg-surface"
            >
              <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-foreground text-lg">{formatDate(endDate)}</Text>
            </Pressable>

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                locale="zh-TW"
                onChange={handleEndDateChange}
              />
            )}

            {Platform.OS === 'ios' && showEndPicker && (
              <Pressable
                onPress={() => setShowEndPicker(false)}
                className="mt-2 bg-primary rounded-lg p-3"
              >
                <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white text-center font-semibold">確認</Text>
              </Pressable>
            )}
          </View>

          {/* 查詢按鈕 */}
          <Pressable
            onPress={handleQuery}
            disabled={isQuerying}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            className={cn(
              'bg-primary rounded-lg p-4 items-center justify-center',
              isQuerying && 'opacity-60'
            )}
          >
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-white font-bold text-lg">
              {isQuerying ? '查詢中...' : '查詢'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
