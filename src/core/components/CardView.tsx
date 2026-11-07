import { getCardTheme } from '@/core/theme/cardThemes';
import { fontSize, spacing } from '@/core/theme/layout';
import { formatSoles } from '@/core/utils/money';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  name: string;
  bank?: string | null;
  balanceCents: number;
  last4?: string | null;
};

export function CardView({ name, bank, balanceCents, last4 }: Props) {
  const theme = getCardTheme(bank, name);
  const bankName = bank?.trim();
  const title = (bankName || name).toUpperCase();
  const subtitle =
    bankName && bankName.toLowerCase() !== name.trim().toLowerCase() ? name : null;

  return (
    <View
      style={[
        styles.shadow,
        {
          boxShadow: [
            { offsetX: 0, offsetY: 10, blurRadius: 28, spreadDistance: 0, color: theme.glow },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* curvas decorativas */}
        <View style={styles.curveA} pointerEvents="none" />
        <View style={styles.curveB} pointerEvents="none" />

        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bank} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Ionicons
            name="wifi"
            size={22}
            color="rgba(255,255,255,0.7)"
            style={styles.contactless}
          />
        </View>

        <View style={styles.chip}>
          <LinearGradient colors={['#F1E6B8', '#C2B27A']} style={StyleSheet.absoluteFill} />
          <View style={[styles.chipLine, { top: 11, left: 0, right: 0, height: 1 }]} />
          <View style={[styles.chipLine, { top: 22, left: 0, right: 0, height: 1 }]} />
          <View style={[styles.chipLine, { top: 0, bottom: 0, left: 22, width: 1 }]} />
        </View>

        <View style={styles.bottom}>
          <View>
            <Text style={styles.balanceLabel}>Saldo disponible</Text>
            <Text style={styles.balance}>{formatSoles(balanceCents)}</Text>
          </View>
          {last4 ? <Text style={styles.last4}>•••• {last4}</Text> : null}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { borderRadius: 20 },
  card: {
    aspectRatio: 1.586, // proporción de una tarjeta real
    borderRadius: 20,
    padding: spacing.lg,
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderTopColor: 'rgba(255,255,255,0.30)',
  },
  curveA: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    right: -130,
    top: -180,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  curveB: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -70,
    bottom: -150,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  bank: { color: '#FFFFFF', fontSize: fontSize.xl, fontWeight: '800', letterSpacing: 1.5 },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: fontSize.sm, marginTop: 2 },
  contactless: { transform: [{ rotate: '90deg' }] },
  chip: { width: 46, height: 34, borderRadius: 7, overflow: 'hidden' },
  chipLine: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.22)' },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: fontSize.sm },
  balance: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginTop: 2 },
  last4: { color: 'rgba(255,255,255,0.85)', fontSize: fontSize.md, letterSpacing: 1 },
});