// import { colors } from '@/core/theme/colors';
// import { fontSize, radius, spacing } from '@/core/theme/layout';
// import { formatSoles } from '@/core/utils/money';
// import { useCards } from '@/features/cards/hooks';
// import { useRecentTransactions } from '@/features/transactions/hooks';
// import { router } from 'expo-router';
// import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// export default function HomeScreen() {
//   const { data: cards = [] } = useCards();
//   const { data: transactions = [] } = useRecentTransactions(15);
//   const total = cards.reduce((sum, c) => sum + c.balance_cents, 0);

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       <Text style={styles.label}>Saldo total</Text>
//       <Text style={styles.total}>{formatSoles(total)}</Text>

//       <Pressable style={styles.button} onPress={() => router.push('/expense/new')}>
//         <Text style={styles.buttonText}>Registrar movimiento</Text>
//       </Pressable>

//       <Text style={styles.section}>Últimos movimientos</Text>
//       <FlatList
//         data={transactions}
//         keyExtractor={(t) => t.id}
//         contentContainerStyle={{ gap: spacing.sm }}
//         ListEmptyComponent={<Text style={styles.empty}>Aún no hay movimientos.</Text>}
//         renderItem={({ item }) => {
//           const isExpense = item.type === 'expense';
//           const date = new Date(item.occurred_at).toLocaleDateString('es-PE', {
//             day: '2-digit',
//             month: 'short',
//           });
//           return (
//             <View style={styles.row}>
//               <View style={{ flex: 1 }}>
//                 <Text style={styles.rowTitle}>
//                   {item.description || item.category || (isExpense ? 'Gasto' : 'Ingreso')}
//                 </Text>
//                 <Text style={styles.rowSub}>{item.card_name} · {date}</Text>
//               </View>
//               <Text style={[styles.amount, { color: isExpense ? colors.danger : colors.success }]}>
//                 {isExpense ? '-' : '+'} {formatSoles(item.amount_cents)}
//               </Text>
//             </View>
//           );
//         }}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
//   label: { color: colors.textSecondary, fontSize: fontSize.md },
//   total: { color: colors.primary, fontSize: fontSize.display, fontWeight: '700', marginBottom: spacing.lg },
//   button: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems: 'center' },
//   buttonText: { color: colors.background, fontSize: fontSize.lg, fontWeight: '700' },
//   section: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '600', marginTop: spacing.xl, marginBottom: spacing.md },
//   empty: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
//   row: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
//   rowTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '600' },
//   rowSub: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
//   amount: { fontSize: fontSize.lg, fontWeight: '700' },
// });

import { Button } from '@/core/components/Button';
import { CardDeck } from '@/core/components/CardDeck';
import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { formatSoles } from '@/core/utils/money';
import { useCards } from '@/features/cards/hooks';
import { TransactionItem } from '@/features/transactions/components/TransactionItem';
import { useRecentTransactions } from '@/features/transactions/hooks';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { data: cards = [] } = useCards();
  const { data: transactions = [] } = useRecentTransactions(15);

  const cardWidth = width - spacing.lg * 2;
  const total = cards.reduce((sum, c) => sum + c.balance_cents, 0);

  const deckCards = cards.map((c) => ({
    id: c.id,
    name: c.name,
    bank: c.bank,
    balanceCents: c.balance_cents,
  }));

  const header = (
    <View>
      <Text style={styles.sectionLabel}>Tus tarjetas</Text>

      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Agrega tu primera tarjeta para ver tu saldo aquí.</Text>
          <Button
            title="Agregar tarjeta"
            size="md"
            variant="secondary"
            fullWidth={false}
            onPress={() => router.push('/cards')}
          />
        </View>
      ) : (
        // <FlatList
        //   horizontal
        //   data={cards}
        //   keyExtractor={(c) => c.id}
        //   showsHorizontalScrollIndicator={false}
        //   decelerationRate="fast"
        //   snapToOffsets={cards.map((_, i) => i * (cardWidth + spacing.md))}
        //   contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
        //   renderItem={({ item }) => (
        //     <View style={{ width: cardWidth }}>
        //       <CardView name={item.name} bank={item.bank} balanceCents={item.balance_cents} />
        //     </View>
        //   )}
        // />
        <View style={{ alignItems: 'center' }}>
          <CardDeck width={cardWidth} cards={deckCards} />
        </View>
      )}

      {cards.length > 1 ? (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Saldo total</Text>
          <Text style={styles.totalValue}>{formatSoles(total)}</Text>
        </View>
      ) : null}

      <Text style={styles.section}>Últimos movimientos</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={transactions}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<Text style={styles.emptyList}>Aún no hay movimientos.</Text>}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        renderItem={({ item }) => <TransactionItem item={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  empty: {
    marginHorizontal: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  totalLabel: { color: colors.textSecondary, fontSize: fontSize.md },
  totalValue: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '700' },
  section: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: '600',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  emptyList: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowTitle: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '600' },
  rowSub: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  amount: { fontSize: fontSize.lg, fontWeight: '700' },
});