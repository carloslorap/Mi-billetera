import { formatSoles } from '@/core/utils/money';
import { Alert } from 'react-native';
import { useDeleteTransaction } from './hooks';
import type { Transaction } from './types';

export function useConfirmDeleteTransaction() {
  const remove = useDeleteTransaction();

  return (item: Transaction) => {
    if (item.kind !== 'expense' && item.kind !== 'income') {
      Alert.alert(
        'Movimiento de un préstamo',
        'Este movimiento nació de un préstamo o una deuda. Para quitarlo, abre a la persona en Préstamos o Deudas y elimina el préstamo o anula el pago.'
      );
      return;
    }

    const title = item.description || item.category || 'Movimiento';
    Alert.alert(
      'Eliminar movimiento',
      `${title} · ${formatSoles(item.amount_cents)}\n\nEl saldo de ${item.card_name} se recalcula.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => remove.mutate(item.id) },
      ]
    );
  };
}