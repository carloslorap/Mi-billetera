import { Button } from '@/core/components/Button';
import { Chip } from '@/core/components/Chip';
import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { formatSoles } from '@/core/utils/money';
import { PersonDebtRow } from '@/features/loans/components/PersonDebtRow';
import { usePersonDebts } from '@/features/loans/hooks';
import { useNewLoan } from '@/features/loans/NewLoanProvider';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ARROW_SIZE = 70;

export default function LoansScreen() {
  const { open: openLoan } = useNewLoan();
  const { data: debts = [] } = usePersonDebts();
  const [filter, setFilter] = useState<'pending' | 'paid'>('pending');

  const pending = debts.filter((d) => d.remaining_cents > 0);
  const paid = debts.filter((d) => d.remaining_cents <= 0);
  const list = filter === 'pending' ? pending : paid;
  const total = pending.reduce((sum, d) => sum + d.remaining_cents, 0);

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>Préstamos</Text>

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
        <Text style={styles.summaryLabel}>Te deben</Text>
        <Text style={styles.summaryValue}>{formatSoles(total)}</Text>
        <Text style={styles.summaryHint}>
          {pending.length} {pending.length === 1 ? 'persona' : 'personas'}
        </Text>
      </LinearGradient>

      <View style={styles.filters}>
        <Chip label="Pendientes" active={filter === 'pending'} onPress={() => setFilter('pending')} />
        <Chip label="Pagados" active={filter === 'paid'} onPress={() => setFilter('paid')} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={list}
        keyExtractor={(d) => d.person_id}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {filter === 'pending'
                ? 'Aún no le has prestado a nadie.'
                : 'Nadie ha terminado de pagarte todavía.'}
            </Text>
            {filter === 'pending' ? (
              <Button
                title="Prestar dinero"
                variant="secondary"
                size="md"
                fullWidth={false}
                onPress={() => openLoan()}
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => <PersonDebtRow item={item} onPress={() => router.push({ pathname: '/people/[id]', params: { id: item.person_id } })} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md, marginBottom: spacing.md },
  title: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '700' },
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
  summaryHint: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  filters: { flexDirection: 'row', gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl, paddingHorizontal: spacing.lg },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center' },
});