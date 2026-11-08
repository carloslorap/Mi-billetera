import { AddActionButton } from '@/core/components/AddActionButton';
import { AddActionMenu } from '@/core/components/AddActionMenu';
import { colors } from '@/core/theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(active: IconName, inactive: IconName) {
  return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={22} color={color as string} />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const barHeight = 64 + insets.bottom;

  // El botón "atrás" de Android cierra el menú en vez de salir de la app
  useEffect(() => {
    if (!menuOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setMenuOpen(false);
      return true;
    });
    return () => sub.remove();
  }, [menuOpen]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenListeners={{ tabPress: () => setMenuOpen(false) }}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: { fontSize: 11 },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.07)',
            height: barHeight,
            paddingBottom: insets.bottom,
            paddingTop: 6,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Inicio', tabBarIcon: tabIcon('home', 'home-outline') }}
        />
        <Tabs.Screen
          name="debts"
          options={{ title: 'Deudas', tabBarIcon: tabIcon('receipt', 'receipt-outline') }}
        />
        {/* Hueco vacío: el botón central flota encima */}
        <Tabs.Screen
          name="add"
          options={{
            title: '',
            tabBarButton: () => <View style={{ flex: 1 }} pointerEvents="none" />,
          }}
        />
        <Tabs.Screen
          name="loans"
          options={{
            title: 'Préstamos',
            tabBarIcon: tabIcon('swap-horizontal', 'swap-horizontal-outline'),
          }}
        />
        <Tabs.Screen
          name="summary"
          options={{ title: 'Resumen', tabBarIcon: tabIcon('bar-chart', 'bar-chart-outline') }}
        />
      </Tabs>

      {menuOpen ? <AddActionMenu barHeight={barHeight} onClose={() => setMenuOpen(false)} /> : null}

      <AddActionButton
        open={menuOpen}
        bottom={insets.bottom + 24}
        onPress={() => setMenuOpen((v) => !v)}
      />
    </View>
  );
}