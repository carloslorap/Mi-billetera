import { Button } from '@/core/components/Button';
import { colors } from '@/core/theme/colors';
import { fontSize, spacing } from '@/core/theme/layout';
import { useSession } from '@/features/auth/SessionProvider';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SummaryScreen() {

  const { signOut, session } = useSession();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Resumen</Text>
      <Text style={styles.text}>Aquí verás tus gastos por mes y por categoría.</Text>


      <Text style={{ color: colors.textSecondary }}>{session?.user.email}</Text>
      <Button title="Cerrar sesión" variant="secondary" onPress={signOut} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '700' },
  text: { color: colors.textSecondary, fontSize: fontSize.md, marginTop: spacing.sm },
});