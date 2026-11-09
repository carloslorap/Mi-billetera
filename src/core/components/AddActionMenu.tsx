import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { Ionicons } from '@expo/vector-icons';
// import { router } from 'expo-router';
import { useAddCard } from '@/features/cards/AddCardProvider';
import { useNewLoan } from '@/features/loans/NewLoanProvider';
import { useNewTransaction } from '@/features/transactions/NewTransactionProvider';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
type Option = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  enabled: boolean;
  onPress?: () => void;
};

type Props = { barHeight: number; onClose: () => void };

export function AddActionMenu({ barHeight, onClose }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const { open } = useNewTransaction();
  const { open: openAddCard } = useAddCard();
  const { open: openLoan } = useNewLoan();
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 160, useNativeDriver: true }).start();
  }, [anim]);

  const options: Option[] = [
    {
      key: 'card',
      icon: 'card-outline',
      title: 'Agregar tarjeta',
      subtitle: 'BCP, BBVA, Interbank y más',
      enabled: true,
      onPress: () => {
        onClose();
        openAddCard();
      },
    },
    {
      key: 'loan',
      icon: 'cash-outline',
      title: 'Prestar dinero',
      subtitle: 'A quién y cuándo te lo devuelve',
      enabled: true,
      onPress: () => {
        onClose();
        openLoan();
      },
    },
    {
      key: 'write',
      icon: 'pencil-outline',
      title: 'Escribir',
      subtitle: 'Monto, tarjeta y categoría',
      enabled: true,
      onPress: () => {
        onClose();
        open();
      },
    },
    {
      key: 'voice',
      icon: 'mic-outline',
      title: 'Hablar',
      subtitle: '“Gasté 25 en el almuerzo”',
      enabled: false,
    },
    {
      key: 'receipt',
      icon: 'camera-outline',
      title: 'Foto de boleta',
      subtitle: 'Lee el monto automáticamente',
      enabled: false,
    },
  ];

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <>
      {/* Fondo oscuro: llega hasta la barra, que queda visible */}
      <Animated.View style={[styles.backdrop, { bottom: barHeight, opacity: anim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Tarjeta flotante sobre la barra */}
      <Animated.View
        style={[
          styles.card,
          { bottom: barHeight + 28, opacity: anim, transform: [{ translateY }] },
        ]}
      >
        {options.map((o) => (
          <Pressable
            key={o.key}
            disabled={!o.enabled}
            onPress={o.onPress}
            style={({ pressed }) => [
              styles.row,
              !o.enabled && { opacity: 0.55 },
              pressed && o.enabled && { backgroundColor: 'rgba(255,255,255,0.05)' },
            ]}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={o.icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{o.title}</Text>
              <Text style={styles.subtitle}>{o.subtitle}</Text>
            </View>
            {!o.enabled ? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>Pronto</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  card: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    boxShadow: [
      { offsetX: 0, offsetY: 12, blurRadius: 32, spreadDistance: 0, color: 'rgba(0,0,0,0.5)' },
    ],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '600' },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  pill: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  pillText: { color: colors.textSecondary, fontSize: fontSize.sm },
});