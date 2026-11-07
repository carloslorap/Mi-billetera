import { migrateDb } from '@/core/db/migrations';
import { AuthGate } from '@/core/security/AuthGate';
import { colors } from '@/core/theme/colors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="billetera.db" onInit={migrateDb}>
      <AuthGate>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            <Stack.Screen name="expense/new" options={{ presentation: 'modal' }} />
          </Stack>
        </QueryClientProvider>
      </AuthGate>
    </SQLiteProvider>
  );
}