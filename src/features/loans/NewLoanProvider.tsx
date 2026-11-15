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
import type { LoanDirection } from './direction';

type NewLoanContextValue = { open: (direction: LoanDirection, personId?: string) => void };

type State = { visible: boolean; direction: LoanDirection; personId: string | null };

const NewLoanContext = createContext<NewLoanContextValue | null>(null);

export function NewLoanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ visible: false, direction: 'lent', personId: null });

  const open = useCallback((direction: LoanDirection, personId?: string) => {
    setState({
      visible: true,
      direction: direction === 'borrowed' ? 'borrowed' : 'lent',
      personId: typeof personId === 'string' ? personId : null,
    });
  }, []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <NewLoanContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {state.visible ? (
          <BottomSheet onClose={() => setState((s) => ({ ...s, visible: false }))}>
            {(close) => (
              <NewLoanForm
                close={close}
                initialPersonId={state.personId}
                direction={state.direction}
              />
            )}
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