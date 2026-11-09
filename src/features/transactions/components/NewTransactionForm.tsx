// import { BottomSheet } from '@/core/components/BottomSheet';
import { Button } from '@/core/components/Button';
import { Chip } from '@/core/components/Chip';
import { Keypad } from '@/core/components/Keypad';
import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { formatSoles, toCents } from '@/core/utils/money';
import { useAddCard } from '@/features/cards/AddCardProvider';
import { useCards } from '@/features/cards/hooks';
import { nextAmount } from '@/features/transactions/amountInput';
import { EXPENSE_CATEGORIES } from '@/features/transactions/categories';
import { useCreateTransaction } from '@/features/transactions/hooks';
import type { TransactionType } from '@/features/transactions/types';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const QUICK_AMOUNTS = [10, 20, 50, 100];
const AMOUNT_GLOW = [
  { offsetX: 0, offsetY: 0, blurRadius: 14, spreadDistance: 0, color: 'rgba(149,255,119,0.22)' },
];

// export default function NewTransactionScreen() {
//   return (
//     <BottomSheet onClose={() => router.back()}>
//       {(close) => <NewTransactionForm close={close} />}
//     </BottomSheet>
//   );
// }

export function NewTransactionForm({ close }: { close: (after?: () => void) => void }) {
  const { data: cards = [] } = useCards();
  const createTransaction = useCreateTransaction();

  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const isExpense = type === 'expense';
  const value = amount === '' ? 0 : parseFloat(amount);
  const cardId = selectedCardId ?? cards[0]?.id ?? null;
  const { open: openAddCard } = useAddCard();

  const onSave = () => {
    if (!cardId || value <= 0) return;
    createTransaction.mutate(
      {
        cardId,
        kind: type,
        amountCents: toCents(value),
        description,
        category: isExpense ? category ?? undefined : undefined,
      },
      { onSuccess: () => close() }
    );
  };

  const closeButton = (
    <Pressable onPress={() => close()} hitSlop={12} accessibilityLabel="Cerrar">
      <Ionicons name="close" size={24} color={colors.textSecondary} />
    </Pressable>
  );

  return (
    <ScrollView
      style={{ flexGrow: 0 }}
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {step === 1 ? (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Nuevo movimiento</Text>
            {closeButton}
          </View>

          <View style={styles.row}>
            <Chip label="Gasto" active={isExpense} onPress={() => setType('expense')} />
            <Chip label="Ingreso" active={!isExpense} onPress={() => setType('income')} />
          </View>

          <Text style={styles.label}>Monto</Text>
          <View style={[styles.amountBox, { boxShadow: AMOUNT_GLOW }]}>
            <Text style={[styles.amountText, amount === '' && styles.amountPlaceholder]}>
              S/ {amount === '' ? '0' : amount}
            </Text>
          </View>

          <View style={styles.row}>
            {QUICK_AMOUNTS.map((q) => (
              <Chip
                key={q}
                label={`S/ ${q}`}
                active={amount === String(q)}
                onPress={() => setAmount(String(q))}
                style={{ flex: 1, paddingHorizontal: spacing.sm }}
              />
            ))}
          </View>

          <Keypad onKey={(k) => setAmount((a) => nextAmount(a, k))} />

          <Button
            title="Siguiente"
            iconRight="arrow-forward"
            disabled={value <= 0}
            onPress={() => setStep(2)}
          />
        </>
      ) : (
        <>
          <View style={styles.headerRow}>
            <Pressable onPress={() => setStep(1)} hitSlop={12} style={styles.backRow}>
              <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
              <Text style={styles.title}>Detalles</Text>
            </Pressable>
            {closeButton}
          </View>

          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>{isExpense ? 'Gasto' : 'Ingreso'}</Text>
            <Text
              style={[styles.summaryValue, { color: isExpense ? colors.danger : colors.success }]}
            >
              {isExpense ? '-' : '+'} {formatSoles(toCents(value))}
            </Text>
          </View>

          <Text style={styles.label}>Tarjeta</Text>
          {cards.length === 0 ? (
            <View style={styles.noCards}>
              <Text style={styles.hint}>Aún no tienes tarjetas.</Text>
              <Button
                title="Agregar tarjeta"
                variant="secondary"
                size="md"
                fullWidth={false}
                onPress={() => close(openAddCard)}
              />
            </View>
          ) : (
            <View style={styles.wrap}>
              {cards.map((c) => (
                <Chip
                  key={c.id}
                  label={`${c.name} · ${formatSoles(c.balance_cents)}`}
                  active={c.id === cardId}
                  onPress={() => setSelectedCardId(c.id)}
                />
              ))}
            </View>
          )}

          {isExpense ? (
            <>
              <Text style={styles.label}>Categoría</Text>
              <View style={styles.wrap}>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    active={cat === category}
                    onPress={() => setCategory(cat === category ? null : cat)}
                  />
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Almuerzo con el equipo"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.actions}>
            <Button
              title="Atrás"
              variant="secondary"
              onPress={() => setStep(1)}
              style={{ flex: 1 }}
            />
            <Button
              title="Guardar"
              iconLeft="checkmark"
              onPress={onSave}
              loading={createTransaction.isPending}
              disabled={!cardId}
              style={{ flex: 2 }}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  label: { color: colors.textSecondary, fontSize: fontSize.md },
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
  summary: { alignItems: 'center', paddingVertical: spacing.sm },
  summaryLabel: { color: colors.textSecondary, fontSize: fontSize.md },
  summaryValue: { fontSize: 32, fontWeight: '700', marginTop: 2 },
  noCards: { gap: spacing.md, alignItems: 'flex-start' },
  hint: { color: colors.textSecondary, fontSize: fontSize.md },
  input: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.lg,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});