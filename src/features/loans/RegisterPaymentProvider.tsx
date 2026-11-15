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
import type { LoanDirection } from './direction';

type PaymentSheetContextValue = { open: (personId: string, direction: LoanDirection) => void };

const PaymentSheetContext = createContext<PaymentSheetContextValue | null>(null);

export function RegisterPaymentProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<{ personId: string; direction: LoanDirection } | null>(null);
  const open = useCallback(
    (personId: string, direction: LoanDirection) => setTarget({ personId, direction }),
    []
  );
  const value = useMemo(() => ({ open }), [open]);

  return (
    <PaymentSheetContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {target ? (
          <BottomSheet onClose={() => setTarget(null)}>
            {(close) => (
              <RegisterPaymentForm
                close={close}
                personId={target.personId}
                direction={target.direction}
              />
            )}
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