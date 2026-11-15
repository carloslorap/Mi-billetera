import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import type { LoanDirection } from './direction';
import {
  createLoan,
  getPeople,
  getPersonDebts,
  getPersonDetail,
  registerPayment,
} from './repository';
import type { NewLoan, NewPayment } from './types';

export function usePeople() {
  const db = useSQLiteContext();
  const query = useQuery({ queryKey: ['people'], queryFn: () => getPeople(db) });
  if (query.error) console.error('[usePeople] falló:', query.error);
  return query;
}

export function usePersonDebts(direction: LoanDirection) {
  const db = useSQLiteContext();
  const query = useQuery({
    queryKey: ['person-debts', direction],
    queryFn: () => getPersonDebts(db, direction),
  });
  if (query.error) console.error('[usePersonDebts] falló:', query.error);
  return query;
}

export function usePersonDetail(personId: string | null, direction: LoanDirection) {
  const db = useSQLiteContext();
  const query = useQuery({
    queryKey: ['person-detail', personId, direction],
    queryFn: () => getPersonDetail(db, personId as string, direction),
    enabled: personId !== null,
  });
  if (query.error) console.error('[usePersonDetail] falló:', query.error);
  return query;
}

// Al guardar o pagar se refrescan las dos direcciones, porque comparten personas y tarjetas
function useInvalidateMoney() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['people'] });
    queryClient.invalidateQueries({ queryKey: ['person-debts'] });
    queryClient.invalidateQueries({ queryKey: ['person-detail'] });
    queryClient.invalidateQueries({ queryKey: ['cards'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };
}

export function useCreateLoan() {
  const db = useSQLiteContext();
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (input: NewLoan) => createLoan(db, input),
    onSuccess: invalidate,
  });
}

export function useRegisterPayment() {
  const db = useSQLiteContext();
  const invalidate = useInvalidateMoney();
  return useMutation({
    mutationFn: (input: NewPayment) => registerPayment(db, input),
    onSuccess: invalidate,
  });
}