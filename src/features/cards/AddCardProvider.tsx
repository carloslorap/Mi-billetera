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
import { AddCardForm } from './components/AddCardForm';

type AddCardContextValue = { open: () => void };

const AddCardContext = createContext<AddCardContextValue | null>(null);

export function AddCardProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const open = useCallback(() => setVisible(true), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <AddCardContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {visible ? (
          <BottomSheet onClose={() => setVisible(false)}>
            {(close) => <AddCardForm close={close} />}
          </BottomSheet>
        ) : null}
      </View>
    </AddCardContext.Provider>
  );
}

export function useAddCard() {
  const ctx = useContext(AddCardContext);
  if (!ctx) throw new Error('useAddCard debe usarse dentro de AddCardProvider');
  return ctx;
}