import { Button } from '@/core/components/Button';
import { Chip } from '@/core/components/Chip';
import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { toCents } from '@/core/utils/money';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useCreateCard } from '../hooks';

const BANKS = ['BCP', 'BBVA', 'Interbank', 'Scotiabank', 'Otro'];

export function AddCardForm({ close }: { close: (after?: () => void) => void }) {
  const createCard = useCreateCard();
  const [bankChoice, setBankChoice] = useState<string | null>(null);
  const [customBank, setCustomBank] = useState('');
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');

  const bank = bankChoice === 'Otro' ? customBank.trim() : bankChoice ?? '';
  const cardName = name.trim() || bank;
  const amount = balance.trim() === '' ? 0 : parseFloat(balance.replace(',', '.'));
  const valid = cardName !== '' && !Number.isNaN(amount) && amount >= 0;

  const onSave = () => {
    if (!valid) return;
    createCard.mutate(
      { name: cardName, bank: bank || undefined, initialBalanceCents: toCents(amount) },
      { onSuccess: () => close() }
    );
  };

  return (
    <ScrollView
      style={{ flexGrow: 0 }}
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Nueva tarjeta</Text>
        <Pressable onPress={() => close()} hitSlop={12} accessibilityLabel="Cerrar">
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Text style={styles.label}>Banco</Text>
      <View style={styles.wrap}>
        {BANKS.map((b) => (
          <Chip
            key={b}
            label={b}
            active={b === bankChoice}
            onPress={() => setBankChoice(b === bankChoice ? null : b)}
          />
        ))}
      </View>
      {bankChoice === 'Otro' ? (
        <TextInput
          style={styles.input}
          placeholder="Nombre del banco"
          placeholderTextColor={colors.textSecondary}
          value={customBank}
          onChangeText={setCustomBank}
        />
      ) : null}

      <Text style={styles.label}>Nombre de la tarjeta (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder={bank ? `Ej. ${bank} Visa` : 'Ej. Visa Platinum'}
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Saldo inicial (S/)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor={colors.textSecondary}
        value={balance}
        onChangeText={setBalance}
        keyboardType="decimal-pad"
      />

      <Button
        title="Guardar tarjeta"
        iconLeft="checkmark"
        onPress={onSave}
        loading={createCard.isPending}
        disabled={!valid}
        style={{ marginTop: spacing.sm }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, gap: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: '700' },
  label: { color: colors.textSecondary, fontSize: fontSize.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  input: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.lg,
  },
});