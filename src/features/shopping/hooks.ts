import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import {
    addManualItem, addProductToTrip, changeQuantity, editItem,
    findProductByBarcode,
    finishTrip,
    getOrCreateOpenTrip, getTripItems, saveProduct, setBudget,
} from './repository';
import type { TripItem } from './types';

const KEY = ['shopping', 'trip'];

export function useShopping() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const trip = await getOrCreateOpenTrip(db);
      const items = await getTripItems(db, trip.id);
      const totalCents = items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0);
      const units = items.reduce((s, i) => s + i.quantity, 0);
      return { trip, items, totalCents, units };
    },
  });
}

export function useShoppingActions(tripId: string | undefined) {
  const db = useSQLiteContext();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: KEY });

  const need = () => {
    if (!tripId) throw new Error('Compra no lista');
    return tripId;
  };

  const scan = useMutation({
    // Devuelve true si el código ya estaba en el catálogo y se agregó solo.
    mutationFn: async (barcode: string) => {
      const p = await findProductByBarcode(db, barcode);
      if (!p) return false;
      await addProductToTrip(db, need(), p);
      return true;
    },
    onSuccess: refresh,
  });

  const addNew = useMutation({
    mutationFn: async (v: { barcode: string; name: string | null; cents: number }) => {
      const p = await saveProduct(db, v.barcode, v.name, v.cents);
      await addProductToTrip(db, need(), p);
    },
    onSuccess: refresh,
  });

  const addManual = useMutation({
    mutationFn: (v: { name: string; cents: number }) => addManualItem(db, need(), v.name, v.cents),
    onSuccess: refresh,
  });

  const quantity = useMutation({
    mutationFn: (v: { id: string; delta: number }) => changeQuantity(db, v.id, v.delta),
    onSuccess: refresh,
  });

  const edit = useMutation({
    mutationFn: (v: { item: TripItem; name: string; cents: number }) =>
      editItem(db, v.item, v.name, v.cents),
    onSuccess: refresh,
  });

  const budget = useMutation({
    mutationFn: (cents: number | null) => setBudget(db, need(), cents),
    onSuccess: refresh,
  });

  const finish = useMutation({
    mutationFn: () => finishTrip(db, need()),
    onSuccess: refresh,
  });

  return { scan, addNew, addManual, quantity, edit, budget, finish };
}