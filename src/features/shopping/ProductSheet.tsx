import { Button } from '@/core/components/Button';
import { colors } from '@/core/theme/colors';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { parsePriceToCents } from './barcode';

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  askName?: boolean;          // false = solo precio (presupuesto)
  priceLabel?: string;
  initialName?: string;
  initialPrice?: string;
  allowEmptyPrice?: boolean;  // presupuesto: vacío = quitar
  onSave: (name: string, cents: number | null) => void;
  onClose: () => void;
};

export function ProductSheet({
  visible, title, subtitle, askName = true, priceLabel = 'Precio (S/)',
  initialName = '', initialPrice = '', allowEmptyPrice = false, onSave, onClose,
}: Props) {
  const [name, setName] = useState(initialName);
  const [price, setPrice] = useState(initialPrice);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setPrice(initialPrice);
    }
  }, [visible, initialName, initialPrice]);

  const cents = parsePriceToCents(price);
  const emptyOk = allowEmptyPrice && price.trim() === '';
  const canSave = emptyOk || (cents !== null && price.trim() !== '');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrap}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}

          {askName && (
            <TextInput
              style={styles.input}
              placeholder="Nombre (opcional)"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder={priceLabel}
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
            autoFocus
          />

          <View style={styles.row}>
            <Button
              title="Cancelar"
              variant="secondary"
              size="md"
              style={styles.flex1}
              onPress={onClose}
            />
            <Button
              title="Guardar"
              iconLeft="checkmark"
              size="md"
              style={styles.flex1}
              disabled={!canSave}
              onPress={() => onSave(name.trim(), emptyOk ? null : cents)}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: {
    backgroundColor: colors.surface,
    padding: 20,
    gap: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    // borderColor: colors.border,
  },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  sub: { color: colors.textSecondary, fontSize: 13 },
  input: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    // borderColor: colors.border,
  },
  row: { flexDirection: 'row', gap: 10, marginTop: 4 },
  flex1: { flex: 1 },
});