import { Button } from '@/core/components/Button';
import { Chip } from '@/core/components/Chip';
import { Keypad } from '@/core/components/Keypad';
import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { formatShortDate } from '@/core/utils/dates';
import { formatSoles, toCents } from '@/core/utils/money';
import { useCards } from '@/features/cards/hooks';
import { nextAmount } from '@/features/transactions/amountInput';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { allocateOldestFirst } from '../allocate';
import { usePersonDetail, useRegisterPayment } from '../hooks';
import { isPaymentError } from '../repository';

const AMOUNT_GLOW = [
  { offsetX: 0, offsetY: 0, blurRadius: 14, spreadDistance: 0, color: 'rgba(149,255,119,0.22)' },
];

// 150 -> "150", 75.5 -> "75.5", 33.33 -> "33.33"
function amountToText(cents: number) {
  return (cents / 100).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

type Props = {
  close: (after?: () => void) => void;
  personId: string;
};

export function RegisterPaymentForm({ close, personId }: Props) {
  const { data: detail, isLoading } = usePersonDetail(personId);
  const { data: cards = [] } = useCards();
  const registerPayment = useRegisterPayment();

  const [amount, setAmount] = useState('');
  const [cardId, setCardId] = useState<string | null>(null); // null = efectivo

  const name = detail?.person.name ?? '';
  const openLoans = (detail?.loans ?? [])
    .map((l) => ({
      id: l.id,
      created_at: l.created_at,
      remaining_cents: l.amount_cents - l.paid_cents,
    }))
    .filter((l) => l.remaining_cents > 0);
  const remaining = openLoans.reduce((sum, l) => sum + l.remaining_cents, 0);

  const value = amount === '' ? 0 : parseFloat(amount);
  const cents = toCents(value);
  const exceeds = cents > remaining;
  const canConfirm = cents > 0 && !exceeds;

  // Vista previa con la misma regla que usa el guardado real
  const { allocations } = allocateOldestFirst(openLoans, canConfirm ? cents : 0);
  const firstLoan = openLoans.find((l) => l.id === allocations[0]?.loanId);
  const applyText =
    allocations.length === 1 && firstLoan
      ? `Se aplica al préstamo del ${formatShortDate(firstLoan.created_at)}`
      : allocations.length > 1
        ? `Se reparte entre ${allocations.length} préstamos, del más antiguo al más nuevo`
        : null;

  const onConfirm = () => {
    if (!canConfirm) return;
    registerPayment.mutate(
      { personId, amountCents: cents, cardId },
      {
        onSuccess: () => close(),
        onError: (e) => console.error('[registerPayment] falló:', e),
      }
    );
  };

  const closeButton = (
    <Pressable onPress={() => close()} hitSlop={12} accessibilityLabel="Cerrar">
      <Ionicons name="close" size={24} color={colors.textSecondary} />
    </Pressable>
  );

  if (isLoading) {
    return (
      <View style={styles.body}>
        <Text style={styles.hint}>Cargando…</Text>
      </View>
    );
  }

  if (remaining <= 0) {
    return (
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{name}</Text>
          {closeButton}
        </View>
        <Text style={styles.hint}>{name} no te debe nada por ahora.</Text>
        <Button title="Cerrar" variant="secondary" onPress={() => close()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flexGrow: 0 }}
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{name} te pagó</Text>
        {closeButton}
      </View>

      <View style={[styles.amountBox, { boxShadow: AMOUNT_GLOW }]}>
        <Text style={[styles.amountText, amount === '' && styles.amountPlaceholder]}>
          S/ {amount === '' ? '0' : amount}
        </Text>
      </View>

      <View style={styles.row}>
        <Chip
          label={`Todo · ${formatSoles(remaining)}`}
          active={cents === remaining}
          onPress={() => setAmount(amountToText(remaining))}
          style={{ flex: 1, paddingHorizontal: spacing.sm }}
        />
        <Chip
          label={`Mitad · ${formatSoles(Math.floor(remaining / 2))}`}
          active={cents > 0 && cents === Math.floor(remaining / 2)}
          onPress={() => setAmount(amountToText(Math.floor(remaining / 2)))}
          style={{ flex: 1, paddingHorizontal: spacing.sm }}
        />
      </View>

      <Keypad onKey={(k) => setAmount((a) => nextAmount(a, k))} />

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Debía</Text>
          <Text style={styles.infoValue}>{formatSoles(remaining)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Quedará en</Text>
          <Text style={[styles.infoValue, { color: exceeds ? colors.danger : colors.primary }]}>
            {exceeds ? '—' : formatSoles(remaining - cents)}
          </Text>
        </View>
        {exceeds ? (
          <Text style={[styles.infoHint, { color: colors.danger }]}>
            {name} solo debe {formatSoles(remaining)}.
          </Text>
        ) : applyText ? (
          <Text style={styles.infoHint}>{applyText}</Text>
        ) : null}
      </View>

      <Text style={styles.label}>¿Dónde lo recibiste?</Text>
      <View style={styles.wrap}>
        <Chip label="Efectivo" active={cardId === null} onPress={() => setCardId(null)} />
        {cards.map((c) => (
          <Chip
            key={c.id}
            label={`${c.name} · ${formatSoles(c.balance_cents)}`}
            active={c.id === cardId}
            onPress={() => setCardId(c.id)}
          />
        ))}
      </View>

      {registerPayment.isError ? (
        <Text style={styles.error}>
          {isPaymentError(registerPayment.error)
            ? registerPayment.error.message
            : 'No se pudo registrar el pago. Inténtalo de nuevo.'}
        </Text>
      ) : null}

      <Button
        title="Confirmar pago"
        iconLeft="checkmark"
        onPress={onConfirm}
        loading={registerPayment.isPending}
        disabled={!canConfirm}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700', flexShrink: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  label: { color: colors.textSecondary, fontSize: fontSize.md },
  hint: { color: colors.textSecondary, fontSize: fontSize.md },
  error: { color: colors.danger, fontSize: fontSize.md },
  amountBox: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  amountText: { color: colors.textPrimary, fontSize: 36, fontWeight: '700' },
  amountPlaceholder: { color: colors.textSecondary },
  infoBox: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { color: colors.textSecondary, fontSize: fontSize.md },
  infoValue: { color: colors.textPrimary, fontSize: fontSize.md, fontWeight: '600' },
  infoHint: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs },
});