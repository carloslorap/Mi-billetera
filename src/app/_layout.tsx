import { migrateDb } from '@/core/db/migrations';
import { AuthGate } from '@/core/security/AuthGate';
import { colors } from '@/core/theme/colors';
import { AddCardProvider } from '@/features/cards/AddCardProvider';
import { NewTransactionProvider } from '@/features/transactions/NewTransactionProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="billetera.db" onInit={migrateDb}>
      <AuthGate>
        <QueryClientProvider client={queryClient}>
          <AddCardProvider>
          <NewTransactionProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
              }}
            />
          </NewTransactionProvider>
          </AddCardProvider>
        </QueryClientProvider>
      </AuthGate>
    </SQLiteProvider>
  );
}