import { migrateDb } from '@/core/db/migrations';
import { AuthGate } from '@/core/security/AuthGate';
import { requestSync } from '@/core/sync';
import { SyncRunner } from '@/core/sync/SyncRunner';
import { colors } from '@/core/theme/colors';
import { LoginGate } from '@/features/auth/LoginGate';
import { SessionProvider } from '@/features/auth/SessionProvider';
import { AddCardProvider } from '@/features/cards/AddCardProvider';
import { NewLoanProvider } from '@/features/loans/NewLoanProvider';
import { RegisterPaymentProvider } from '@/features/loans/RegisterPaymentProvider';
import { NewTransactionProvider } from '@/features/transactions/NewTransactionProvider';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

const queryClient = new QueryClient({
  mutationCache: new MutationCache({ onSuccess: () => requestSync() }),
});
export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="billetera.db" onInit={migrateDb}>
      <SessionProvider>
        <LoginGate>
          <AuthGate>
            <QueryClientProvider client={queryClient}>
              <SyncRunner />
              <AddCardProvider>
                <NewTransactionProvider>
                  <NewLoanProvider>
                    <RegisterPaymentProvider>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          contentStyle: { backgroundColor: colors.background },
                        }}
                      />
                    </RegisterPaymentProvider>
                  </NewLoanProvider>
                </NewTransactionProvider>
              </AddCardProvider>
            </QueryClientProvider>
          </AuthGate>
        </LoginGate>
      </SessionProvider>
    </SQLiteProvider>
  );
}