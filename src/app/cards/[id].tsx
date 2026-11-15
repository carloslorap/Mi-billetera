import { CardView } from '@/core/components/CardView';
import { Chip } from '@/core/components/Chip';
import { StaggerItem } from '@/core/components/StaggerItem';
import { INFLOW_KINDS } from '@/core/db/kinds';
import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { formatSoles } from '@/core/utils/money';
import { useCards } from '@/features/cards/hooks';
import { TransactionItem } from '@/features/transactions/components/TransactionItem';
import { useCardTransactions } from '@/features/transactions/hooks';
import { Ionicons } from '@expo/vector-icons';
import { endOfMonth, isWithinInterval, startOfMonth, subMonths } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Period = 'month' | 'prev' | 'all';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'month', label: 'Este mes' },
  { key: 'prev', label: 'Mes pasado' },
  { key: 'all', label: 'Todo' },
];

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [period, setPeriod] = useState<Period>('month');

  const { data: cards } = useCards();
  const { data: all = [] } = useCardTransactions(id);
  const card = cards?.find((c) => c.id === id);

  const items = useMemo(() => {
    if (period === 'all') return all;
    const ref = period === 'month' ? new Date() : subMonths(new Date(), 1);
    const range = { start: startOfMonth(ref), end: endOfMonth(ref) };
    return all.filter((t) => isWithinInterval(new Date(t.occurred_at), range));
  }, [all, period]);

  const { entro, salio } = useMemo(() => {
    let entro = 0;
    let salio = 0;
    for (const t of items) {
      if ((INFLOW_KINDS as readonly string[]).includes(t.kind)) entro += t.amount_cents;
      else salio += t.amount_cents;
    }
    return { entro, salio };
  }, [items]);

  if (!card) {
    return (
      <SafeAreaView style={styles.root}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.empty}>No encontré esta tarjeta.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </Pressable>

            <View style={styles.cardBox}>
              <CardView
                name={card.name}
                bank={card.bank}
                balanceCents={card.balance_cents}
                last4={card.last4}
              />
            </View>

            <View style={styles.chips}>
              {PERIODS.map((p) => (
                <Chip
                  key={p.key}
                  label={p.label}
                  active={period === p.key}
                  onPress={() => setPeriod(p.key)}
                />
              ))}
            </View>

            <View style={styles.totals}>
              <StaggerItem index={0} style={styles.flex1}>
                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Entró</Text>
                  <Text style={[styles.totalValue, { color: colors.success }]}>
                    {formatSoles(entro)}
                  </Text>
                </View>
              </StaggerItem>
              <StaggerItem index={1} style={styles.flex1}>
                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Salió</Text>
                  <Text style={[styles.totalValue, { color: colors.danger }]}>
                    {formatSoles(salio)}
                  </Text>
                </View>
              </StaggerItem>
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item, index }) => (
           <StaggerItem index={index}>
            <TransactionItem item={item} />
          </StaggerItem>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Sin movimientos en este periodo.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xl },
  header: { gap: spacing.md, paddingBottom: spacing.md },
  back: {
    marginLeft: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  cardBox: { marginHorizontal: spacing.lg },
  chips: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg },
  totals: { flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.lg },
  totalBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  totalValue: { fontSize: fontSize.lg, fontWeight: '800' },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  flex1: { flex: 1 },
});