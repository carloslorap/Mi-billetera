import { Button } from '@/core/components/Button';
import { Chip } from '@/core/components/Chip';
import { Keypad } from '@/core/components/Keypad';
import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { formatSoles, toCents } from '@/core/utils/money';
import { useCards } from '@/features/cards/hooks';
import { nextAmount } from '@/features/transactions/amountInput';
import { Ionicons } from '@expo/vector-icons';
import { addDays, addMonths, format } from 'date-fns';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCreateLoan, usePeople } from '../hooks';

const QUICK_AMOUNTS = [20, 50, 100, 200];
const AMOUNT_GLOW = [
  { offsetX: 0, offsetY: 0, blurRadius: 14, spreadDistance: 0, color: 'rgba(149,255,119,0.22)' },
];

type DueOption = { key: string; label: string; date: () => Date | null };

const DUE_OPTIONS: DueOption[] = [
  { key: 'none', label: 'Sin fecha', date: () => null },
  { key: '1w', label: '1 semana', date: () => addDays(new Date(), 7) },
  { key: '2w', label: '2 semanas', date: () => addDays(new Date(), 14) },
  { key: '1m', label: '1 mes', date: () => addMonths(new Date(), 1) },
  { key: '3m', label: '3 meses', date: () => addMonths(new Date(), 3) },
];

type Props = {
  close: (after?: () => void) => void;
  initialPersonId: string | null;
};

export function NewLoanForm({ close, initialPersonId }: Props) {
  const { data: people = [], isLoading: loadingPeople } = usePeople();
  const { data: cards = [] } = useCards();
  const createLoan = useCreateLoan();

  const [step, setStep] = useState<1 | 2>(1);
  const [personId, setPersonId] = useState<string | null>(initialPersonId);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [amount, setAmount] = useState('');
  const [cardId, setCardId] = useState<string | null>(null); // null = efectivo
  const [dueKey, setDueKey] = useState('none');
  const [notes, setNotes] = useState('');

  const showNewInput = creatingNew || (!loadingPeople && people.length === 0);
  const selectedPerson = showNewInput ? null : (people.find((p) => p.id === personId) ?? null);
  const personName = showNewInput ? newName.trim() : (selectedPerson?.name ?? '');
  const value = amount === '' ? 0 : parseFloat(amount);
  const canContinue = personName !== '' && value > 0;

  const onSave = () => {
    if (!canContinue) return;
    const due = DUE_OPTIONS.find((o) => o.key === dueKey)?.date() ?? null;
    createLoan.mutate(
      {
        person: selectedPerson
          ? { id: selectedPerson.id, name: selectedPerson.name }
          : { id: null, name: personName },
        amountCents: toCents(value),
        cardId,
        expectedReturnDate: due ? format(due, 'yyyy-MM-dd') : null,
        notes,
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
            <Text style={styles.title}>Nuevo préstamo</Text>
            {closeButton}
          </View>

          <Text style={styles.label}>¿A quién le prestas?</Text>
          <View style={styles.wrap}>
            {people.map((p) => (
              <Chip
                key={p.id}
                label={p.name}
                active={!showNewInput && p.id === personId}
                onPress={() => {
                  setPersonId(p.id);
                  setCreatingNew(false);
                }}
              />
            ))}
            <Chip
              label="+ Nueva"
              active={showNewInput}
              onPress={() => {
                setCreatingNew(true);
                setPersonId(null);
              }}
            />
          </View>
          {showNewInput ? (
            <TextInput
              style={styles.input}
              placeholder="Nombre de la persona"
              placeholderTextColor={colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
            />
          ) : null}

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
            disabled={!canContinue}
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
            <Text style={styles.summaryLabel}>Prestas a {personName}</Text>
            <Text style={styles.summaryValue}>{formatSoles(toCents(value))}</Text>
          </View>

          <Text style={styles.label}>¿De dónde sale?</Text>
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

          <Text style={styles.label}>¿Cuándo te lo devuelve?</Text>
          <View style={styles.wrap}>
            {DUE_OPTIONS.map((o) => (
              <Chip
                key={o.key}
                label={o.label}
                active={o.key === dueKey}
                onPress={() => setDueKey(o.key)}
              />
            ))}
          </View>

          <Text style={styles.label}>Nota (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. para el taxi"
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
          />

          <View style={styles.actions}>
            <Button title="Atrás" variant="secondary" onPress={() => setStep(1)} style={{ flex: 1 }} />
            <Button
              title="Guardar"
              iconLeft="checkmark"
              onPress={onSave}
              loading={createLoan.isPending}
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
  input: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.lg,
  },
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
  summaryValue: { color: colors.textPrimary, fontSize: 32, fontWeight: '700', marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});