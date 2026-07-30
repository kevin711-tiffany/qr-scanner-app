import { Text, TextInput } from "react-native";
import type { TextInputProps, TextProps } from "react-native";

type ComponentWithDefaultProps<Props> = {
  defaultProps?: Partial<Props>;
};

const TextComponent = Text as typeof Text & ComponentWithDefaultProps<TextProps>;
const TextInputComponent = TextInput as typeof TextInput &
  ComponentWithDefaultProps<TextInputProps>;

TextComponent.defaultProps = {
  ...TextComponent.defaultProps,
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
};

TextInputComponent.defaultProps = {
  ...TextInputComponent.defaultProps,
  allowFontScaling: false,
  maxFontSizeMultiplier: 1,
};
