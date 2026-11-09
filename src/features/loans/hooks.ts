import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { createLoan, getPeople, getPersonDebts, getPersonDetail, registerPayment } from './repository';
import type { NewLoan, NewPayment } from './types';

export function usePeople() {
  const db = useSQLiteContext();
  const query = useQuery({ queryKey: ['people'], queryFn: () => getPeople(db) });
  if (query.error) console.error('[usePeople] falló:', query.error);
  return query;
}

export function usePersonDebts() {
  const db = useSQLiteContext();
  const query = useQuery({ queryKey: ['person-debts'], queryFn: () => getPersonDebts(db) });
  if (query.error) console.error('[usePersonDebts] falló:', query.error);
  return query;
}

export function useCreateLoan() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewLoan) => createLoan(db, input),
    onSuccess: () => {
      // el préstamo cambia personas, deudas y, si salió de una tarjeta, su saldo y movimientos
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['person-debts'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['person-detail'] });
    },
  });
}


export function usePersonDetail(personId: string | null) {
  const db = useSQLiteContext();
  const query = useQuery({
    queryKey: ['person-detail', personId],
    queryFn: () => getPersonDetail(db, personId as string),
    enabled: personId !== null,
  });
  if (query.error) console.error('[usePersonDetail] falló:', query.error);
  return query;
}

export function useRegisterPayment() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewPayment) => registerPayment(db, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person-detail'] });
      queryClient.invalidateQueries({ queryKey: ['person-debts'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}