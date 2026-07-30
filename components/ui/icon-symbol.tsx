// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the Icons Directory.
 * - see SF Symbols in the SF Symbols app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "qrcode.viewfinder": "qr-code-scanner",
  "bolt.fill": "bolt",
  "gearshape.fill": "settings",
  "trash.fill": "delete",
  "arrow.up.circle.fill": "arrow-upward",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "magnifyingglass": "search",

  // 新增：網站 Icon (Android -> Material Icons)
  "globe": "public",

  "square.grid.2x2.fill": "apps",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS,
 * and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}