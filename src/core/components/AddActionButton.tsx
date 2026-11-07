import { colors } from '@/core/theme/colors';
import { glow, greenGradient } from '@/core/theme/effects';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

type Props = { open: boolean; onPress: () => void; bottom: number };

export function AddActionButton({ open, onPress, bottom }: Props) {
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    <View style={[styles.wrapper, { bottom }]} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={open ? 'Cerrar menú' : 'Registrar movimiento'}
        style={({ pressed }) => [styles.ring, pressed && { opacity: 0.9 }]}
      >
        <LinearGradient colors={greenGradient} style={styles.circle}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="add" size={32} color={colors.background} />
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  ring: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.background,
    boxShadow: glow.button,
  },
  circle: { flex: 1, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});