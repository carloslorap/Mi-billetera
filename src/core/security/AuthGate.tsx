import { colors } from '@/core/theme/colors';
import {
  bottomShade,
  glow,
  greenGradient,
  metalGradient,
  topLight,
  topLightLocations,
} from '@/core/theme/effects';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';

const LOCK_AFTER_MS = 30_000; // se vuelve a bloquear tras 30 s en segundo plano
const AUTO_PROMPT = false; // true = pide la huella solo, false = esperar al botón

export function AuthGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const authenticating = useRef(false);
  const backgroundedAt = useRef<number | null>(null);

  const authenticate = useCallback(async () => {
    if (authenticating.current) return;
    authenticating.current = true;
    setMessage(null);
    try {
      const level = await LocalAuthentication.getEnrolledLevelAsync();
      if (level === LocalAuthentication.SecurityLevel.NONE) {
        setUnlocked(true);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquea tu billetera',
        cancelLabel: 'Cancelar',
      });
      if (result.success) {
        setUnlocked(true);
      } else if (result.error !== 'user_cancel') {
        setMessage('No se pudo verificar. Inténtalo de nuevo.');
      }
    } finally {
      authenticating.current = false;
    }
  }, []);

  useEffect(() => {
    if (AUTO_PROMPT) authenticate();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundedAt.current = Date.now();
      if (state === 'active' && backgroundedAt.current !== null) {
        const awayMs = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (awayMs > LOCK_AFTER_MS) {
          setUnlocked(false);
          if (AUTO_PROMPT) authenticate();
        }
      }
    });
    return () => sub.remove();
  }, [authenticate]);

  if (unlocked) return <>{children}</>;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={topLight}
        locations={topLightLocations}
        style={styles.topLight}
        pointerEvents="none"
      />
      <LinearGradient colors={bottomShade} style={styles.bottomShade} pointerEvents="none" />

      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.illustration}>
            <View style={styles.lockGlow}>
              <LinearGradient colors={metalGradient} style={styles.lockCircle}>
                <Ionicons name="lock-closed" size={56} color={colors.primary} />
              </LinearGradient>
            </View>
            <View style={styles.badge}>
              <LinearGradient colors={greenGradient} style={styles.badgeFill}>
                <Ionicons name="wallet" size={20} color={colors.background} />
              </LinearGradient>
            </View>
          </View>

          <Ionicons name="finger-print" size={44} color={colors.border} style={styles.scanIcon} />

          <Text style={styles.kicker}>Hola de nuevo</Text>
          <Text style={styles.title}>Desbloquea tu billetera.</Text>
          <Text style={styles.subtitle}>
            Tus tarjetas y préstamos están guardados en este celular. Entra con tu huella o tu PIN.
          </Text>
          {message ? <Text style={styles.error}>{message}</Text> : null}
        </View>

        <Button
          title="Entrar con huella o PIN"
          iconRight="finger-print"
          onPress={authenticate}
          style={{ marginHorizontal: spacing.lg, marginBottom: spacing.lg }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topLight: { position: 'absolute', top: 0, left: 0, right: 0, height: 440 },
  bottomShade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220 },
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  illustration: { width: 128, height: 128 },
  lockGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    boxShadow: glow.halo,
  },
  lockCircle: {
    flex: 1,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderTopColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.background,
    boxShadow: glow.badge,
  },
  badgeFill: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIcon: { marginTop: spacing.lg },
  kicker: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginTop: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  buttonGlow: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    boxShadow: glow.button,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderTopColor: 'rgba(255,255,255,0.5)',
  },
  buttonPressed: { opacity: 0.9 },
  buttonText: { color: colors.background, fontSize: fontSize.lg, fontWeight: '700' },
});