import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  label: string;
  active?: boolean;
  onPress: () => void;
  left?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, active = false, onPress,left, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.chip, active && styles.active, pressed && { opacity: 0.85 }, style]}
    >
       {left}
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  active: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
  textActive: { color: colors.background },
});