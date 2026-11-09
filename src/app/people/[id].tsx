import { Button } from '@/core/components/Button';
import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { formatShortDate } from '@/core/utils/dates';
import { formatSoles } from '@/core/utils/money';
import { dueInfo, type DueTone } from '@/features/loans/dueInfo';
import { usePersonDetail } from '@/features/loans/hooks';
import { useNewLoan } from '@/features/loans/NewLoanProvider';
import { usePaymentSheet } from '@/features/loans/RegisterPaymentProvider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ARROW_SIZE = 70;

const TONE_COLOR: Record<DueTone, string> = {
  neutral: colors.textSecondary,
  warning: colors.warning,
  danger: colors.danger,
};

export default function PersonDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const personId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: detail, isLoading } = usePersonDetail(personId ?? null);
  const { open: openLoan } = useNewLoan();
  const { open: openPayment } = usePaymentSheet();

  const loans = detail?.loans ?? [];
  const payments = detail?.payments ?? [];
  const lent = loans.reduce((sum, l) => sum + l.amount_cents, 0);
  const paid = loans.reduce((sum, l) => sum + l.paid_cents, 0);
  const remaining = lent - paid;
  const settled = lent > 0 && remaining <= 0;
  const progress = lent > 0 ? Math.min(1, paid / lent) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={26} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {detail?.person.name ?? ''}
        </Text>
      </View>

      {!isLoading && !detail ? (
        <Text style={styles.empty}>Esta persona ya no existe.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[colors.surface, 'rgba(149,255,119,0.12)']}
            start={{ x: 0.3, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.summary}
          >
            <View style={styles.watermarkBox}>
              <Ionicons
                name="arrow-down"
                size={ARROW_SIZE}
                color="rgba(149,255,119,0.07)"
                style={styles.watermarkIcon}
              />
            </View>
            <Text style={styles.summaryLabel}>{settled ? 'Estado' : 'Te debe'}</Text>
            <Text style={styles.summaryValue}>{settled ? 'Todo cobrado' : formatSoles(remaining)}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.summaryHint}>
              Cobrado {formatSoles(paid)} de {formatSoles(lent)}
            </Text>
          </LinearGradient>

          <View style={styles.actions}>
            <Button
              title="Registrar pago"
              iconLeft="cash-outline"
              disabled={remaining <= 0}
              onPress={() => personId && openPayment(personId)}
              style={{ flex: 1.4 }}
            />
            <Button
              title="Prestar más"
              variant="secondary"
              onPress={() => personId && openLoan(personId)}
              style={{ flex: 1 }}
            />
          </View>

          <Text style={styles.section}>Préstamos</Text>
          {loans.map((l) => {
            const left = l.amount_cents - l.paid_cents;
            const done = left <= 0;
            const due = dueInfo(l.expected_return_date);
            return (
              <View key={l.id} style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{formatSoles(l.amount_cents)}</Text>
                  <Text
                    style={[styles.itemSub, !done && { color: TONE_COLOR[due.tone] }]}
                    numberOfLines={1}
                  >
                    {formatShortDate(l.created_at)} · {done ? 'pagado' : due.text}
                  </Text>
                  {l.notes ? (
                    <Text style={styles.itemNote} numberOfLines={1}>
                      {l.notes}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.pill, done && styles.pillDone]}>
                  <Text style={[styles.pillText, done && { color: colors.success }]}>
                    {done ? 'Pagado' : `Debe ${formatSoles(left)}`}
                  </Text>
                </View>
              </View>
            );
          })}

          <Text style={styles.section}>Pagos</Text>
          {payments.length === 0 ? (
            <Text style={styles.emptyList}>Aún no hay pagos.</Text>
          ) : (
            payments.map((p) => (
              <View key={p.id} style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: colors.success }]}>
                    + {formatSoles(p.amount_cents)}
                  </Text>
                  <Text style={styles.itemSub}>
                    {formatShortDate(p.paid_at)} · {p.card_name ?? 'Efectivo'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '700', flexShrink: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  summary: {
    borderRadius: radius.md,
    padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  watermarkBox: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: spacing.md,
  },
  watermarkIcon: { lineHeight: ARROW_SIZE, includeFontPadding: false },
  summaryLabel: { color: colors.textSecondary, fontSize: fontSize.md },
  summaryValue: { color: colors.primary, fontSize: 32, fontWeight: '700', marginTop: 2 },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 2, backgroundColor: colors.primary },
  summaryHint: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
  section: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyList: { color: colors.textSecondary, fontSize: fontSize.md },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '600' },
  itemSub: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  itemNote: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2, fontStyle: 'italic' },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  pillDone: { backgroundColor: 'rgba(149,255,119,0.15)' },
  pillText: { color: colors.textPrimary, fontSize: fontSize.sm, fontWeight: '600' },
});