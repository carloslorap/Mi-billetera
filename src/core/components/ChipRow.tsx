import type { ReactNode } from 'react';
import { ScrollView, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  children: ReactNode;
  /** Margen horizontal del contenedor padre: la fila llega hasta el borde de la pantalla. */
  bleed?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
};

export function ChipRow({ children, bleed = 0, gap = 8, style }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={[{ flexGrow: 0, marginHorizontal: -bleed }, style]}
      contentContainerStyle={{ paddingHorizontal: bleed, gap }}
    >
      {children}
    </ScrollView>
  );
}