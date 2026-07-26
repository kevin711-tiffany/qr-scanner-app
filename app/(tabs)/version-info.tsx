import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';

import { AppHeader } from '@/components/app-header';
import { ScreenContainer } from '@/components/screen-container';
import { VERSION_INFO } from '@/constants/version-info';
import { haptic } from '@/lib/haptics';

const DEVELOPER_TAP_COUNT = 5;
const TAP_RESET_DELAY_MS = 3000;

export default function VersionInfoScreen() {
  const runtimeVersion = Constants.expoConfig?.version ?? VERSION_INFO.version;

  const [versionTapCount, setVersionTapCount] = useState(0);
  const [showDeveloperInfo, setShowDeveloperInfo] = useState(false);

  const tapResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (tapResetTimerRef.current) {
        clearTimeout(tapResetTimerRef.current);
      }
    };
  }, []);

  const resetVersionTapTimer = () => {
    if (tapResetTimerRef.current) {
      clearTimeout(tapResetTimerRef.current);
    }

    tapResetTimerRef.current = setTimeout(() => {
      setVersionTapCount(0);
      tapResetTimerRef.current = null;
    }, TAP_RESET_DELAY_MS);
  };

  const handleVersionPress = () => {
    if (showDeveloperInfo) {
      haptic.light();
      return;
    }

    const nextTapCount = versionTapCount + 1;

    if (nextTapCount >= DEVELOPER_TAP_COUNT) {
      if (tapResetTimerRef.current) {
        clearTimeout(tapResetTimerRef.current);
        tapResetTimerRef.current = null;
      }

      setVersionTapCount(0);
      setShowDeveloperInfo(true);

      haptic.success();
      Alert.alert('開發人員模式', '已顯示本版本的開發資訊。');
      return;
    }

    setVersionTapCount(nextTapCount);
    resetVersionTapTimer();
    haptic.light();
  };

  const remainingTapCount = DEVELOPER_TAP_COUNT - versionTapCount;

  return (
    <ScreenContainer>
      <AppHeader>
        <Pressable
          onPress={() => {
            haptic.light();
            router.back();
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
        >
          <Text className="text-primary font-semibold">返回設定</Text>
        </Pressable>
      </AppHeader>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
        }}
      >
        <View className="gap-6">
          {/* 頁面標題 */}
          <View>
            <Text className="text-2xl font-bold text-foreground mb-2">
              版本資訊
            </Text>

            <Text className="text-muted text-sm">
              關於本程式
            </Text>
          </View>

          {/* 基本版本資訊 */}
          <View className="bg-surface border border-border rounded-xl overflow-hidden">
            <InfoRow
              label="應用程式"
              value={VERSION_INFO.appName}
            />

            {/* 連續點擊版本欄位 5 次，顯示開發人員資訊 */}
            <Pressable
              onPress={handleVersionPress}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <InfoRow
                label="版本"
                value={runtimeVersion}
              />
            </Pressable>

            <InfoRow
              label="發布日期"
              value={VERSION_INFO.releaseDate}
            />

            <InfoRow
              label="Android Build"
              value={String(VERSION_INFO.androidVersionCode)}
            />

            <InfoRow
              label="iOS Build"
              value={VERSION_INFO.iosBuildNumber}
              isLast
            />
          </View>

          {/* 開發人員模式點擊提示 */}
          {!showDeveloperInfo && versionTapCount > 0 && (
            <Text className="text-muted text-xs text-center">
              再點擊版本 {remainingTapCount} 次，即可顯示開發資訊
            </Text>
          )}

          {/* 僅在開發人員模式啟用後顯示 */}
          {showDeveloperInfo && (
            <View className="bg-surface border border-border rounded-xl p-4">
              <Text className="text-lg font-bold text-foreground mb-3">
                Version {VERSION_INFO.version} 更新內容
              </Text>

              <View className="gap-3">
                {VERSION_INFO.highlights.map((item) => (
                  <View
                    key={item}
                    className="flex-row"
                  >
                    <Text className="text-primary font-bold mr-2">
                      •
                    </Text>

                    <Text className="text-foreground flex-1 leading-6">
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text className="text-muted text-xs text-center">
            © 2026 禾詰企業物料管理
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between p-4 ${
        isLast ? '' : 'border-b border-border'
      }`}
    >
      <Text className="text-muted mr-4">
        {label}
      </Text>

      <Text className="text-foreground font-semibold flex-1 text-right">
        {value}
      </Text>
    </View>
  );
}