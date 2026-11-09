import { BottomSheet } from '@/core/components/BottomSheet';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import { RegisterPaymentForm } from './components/RegisterPaymentForm';


type PaymentSheetContextValue = { open: (personId: string) => void };

const PaymentSheetContext = createContext<PaymentSheetContextValue | null>(null);

export function RegisterPaymentProvider({ children }: { children: ReactNode }) {
  const [personId, setPersonId] = useState<string | null>(null);
  const open = useCallback((id: string) => setPersonId(id), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <PaymentSheetContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {personId ? (
          <BottomSheet onClose={() => setPersonId(null)}>
            {(close) => <RegisterPaymentForm close={close} personId={personId} />}
          </BottomSheet>
        ) : null}
      </View>
    </PaymentSheetContext.Provider>
  );
}

export function usePaymentSheet() {
  const ctx = useContext(PaymentSheetContext);
  if (!ctx) throw new Error('usePaymentSheet debe usarse dentro de RegisterPaymentProvider');
  return ctx;
}