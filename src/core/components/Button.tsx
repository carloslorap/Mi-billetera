import { colors } from '@/core/theme/colors';
import { dangerGradient, glow, greenGradient, metalGradient } from '@/core/theme/effects';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

type IconName = keyof typeof Ionicons.glyphMap;
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'md' | 'lg';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  iconLeft?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const VARIANTS = {
  primary: {
    gradient: greenGradient,
    text: colors.background,
    shadow: glow.button,
    border: 'rgba(255,255,255,0.12)',
    borderTop: 'rgba(255,255,255,0.5)',
  },
  secondary: {
    gradient: metalGradient,
    text: colors.textPrimary,
    shadow: glow.depth,
    border: 'rgba(255,255,255,0.06)',
    borderTop: 'rgba(255,255,255,0.18)',
  },
  danger: {
    gradient: dangerGradient,
    text: colors.background,
    shadow: glow.danger,
    border: 'rgba(255,255,255,0.12)',
    borderTop: 'rgba(255,255,255,0.45)',
  },
  ghost: {
    gradient: null,
    text: colors.primary,
    shadow: undefined,
    border: 'transparent',
    borderTop: 'transparent',
  },
} as const;

const SIZES = {
  md: { paddingVertical: spacing.md, fontSize: fontSize.md, icon: 18, radius: radius.md },
  lg: { paddingVertical: spacing.lg, fontSize: fontSize.lg, icon: 22, radius: radius.lg },
} as const;

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: Props) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const blocked = disabled || loading;

  const inner: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: s.radius,
    paddingVertical: s.paddingVertical,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: v.border,
    borderTopColor: v.borderTop,
  };

  const content = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : iconLeft ? (
        <Ionicons name={iconLeft} size={s.icon} color={v.text} />
      ) : null}
      <Text style={[styles.text, { color: v.text, fontSize: s.fontSize }]}>{title}</Text>
      {!loading && iconRight ? <Ionicons name={iconRight} size={s.icon} color={v.text} /> : null}
    </>
  );

  return (
    <View
      style={[
        {
          borderRadius: s.radius,
          opacity: disabled ? 0.45 : 1,
          boxShadow: disabled ? undefined : v.shadow,
        },
        fullWidth ? styles.full : styles.auto,
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={blocked}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: blocked, busy: loading }}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {v.gradient ? (
          <LinearGradient colors={v.gradient} style={inner}>
            {content}
          </LinearGradient>
        ) : (
          <View style={inner}>{content}</View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  text: { fontWeight: '700' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  full: { alignSelf: 'stretch' },
  auto: { alignSelf: 'center' },
});