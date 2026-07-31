import {
  ScrollView,
  Text,
  View,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { haptic } from '@/lib/haptics';

type HomeRoute =
  | '/scan'
  | '/single-scan'
  | '/query'
  | '/function-menu'
  | '/settings';

/**
 * 首頁：APP 開啟後的預設畫面
 * 顯示 Mr.control LOGO、公司名稱與所有功能入口。
 * 未來新增功能時，可在 menuItems 中繼續加入首頁按鈕。
 */
export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const goTo = (path: HomeRoute) => {
    haptic.light();
    router.push(path);
  };

  /**
   * 使用手機預設瀏覽器開啟外部網站。
   * 未來若首頁要增加其他網站，只要呼叫 openWebsite() 即可。
   */
  const openWebsite = async (url: string) => {
    haptic.light();

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('無法開啟網站', url);
      }
    } catch {
      Alert.alert('開啟失敗', '請稍後再試');
    }
  };

  const menuItems = [
    {
      key: 'scan',
      title: '連續掃描',
      icon: 'qrcode.viewfinder' as const,
      onPress: () => goTo('/scan'),
    },
    {
      key: 'single-scan',
      title: '單獨掃描',
      icon: 'bolt.fill' as const,
      onPress: () => goTo('/single-scan'),
    },
    {
      key: 'query',
      title: '資料查詢',
      icon: 'magnifyingglass' as const,
      onPress: () => goTo('/query'),
    },
    {
      key: 'function-menu',
      title: '功能選單',
      icon: 'square.grid.2x2.fill' as const,
      onPress: () => goTo('/function-menu'),
    },
    {
      key: 'settings',
      title: '資料設定',
      icon: 'gearshape.fill' as const,
      onPress: () => goTo('/settings'),
    },
    {
      key: 'website',
      title: '禾詰網站',
      icon: 'globe' as const,
      onPress: () => openWebsite('https://www.mrcontrol-bike.com/'),
    },
  ];

  return (
    <ScreenContainer>
      <ScrollView
contentContainerStyle={{
  flexGrow: 1,
  paddingBottom: 60,
}}
contentInsetAdjustmentBehavior="automatic"
        className="p-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1">
          {/* 品牌區塊 */}
          <View className="items-center mt-12 mb-10">
            <Image
              source={require('@/assets/images/brand-logo.png')}
              style={{ width: 273, height: 46 }}
              contentFit="contain"
            />
            <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-foreground text-2xl font-semibold mt-4">
              禾詰企業有限公司
            </Text>
          </View>

          {/* 功能捷徑：每列兩個按鈕 */}
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {menuItems.map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                onPress={item.onPress}
                className="w-[48%]"
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  },
                ]}
              >
                <View className="min-h-32 items-center justify-center bg-surface border border-border rounded-2xl px-3 py-5">
                  <View
                    className="rounded-2xl bg-primary/10 items-center justify-center mb-3"
                    style={{
                      width: 72,
                      height: 72,
                    }}
                  >
                    <IconSymbol
                      size={44}
                      name={item.icon}
                      color={colors.primary}
                    />
                  </View>
                  <Text allowFontScaling={false} maxFontSizeMultiplier={1} className="text-foreground text-lg font-semibold text-center">
                    {item.title}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}