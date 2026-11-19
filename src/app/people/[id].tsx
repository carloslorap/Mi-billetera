import { Button } from '@/core/components/Button';
import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { formatShortDate } from '@/core/utils/dates';
import { formatSoles } from '@/core/utils/money';
import { DIRECTION, type LoanDirection } from '@/features/loans/direction';
import { dueInfo, type DueTone } from '@/features/loans/dueInfo';
import { useDeleteLoan, useDeletePayment, usePersonDetail } from '@/features/loans/hooks';
import { useNewLoan } from '@/features/loans/NewLoanProvider';
import { usePaymentSheet } from '@/features/loans/RegisterPaymentProvider';
import { LoanWithPaid, PaymentRow } from '@/features/loans/types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ARROW_SIZE = 70;

const TONE_COLOR: Record<DueTone, string> = {
  neutral: colors.textSecondary,
  warning: colors.warning,
  danger: colors.danger,
};

export default function PersonDetailScreen() {
  const params = useLocalSearchParams<{ id: string; direction?: string }>();
  const personId = Array.isArray(params.id) ? params.id[0] : params.id;
  const rawDirection = Array.isArray(params.direction) ? params.direction[0] : params.direction;
  const direction: LoanDirection = rawDirection === 'borrowed' ? 'borrowed' : 'lent';
  const cfg = DIRECTION[direction];

  const { data: detail, isLoading } = usePersonDetail(personId ?? null, direction);
  const { open: openLoan } = useNewLoan();
  const { open: openPayment } = usePaymentSheet();

  const loans = detail?.loans ?? [];
  const payments = detail?.payments ?? [];
  const lent = loans.reduce((sum, l) => sum + l.amount_cents, 0);
  const paid = loans.reduce((sum, l) => sum + l.paid_cents, 0);
  const remaining = lent - paid;
  const settled = lent > 0 && remaining <= 0;
  const progress = lent > 0 ? Math.min(1, paid / lent) : 0;

  const paymentSign = direction === 'lent' ? '+' : '-';
  const paymentColor = direction === 'lent' ? colors.success : colors.warning;

  const deleteLoan = useDeleteLoan();
  const deletePayment = useDeletePayment();


  const confirmDeleteLoan = (l: LoanWithPaid) => {
    const n = payments.filter((p) => p.loan_id === l.id).length;
    const extra =
      n > 0
        ? `Se borran también ${n} ${n === 1 ? 'pago' : 'pagos'} y sus movimientos de tarjeta.`
        : 'Si usaste una tarjeta, su movimiento también se borra.';

    Alert.alert(
      direction === 'lent' ? 'Eliminar préstamo' : 'Eliminar deuda',
      `${formatSoles(l.amount_cents)} · ${formatShortDate(l.created_at)}\n\n${extra}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () =>
            deleteLoan.mutate(l.id, {
              // si era el último, ya no queda nada que mostrar de esta persona
              onSuccess: () => {
                if (loans.length === 1) router.back();
              },
            }),
        },
      ]
    );
  };


  const confirmDeletePayment = (p: PaymentRow) => {
    const pending = direction === 'lent' ? 'cobrar' : 'pagar';
    const card = p.card_name ? ` El saldo de ${p.card_name} se recalcula.` : '';

    Alert.alert(
      'Anular pago',
      `${formatSoles(p.amount_cents)} · ${formatShortDate(p.paid_at)}\n\nVolverá a quedar pendiente por ${pending}.${card}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Anular', style: 'destructive', onPress: () => deletePayment.mutate(p.id) },
      ]
    );
  };

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
            colors={[colors.surface, cfg.tint]}
            start={{ x: 0.3, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.summary}
          >
            <View style={styles.watermarkBox}>
              <Ionicons
                name={cfg.arrow}
                size={ARROW_SIZE}
                color={cfg.watermark}
                style={styles.watermarkIcon}
              />
            </View>
            <Text style={styles.summaryLabel}>{settled ? 'Estado' : cfg.detailLabel}</Text>
            <Text style={[styles.summaryValue, { color: cfg.accent }]}>
              {settled ? cfg.settledLabel : formatSoles(remaining)}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.summaryHint}>
              {cfg.progress(formatSoles(paid), formatSoles(lent))}
            </Text>
          </LinearGradient>

          <View style={styles.actions}>
            <Button
              title="Registrar pago"
              iconLeft="cash-outline"
              disabled={remaining <= 0}
              onPress={() => personId && openPayment(personId, direction)}
              style={{ flex: 1.4 }}
            />
            <Button
              title={cfg.moreButton}
              variant="secondary"
              onPress={() => personId && openLoan(direction, personId)}
              style={{ flex: 1 }}
            />
          </View>

          <Text style={styles.section}>{cfg.loansSection}</Text>
          {loans.map((l) => {
            const left = l.amount_cents - l.paid_cents;
            const done = left <= 0;
            const due = dueInfo(l.expected_return_date);
            return (
              <Pressable key={l.id} style={styles.item} onLongPress={() => confirmDeleteLoan(l)}
                delayLongPress={350}>
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
                    {done ? 'Pagado' : `${cfg.pillOwes} ${formatSoles(left)}`}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          <Text style={styles.section}>Pagos</Text>
          {payments.length === 0 ? (
            <Text style={styles.emptyList}>Aún no hay pagos.</Text>
          ) : (
            payments.map((p) => (
              <Pressable key={p.id} style={styles.item} onLongPress={() => confirmDeletePayment(p)}
                delayLongPress={350}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: paymentColor }]}>
                    {paymentSign} {formatSoles(p.amount_cents)}
                  </Text>
                  <Text style={styles.itemSub}>
                    {formatShortDate(p.paid_at)} · {p.card_name ?? 'Efectivo'}
                  </Text>
                </View>
              </Pressable>
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
  summaryValue: { fontSize: 32, fontWeight: '700', marginTop: 2 },
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