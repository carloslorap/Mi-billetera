import { colors } from '@/core/theme/colors';
import { fontSize, spacing } from '@/core/theme/layout';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoansScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Préstamos</Text>
      <Text style={styles.text}>Aquí verás a quién le prestaste y cuánto te deben.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '700' },
  text: { color: colors.textSecondary, fontSize: fontSize.md, marginTop: spacing.sm },
});