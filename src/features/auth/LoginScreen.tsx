import { Button } from '@/core/components/Button';
import { colors } from '@/core/theme/colors';
import { fontSize, spacing } from '@/core/theme/layout';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithGoogle } from './signInWithGoogle';

export function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onPress = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await signInWithGoogle(); // si cierra la ventana de Google, no pasa nada
    } catch (e) {
      console.error('[login] falló:', e);
      setMessage('No se pudo iniciar sesión. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Ionicons name="wallet" size={44} color={colors.primary} />
        </View>
        <Text style={styles.title}>Mi Billetera</Text>
        <Text style={styles.subtitle}>
          Entra con tu cuenta de Google para guardar tus tarjetas, préstamos y compras a tu nombre.
        </Text>
        {message ? <Text style={styles.error}>{message}</Text> : null}
      </View>

      <View style={styles.footer}>
        <Button
          title="Continuar con Google"
          iconLeft="logo-google"
          loading={loading}
          onPress={onPress}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.textPrimary, fontSize: fontSize.xxl, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center' },
  error: { color: colors.danger, fontSize: fontSize.md, textAlign: 'center' },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});