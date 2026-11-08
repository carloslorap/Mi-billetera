import { colors } from '@/core/theme/colors';
import { fontSize, spacing } from '@/core/theme/layout';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DebtsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Deudas</Text>
      <Text style={styles.text}>Aquí verás lo que debes y a quién.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '700' },
  text: { color: colors.textSecondary, fontSize: fontSize.md, marginTop: spacing.sm },
});