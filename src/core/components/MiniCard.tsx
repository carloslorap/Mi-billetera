import { getCardTheme } from '@/core/theme/cardThemes';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  name: string;
  bank?: string | null;
  last4?: string | null;
  width?: number;
};

export function MiniCard({ name, bank, last4, width = 38 }: Props) {
  const theme = getCardTheme(bank, name);
  const height = Math.round(width * 0.63); // proporción de una tarjeta real
  const radius = Math.round(width * 0.14);

  return (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { width, height, borderRadius: radius }]}
    >
      {/* curva decorativa, como en la tarjeta grande */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: width * 0.8,
          height: width * 0.8,
          borderRadius: width * 0.4,
          top: -height * 0.45,
          right: -width * 0.25,
          backgroundColor: 'rgba(255,255,255,0.14)',
        }}
      />
      {/* chip dorado */}
      <View
        style={{
          position: 'absolute',
          left: width * 0.12,
          top: height * 0.22,
          width: width * 0.22,
          height: width * 0.16,
          borderRadius: 2,
          backgroundColor: '#E6D9A8',
        }}
      />
      {last4 ? (
        <Text
          style={[styles.last4, { fontSize: Math.max(6, Math.round(width * 0.18)) }]}
          numberOfLines={1}
        >
          {last4}
        </Text>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  last4: {
    position: 'absolute',
    right: 4,
    bottom: 2,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});