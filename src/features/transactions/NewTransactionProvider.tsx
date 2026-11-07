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
import { NewTransactionForm } from './components/NewTransactionForm';


type NewTransactionContextValue = { open: () => void };

const NewTransactionContext = createContext<NewTransactionContextValue | null>(null);

export function NewTransactionProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => setVisible(true), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <NewTransactionContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {visible ? (
          <BottomSheet onClose={() => setVisible(false)}>
            {(close) => <NewTransactionForm close={close} />}
          </BottomSheet>
        ) : null}
      </View>
    </NewTransactionContext.Provider>
  );
}

export function useNewTransaction() {
  const ctx = useContext(NewTransactionContext);
  if (!ctx) {
    throw new Error('useNewTransaction debe usarse dentro de NewTransactionProvider');
  }
  return ctx;
}