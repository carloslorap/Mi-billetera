import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { formatSoles, toCents } from '@/core/utils/money';
import { useCards, useCreateCard } from '@/features/cards/hooks';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CardsScreen() {
  const { data: cards = [] } = useCards();
  const createCard = useCreateCard();
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [balance, setBalance] = useState('');

  const total = cards.reduce((sum, c) => sum + c.balance_cents, 0);

  const onSubmit = () => {
    const amount = parseFloat(balance.replace(',', '.'));
    if (!name.trim() || Number.isNaN(amount) || amount < 0) {
      Alert.alert('Revisa los datos', 'Pon un nombre y un monto válido.');
      return;
    }
    createCard.mutate(
      { name, bank, initialBalanceCents: toCents(amount) },
      { onSuccess: () => { setName(''); setBank(''); setBalance(''); } }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.label}>Saldo total</Text>
      <Text style={styles.total}>{formatSoles(total)}</Text>

      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Nombre (ej. BCP Visa)" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Banco (opcional)" placeholderTextColor={colors.textSecondary} value={bank} onChangeText={setBank} />
        <TextInput style={styles.input} placeholder="Monto inicial (S/)" placeholderTextColor={colors.textSecondary} value={balance} onChangeText={setBalance} keyboardType="decimal-pad" />
        <Pressable style={styles.button} onPress={onSubmit}>
          <Text style={styles.buttonText}>Agregar tarjeta</Text>
        </Pressable>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ gap: spacing.sm }}
        ListEmptyComponent={<Text style={styles.empty}>Aún no tienes tarjetas.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.cardName}>{item.name}</Text>
              {item.bank ? <Text style={styles.cardBank}>{item.bank}</Text> : null}
            </View>
            <Text style={styles.cardBalance}>{formatSoles(item.balance_cents)}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  label: { color: colors.textSecondary, fontSize: fontSize.md },
  total: { color: colors.primary, fontSize: fontSize.display, fontWeight: '700', marginBottom: spacing.lg },
  form: { gap: spacing.sm, marginBottom: spacing.lg },
  input: { backgroundColor: colors.surface, color: colors.textPrimary, borderRadius: radius.md, padding: spacing.md, fontSize: fontSize.lg },
  button: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  buttonText: { color: colors.background, fontSize: fontSize.lg, fontWeight: '700' },
  empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '600' },
  cardBank: { color: colors.textSecondary, fontSize: fontSize.sm },
  cardBalance: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '700' },
});