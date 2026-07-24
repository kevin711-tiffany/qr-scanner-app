import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

/**
 * 固定版頭（除首頁外的所有功能頁共用）
 * - 高度 60px、底色 #F0F0F0
 * - 只有下方陰影 box-shadow: 0px 4px 10px -2px #727272（上方不顯示陰影）
 * - LOGO 高 40px、靠左、上/下/左邊距各 10px（垂直置中）
 * - 可透過 children 在右側放置額外操作（如「返回設定」）
 */
export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <Image
        source={require('@/assets/images/brand-logo.png')}
        style={styles.logo}
        contentFit="contain"
      />
      {children ? <View style={styles.right}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 10,
    // 只保留下方陰影：向下偏移並用負 spread 收縮，避免上方出現陰影
    boxShadow: '0px 4px 10px -2px #727272',
    shadowColor: '#727272',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 8,
    // 確保陰影蓋在內容之上，呈現層次
    zIndex: 10,
  },
  logo: {
    // LOGO 原圖 385x65（約 5.92:1），高 40px 等比寬約 237px
    height: 40,
    width: 237,
    marginTop: 10,
    marginBottom: 10,
  },
  right: {
    marginLeft: 'auto',
  },
});
