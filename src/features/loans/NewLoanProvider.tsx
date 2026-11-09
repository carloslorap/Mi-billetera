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
import { NewLoanForm } from './components/NewLoanForm';

type NewLoanContextValue = { open: (personId?: string) => void };

const NewLoanContext = createContext<NewLoanContextValue | null>(null);

export function NewLoanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ visible: boolean; personId: string | null }>({
    visible: false,
    personId: null,
  });

  // Si se usa como onPress={open}, el primer argumento sería el evento: solo se acepta un texto
  const open = useCallback((personId?: unknown) => {
    setState({ visible: true, personId: typeof personId === 'string' ? personId : null });
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <NewLoanContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {state.visible ? (
          <BottomSheet onClose={() => setState({ visible: false, personId: null })}>
            {(close) => <NewLoanForm close={close} initialPersonId={state.personId} />}
          </BottomSheet>
        ) : null}
      </View>
    </NewLoanContext.Provider>
  );
}

export function useNewLoan() {
  const ctx = useContext(NewLoanContext);
  if (!ctx) throw new Error('useNewLoan debe usarse dentro de NewLoanProvider');
  return ctx;
}