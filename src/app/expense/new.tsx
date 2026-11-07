import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { formatSoles, toCents } from '@/core/utils/money';
import { useCards } from '@/features/cards/hooks';
import { EXPENSE_CATEGORIES } from '@/features/transactions/categories';
import { useCreateTransaction } from '@/features/transactions/hooks';
import type { TransactionType } from '@/features/transactions/types';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function NewTransactionScreen() {
  const { data: cards = [] } = useCards();
  const createTransaction = useCreateTransaction();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const cardId = selectedCardId ?? cards[0]?.id ?? null;

  const onSave = () => {
    const value = parseFloat(amount.replace(',', '.'));
    if (!cardId) {
      Alert.alert('Falta una tarjeta', 'Primero agrega una tarjeta en la pestaña Tarjetas.');
      return;
    }
    if (Number.isNaN(value) || value <= 0) {
      Alert.alert('Revisa el monto', 'Escribe un monto mayor a cero.');
      return;
    }
    createTransaction.mutate(
      {
        cardId,
        type,
        amountCents: toCents(value),
        description,
        category: type === 'expense' ? category ?? undefined : undefined,
      },
      { onSuccess: () => router.back() }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Nuevo movimiento</Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.cancel}>Cancelar</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Chip label="Gasto" active={type === 'expense'} onPress={() => setType('expense')} />
          <Chip label="Ingreso" active={type === 'income'} onPress={() => setType('income')} />
        </View>

        <Text style={styles.label}>Monto (S/)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          placeholderTextColor={colors.textSecondary}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Tarjeta</Text>
        {cards.length === 0 ? (
          <Text style={styles.hint}>Aún no tienes tarjetas. Agrega una en la pestaña Tarjetas.</Text>
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

        {type === 'expense' ? (
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

        <Pressable
          style={[styles.saveButton, createTransaction.isPending && { opacity: 0.6 }]}
          onPress={onSave}
          disabled={createTransaction.isPending}
        >
          <Text style={styles.saveText}>Guardar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' },
  cancel: { color: colors.textSecondary, fontSize: fontSize.lg },
  row: { flexDirection: 'row', gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  label: { color: colors.textSecondary, fontSize: fontSize.md, marginTop: spacing.md },
  hint: { color: colors.textSecondary, fontSize: fontSize.md },
  amountInput: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: fontSize.display,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.lg,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
  chipTextActive: { color: colors.background },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveText: { color: colors.background, fontSize: fontSize.lg, fontWeight: '700' },
});