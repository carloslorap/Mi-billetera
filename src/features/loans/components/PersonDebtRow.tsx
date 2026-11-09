import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { formatSoles } from '@/core/utils/money';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dueInfo, type DueTone } from '../dueInfo';
import type { PersonDebt } from '../types';

const TONE_COLOR: Record<DueTone, string> = {
  neutral: colors.textSecondary,
  warning: colors.warning,
  danger: colors.danger,
};

export function PersonDebtRow({ item, onPress }: { item: PersonDebt; onPress?: () => void }) {
  const settled = item.remaining_cents <= 0;
  const due = dueInfo(item.next_due);
  const count = `${item.loans_count} ${item.loans_count === 1 ? 'préstamo' : 'préstamos'}`;
  const progress = item.lent_cents > 0 ? Math.min(1, item.paid_cents / item.lent_cents) : 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.trim().charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text
            style={[styles.sub, { color: settled ? colors.success : TONE_COLOR[due.tone] }]}
            numberOfLines={1}
          >
            {count} · {settled ? 'todo cobrado' : due.text}
          </Text>
        </View>
        <Text style={[styles.amount, settled && { color: colors.textSecondary }]}>
          {formatSoles(settled ? item.lent_cents : item.remaining_cents)}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: fontSize.lg, fontWeight: '700' },
  name: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '600' },
  sub: { fontSize: fontSize.sm, marginTop: 2 },
  amount: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '700' },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 2, backgroundColor: colors.primary },
});