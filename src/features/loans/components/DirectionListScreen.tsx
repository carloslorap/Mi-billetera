import { Button } from '@/core/components/Button';
import { Chip } from '@/core/components/Chip';
import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { formatSoles } from '@/core/utils/money';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DIRECTION, type LoanDirection } from '../direction';
import { usePersonDebts } from '../hooks';
import { useNewLoan } from '../NewLoanProvider';
import { PersonDebtRow } from './PersonDebtRow';

const ARROW_SIZE = 70;

export function DirectionListScreen({ direction }: { direction: LoanDirection }) {
  const cfg = DIRECTION[direction];
  const { open: openLoan } = useNewLoan();
  const { data: debts = [] } = usePersonDebts(direction);
  const [filter, setFilter] = useState<'pending' | 'paid'>('pending');

  const pending = debts.filter((d) => d.remaining_cents > 0);
  const paid = debts.filter((d) => d.remaining_cents <= 0);
  const list = filter === 'pending' ? pending : paid;
  const total = pending.reduce((sum, d) => sum + d.remaining_cents, 0);

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>{cfg.listTitle}</Text>

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
        <Text style={styles.summaryLabel}>{cfg.summaryLabel}</Text>
        <Text style={[styles.summaryValue, { color: cfg.accent }]}>{formatSoles(total)}</Text>
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
              {filter === 'pending' ? cfg.emptyPending : cfg.emptyPaid}
            </Text>
            {filter === 'pending' ? (
              <Button
                title={cfg.emptyCta}
                variant="secondary"
                size="md"
                fullWidth={false}
                onPress={() => openLoan(direction)}
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <PersonDebtRow
            item={item}
            direction={direction}
            onPress={() =>
              router.push({ pathname: '/people/[id]', params: { id: item.person_id, direction } })
            }
          />
        )}
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
  summaryValue: { fontSize: 32, fontWeight: '700', marginTop: 2 },
  summaryHint: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  filters: { flexDirection: 'row', gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl, paddingHorizontal: spacing.lg },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center' },
});