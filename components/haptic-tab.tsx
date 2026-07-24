import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { haptic } from "@/lib/haptics";
export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        // 按下分頁按鈕時提供輕度觸覺回饋（iOS 用 Taptic Engine、Android 用震動）
        haptic.light();
        props.onPressIn?.(ev);
      }}
    />
  );
}
