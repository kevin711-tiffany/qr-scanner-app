import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

export const ACTION_BUTTON_TOKENS = {
  width: 120,
  height: 50,
  fontSize: 15,
  borderRadius: 12,
  gap: 16,
  bottomSpacing: 50,
  primaryColor: '#1E63FF',
  dangerColor: '#FF3B30',
  textColor: '#FFFFFF',
} as const;

type ActionButtonProps = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
};

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
}: ActionButtonProps) {
  return (
    <View
      style={[
        styles.buttonBackground,
        styles.primaryBackground,
        disabled && styles.disabled,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Text style={styles.buttonText}>{title}</Text>
      </Pressable>
    </View>
  );
}

export function DangerButton({
  title,
  onPress,
  disabled = false,
}: ActionButtonProps) {
  return (
    <View
      style={[
        styles.buttonBackground,
        styles.dangerBackground,
        disabled && styles.disabled,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Text style={styles.buttonText}>{title}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
buttonBackground: {
  width: 120,
  height: 50,

  justifyContent: 'center',
  alignItems: 'center',

  borderRadius: 12,
  overflow: 'hidden',

  elevation: 4,

  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.2,
  shadowRadius: 3,
},

  primaryBackground: {
    backgroundColor: '#1E63FF',
  },

  dangerBackground: {
    backgroundColor: '#FF3B30',
  },

	pressable: {
	  flex: 1,
	  justifyContent: 'center',
	  alignItems: 'center',
	},
	buttonText: {
	  color: '#FFFFFF',
	  fontSize: 15,
	  fontWeight: '600',
	  textAlign: 'center',
	},

  pressed: {
    opacity: 0.75,
  },

  disabled: {
    opacity: 0.55,
  },
});