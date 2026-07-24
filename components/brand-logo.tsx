import { Image } from 'expo-image';
import { View } from 'react-native';

/**
 * 品牌 LOGO（Mr.control）
 * 原圖尺寸 385x65（比例約 5.92:1），以固定高度等比顯示
 * 2026-07-18：內頁 LOGO 放大 10%（178x30 → 196x33）
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <View className={className}>
      <Image
        source={require('@/assets/images/brand-logo.png')}
        style={{ width: 196, height: 33 }}
        contentFit="contain"
      />
    </View>
  );
}
