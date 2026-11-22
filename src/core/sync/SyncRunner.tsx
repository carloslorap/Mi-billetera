import { useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../supabase/client';
import { registerSync, requestSync } from './engine';

export function SyncRunner() {
  const db = useSQLiteContext();
  const qc = useQueryClient();

  useEffect(() => {
    registerSync(db, () => qc.invalidateQueries());
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') requestSync(300);
    });
    const app = AppState.addEventListener('change', (s) => {
      if (s === 'active') requestSync(500);
    });
    requestSync(500);
    return () => { data.subscription.unsubscribe(); app.remove(); };
  }, [db, qc]);

  return null;
}