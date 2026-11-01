import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { createCard, getCards } from './repository';
import type { NewCard } from './types';

export function useCards() {
  const db = useSQLiteContext();
  return useQuery({ queryKey: ['cards'], queryFn: () => getCards(db) });
}

export function useCreateCard() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCard) => createCard(db, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards'] }),
  });
}