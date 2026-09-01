import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { color, radius, space } from '../design/tokens';

export function PrimaryButton(props: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  busy?: boolean;
  disabled?: boolean;
  dark?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      disabled={props.disabled || props.busy}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.primary,
        props.dark && styles.primaryDark,
        (props.disabled || props.busy) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {props.busy ? (
        <ActivityIndicator color={color.surface} />
      ) : (
        <View style={styles.buttonContent}>
          {props.icon && <Ionicons name={props.icon} size={21} color={color.surface} />}
          <Text style={styles.primaryText}>{props.label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function IconButton(props: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  inverted?: boolean;
  selected?: boolean;
  disabled?: boolean;
}) {
  const foreground = props.inverted ? color.cameraText : color.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      accessibilityState={{ selected: props.selected }}
      disabled={props.disabled}
      hitSlop={8}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.iconButton,
        props.inverted && styles.iconButtonInverted,
        props.selected && styles.iconButtonSelected,
        props.disabled && styles.disabled,
        pressed && styles.iconPressed,
      ]}
    >
      <Ionicons name={props.icon} size={23} color={foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    alignItems: 'center',
    backgroundColor: color.action,
    borderRadius: radius.round,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    shadowColor: color.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 5,
  },
  primaryDark: { shadowColor: color.camera },
  primaryText: { color: color.surface, fontSize: 17, fontWeight: '700', letterSpacing: -0.1 },
  buttonContent: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  disabled: { opacity: 0.45 },
  pressed: { backgroundColor: color.actionPressed, transform: [{ scale: 0.97 }] },
  iconButton: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  iconButtonInverted: { backgroundColor: color.cameraChrome },
  iconButtonSelected: { backgroundColor: 'rgba(229, 111, 61, 0.42)' },
  iconPressed: { opacity: 0.72, transform: [{ scale: 0.94 }] },
});
