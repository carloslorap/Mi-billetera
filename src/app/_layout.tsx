import { migrateDb } from '@/core/db/migrations';
import { colors } from '@/core/theme/colors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="billetera.db" onInit={migrateDb}>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </QueryClientProvider>
    </SQLiteProvider>
  );
}