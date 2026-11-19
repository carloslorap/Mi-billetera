import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { createTransaction, deleteTransaction, getCardTransactions, getRecentTransactions } from './repository';
import type { NewTransaction } from './types';

export function useRecentTransactions(limit = 20) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['transactions', limit],
    queryFn: () => getRecentTransactions(db, limit),
  });
}

export function useCreateTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTransaction) => createTransaction(db, input),
    onSuccess: () => {
      // el saldo de las tarjetas se recalcula con cada movimiento
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useCardTransactions(cardId: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['transactions', 'card', cardId],
    queryFn: () => getCardTransactions(db, cardId),
  });
}


export function useDeleteTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(db, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}