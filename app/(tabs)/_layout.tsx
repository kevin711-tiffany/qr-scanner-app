import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { emitTabReset } from "@/lib/tab-reset";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  // 版尾可視高度固定 60px，原生裝置的底部安全區域另外加在下方
  const bottomInset = Platform.OS === "web" ? 0 : insets.bottom;
  const tabBarHeight = 60 + bottomInset;

  // 當使用者點擊「目前已在」的分頁按鈕時，發送重置訊號讓該功能頁回到初始畫面
  const resetOnReselect = (tabName: string) => ({
    tabPress: (e: { target?: string }) => {
      // e.target 形如 "scan-xxxxx"，navigation state 無法直接在此取得，
      // 改由各頁自行判斷：只有已聚焦的頁面訂閱者收到訊號時才會重置，
      // 未聚焦的頁面本來就會在 useFocusEffect 進入時重置，因此直接發送即可。
      emitTabReset(tabName);
    },
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 0,
          paddingBottom: bottomInset,
          height: tabBarHeight,
          backgroundColor: "#F0F0F0",
          borderTopWidth: 0,
          // box-shadow: 0px 0px 10px #727272（原生用 shadow/elevation 對應）
          boxShadow: "0px 0px 10px #727272",
          shadowColor: "#727272",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 10,
          elevation: 8,
        },
        // 讓 ICON 與文字在 60px 高度內垂直置中
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarIconStyle: { marginTop: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "首頁",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        listeners={resetOnReselect("scan")}
        options={{
          title: "掃描",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="qrcode.viewfinder" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="single-scan"
        listeners={resetOnReselect("single-scan")}
        options={{
          title: "單獨掃描",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bolt.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="query"
        listeners={resetOnReselect("query")}
        options={{
          title: "查詢",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="magnifyingglass" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="function-menu"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="version-info"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        listeners={resetOnReselect("settings")}
        options={{
          title: "設定",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
