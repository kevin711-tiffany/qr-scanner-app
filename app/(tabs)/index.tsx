import { ScrollView, Text, View, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { haptic } from '@/lib/haptics';

/**
 * 首頁：APP 開啟後的預設畫面
 * 顯示 Mr.control LOGO 與公司名稱，並提供三大功能的快速入口
 */
export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();

  const goTo = (path: '/scan' | '/single-scan' | '/query' | '/settings') => {
    haptic.light();
    router.push(path);
  };

  const menuItems = [
    {
      key: 'scan',
      title: 'QR Code 掃描',
      description: '連續讀取條碼並傳送資料',
      icon: 'qrcode.viewfinder' as const,
      onPress: () => goTo('/scan'),
    },
    {
      key: 'single-scan',
      title: '單獨掃描',
      description: '掃描單一條碼後立即傳送',
      icon: 'bolt.fill' as const,
      onPress: () => goTo('/single-scan'),
    },
    {
      key: 'query',
      title: '資料查詢',
      description: '按日期區間查詢掃描記錄',
      icon: 'magnifyingglass' as const,
      onPress: () => goTo('/query'),
    },
    {
      key: 'settings',
      title: '基本資料設定',
      description: '設定代碼、傳送網址與備註',
      icon: 'gearshape.fill' as const,
      onPress: () => goTo('/settings'),
    },
  ];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-6">
        <View className="flex-1">
          {/* 品牌區塊 */}
          <View className="items-center mt-12 mb-10">
            <Image
              source={require('@/assets/images/brand-logo.png')}
              style={{ width: 273, height: 46 }}
              contentFit="contain"
            />
            <Text className="text-foreground text-2xl font-semibold mt-4">
              禾詰企業有限公司
            </Text>
          </View>

          {/* 功能捷徑 */}
          <View className="gap-4">
            {menuItems.map((item) => (
              <Pressable
                key={item.key}
                onPress={item.onPress}
                style={({ pressed }) => [
                  { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                <View className="flex-row items-center bg-surface border border-border rounded-2xl p-5">
                  <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center mr-4">
                    <IconSymbol size={28} name={item.icon} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground text-lg font-semibold">{item.title}</Text>
                    <Text className="text-muted text-sm mt-0.5">{item.description}</Text>
                  </View>
                  <IconSymbol size={22} name="chevron.right" color={colors.muted} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
