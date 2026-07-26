import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface AppHeaderProps {
  children?: React.ReactNode;
  showFunctionMenu?: boolean;
}

export function AppHeader({ children, showFunctionMenu = true }: AppHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Image
        source={require('@/assets/images/brand-logo.png')}
        style={styles.logo}
        contentFit="contain"
      />
      <View style={styles.right}>
        {children}
        {showFunctionMenu ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="開啟功能選單"
            onPress={() => router.push('/function-menu')}
            style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
          >
            <IconSymbol size={30} name="square.grid.2x2.fill" color="#2563EB" />
          </Pressable>
        ) : null}
      </View>
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
    boxShadow: '0px 4px 10px -2px #727272',
    shadowColor: '#727272',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  logo: {
    height: 40,
    width: 237,
    marginTop: 10,
    marginBottom: 10,
  },
  right: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  menuButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
