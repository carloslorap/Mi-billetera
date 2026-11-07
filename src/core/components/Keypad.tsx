import { colors } from '@/core/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { onKey: (key: string) => void }; // '0'-'9', '.', 'back' o 'clear'

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'back'],
];

export function Keypad({ onKey }: Props) {
  return (
    <View style={styles.grid}>
      {ROWS.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((k) => (
            <View key={k} style={styles.cell}>
              <Pressable
                onPress={() => onKey(k)}
                onLongPress={k === 'back' ? () => onKey('clear') : undefined}
                accessibilityRole="button"
                accessibilityLabel={k === 'back' ? 'Borrar' : k === '.' ? 'Punto decimal' : k}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
              >
                {k === 'back' ? (
                  <Ionicons name="backspace-outline" size={24} color={colors.textPrimary} />
                ) : (
                  <Text style={styles.keyText}>{k}</Text>
                )}
              </Pressable>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 6 },
  row: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center' },
  key: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { backgroundColor: 'rgba(149,255,119,0.18)' },
  keyText: { color: colors.textPrimary, fontSize: 24, fontWeight: '600' },
});