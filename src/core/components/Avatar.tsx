import { AVATARS } from '@/core/avatars';
import { colors } from '@/core/theme/colors';
import { Image, StyleSheet, Text, View } from 'react-native';

type Props = {
  name: string;
  avatar?: string | null;
  size?: number;
};

const TINTS = ['#2E4A3A', '#2E3F57', '#51392E', '#4A2E4F', '#4F4A2E', '#2E4F4D'];

function tintFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % TINTS.length;
  return TINTS[h];
}

export function Avatar({ name, avatar, size = 44 }: Props) {
  const source = avatar ? AVATARS[avatar] : undefined;
  const round = { width: size, height: size, borderRadius: size / 2 };

  if (source) {
    return <Image source={source} style={[styles.img, round]} resizeMode="cover" />;
  }

  return (
    <View style={[styles.fallback, round, { backgroundColor: tintFor(name) }]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>
        {name.trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: colors.surface },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.textPrimary, fontWeight: '800' },
});