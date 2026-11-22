import { colors } from '@/core/theme/colors';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { LoginScreen } from './LoginScreen';
import { useSession } from './SessionProvider';

export function LoginGate({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  if (!session) return <LoginScreen />;
  return <>{children}</>;
}