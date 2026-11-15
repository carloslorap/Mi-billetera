import { Button } from '@/core/components/Button';
import { colors } from '@/core/theme/colors';
import { fmtSoles, normalizeBarcode } from '@/features/shopping/barcode';
import { useShopping, useShoppingActions } from '@/features/shopping/hooks';
import { ProductSheet } from '@/features/shopping/ProductSheet';
import type { TripItem } from '@/features/shopping/types';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Sheet =
  | null
  | { mode: 'new'; barcode: string }
  | { mode: 'manual' }
  | { mode: 'edit'; item: TripItem }
  | { mode: 'budget' };

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const last = useRef({ code: '', t: 0 });
  const busy = useRef(false);

  const { data, error } = useShopping();
  const a = useShoppingActions(data?.trip.id);

  const [debug, setDebug] = useState('');

  const total = data?.totalCents ?? 0;
  const budget = data?.trip.budgetCents ?? null;
  const ratio = budget ? total / budget : 0;
  const totalColor =
    budget && ratio > 1 ? colors.danger : budget && ratio >= 0.9 ? colors.warning : colors.success;

  const onScanned = async ({ data: raw, type }: { data: string; type: string }) => {
    setDebug(`${type} · ${raw} · ${raw.length} díg.`);
    if (sheet || busy.current || !data) return;
    const code = normalizeBarcode(raw);
    if (!code) return;
    const t = Date.now();
    if (last.current.code === code && t - last.current.t < 2500) return;
    last.current = { code, t };

    busy.current = true;
    try {
      const found = await a.scan.mutateAsync(code);
      if (!found) setSheet({ mode: 'new', barcode: code });
    } catch (e) {
      setDebug(`ERROR: ${String(e)}`);
    } finally {
      busy.current = false;
    }
  };

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="camera-outline" size={48} color={colors.primary} />
        <Text style={styles.h1}>Necesito la cámara</Text>
        <Text style={styles.muted}>Solo para leer códigos de barras. No se guarda ninguna foto.</Text>
        <Button title="Permitir cámara" onPress={requestPermission} fullWidth={false} />
        <Button title="Volver" variant="ghost" size="md" fullWidth={false} onPress={() => router.back()} />
      </View>
    );
  }

  const sheetProps = (() => {
    if (!sheet) return null;
    if (sheet.mode === 'new') return { title: 'Producto nuevo', subtitle: `Código ${sheet.barcode}` };
    if (sheet.mode === 'manual')
      return { title: 'Agregar sin código', subtitle: 'Fruta, pan, algo sin etiqueta' };
    if (sheet.mode === 'edit') return { title: 'Editar producto', subtitle: undefined };
    return { title: 'Presupuesto', subtitle: 'Déjalo vacío para quitarlo' };
  })();

  return (
    <View style={styles.root}>
      <View style={styles.cameraBox}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          // barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
          onBarcodeScanned={onScanned}
        />
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.round} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.round} onPress={() => setTorch((v) => !v)}>
            <Ionicons
              name={torch ? 'flash' : 'flash-outline'}
              size={20}
              color={torch ? colors.warning : colors.textPrimary}
            />
          </Pressable>
        </View>
        <View pointerEvents="none" style={styles.frame} />
      </View>

      <View style={styles.panel}>
        <Text style={{ color: colors.warning, textAlign: 'center', fontSize: 12 }}>{debug}</Text>
        {error ? (
          <Text style={{ color: colors.danger, textAlign: 'center', fontSize: 12 }}>
            {String(error)}
          </Text>
        ) : null}
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.label}>
              Total estimado · {data?.units ?? 0} {data?.units === 1 ? 'producto' : 'productos'}
            </Text>
            <Text style={[styles.total, { color: totalColor }]}>{fmtSoles(total)}</Text>
          </View>
          <Pressable style={styles.budgetChip} onPress={() => setSheet({ mode: 'budget' })}>
            <Ionicons name="wallet-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.budgetText}>
              {budget ? `Presupuesto ${fmtSoles(budget)}` : 'Poner presupuesto'}
            </Text>
          </Pressable>
        </View>

        {budget ? (
          <Text style={[styles.label, { color: totalColor }]}>
            {total > budget
              ? `Te pasas por ${fmtSoles(total - budget)}`
              : `Te quedan ${fmtSoles(budget - total)}`}
          </Text>
        ) : null}

        <FlatList
          data={data?.items ?? []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.muted, styles.empty]}>Apunta la cámara a un código de barras.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Pressable style={styles.flex1} onPress={() => setSheet({ mode: 'edit', item })}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.label}>
                  {fmtSoles(item.unitPriceCents)} × {item.quantity} ={' '}
                  {fmtSoles(item.unitPriceCents * item.quantity)}
                </Text>
              </Pressable>
              <Pressable
                style={styles.qty}
                onPress={() => a.quantity.mutate({ id: item.id, delta: -1 })}
              >
                <Ionicons
                  name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                  size={18}
                  color={item.quantity === 1 ? colors.danger : colors.textPrimary}
                />
              </Pressable>
              <Text style={styles.qtyNum}>{item.quantity}</Text>
              <Pressable
                style={styles.qty}
                onPress={() => a.quantity.mutate({ id: item.id, delta: 1 })}
              >
                <Ionicons name="add" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>
          )}
        />

        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
          <Button
            title="Sin código"
            iconLeft="add"
            variant="secondary"
            size="md"
            style={styles.flex1}
            onPress={() => setSheet({ mode: 'manual' })}
          />
          <Button
            title="Terminar"
            iconLeft="checkmark"
            size="md"
            style={styles.flex1}
            disabled={!data?.items.length}
            loading={a.finish.isPending}
            onPress={async () => {
              await a.finish.mutateAsync();
              router.back();
            }}
          />
        </View>
      </View>

      <ProductSheet
        visible={!!sheet}
        title={sheetProps?.title ?? ''}
        subtitle={sheetProps?.subtitle}
        askName={sheet?.mode !== 'budget'}
        priceLabel={sheet?.mode === 'budget' ? 'Presupuesto (S/)' : 'Precio (S/)'}
        allowEmptyPrice={sheet?.mode === 'budget'}
        initialName={sheet?.mode === 'edit' ? sheet.item.name : ''}
        initialPrice={
          sheet?.mode === 'edit'
            ? (sheet.item.unitPriceCents / 100).toFixed(2)
            : sheet?.mode === 'budget' && budget
              ? (budget / 100).toFixed(2)
              : ''
        }
        onClose={() => setSheet(null)}
        onSave={(name, cents) => {
          const s = sheet;
          setSheet(null);
          if (!s) return;
          if (s.mode === 'budget') return void a.budget.mutate(cents);
          if (cents === null) return;
          if (s.mode === 'new') a.addNew.mutate({ barcode: s.barcode, name: name || null, cents });
          if (s.mode === 'manual') a.addManual.mutate({ name: name || 'Sin nombre', cents });
          if (s.mode === 'edit') a.edit.mutate({ item: s.item, name: name || s.item.name, cents });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  flex1: { flex: 1 },

  cameraBox: { height: '34%', backgroundColor: '#000', overflow: 'hidden' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 14,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  round: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  frame: {
    position: 'absolute', alignSelf: 'center', top: '30%', width: '70%', height: '40%',
    borderWidth: 2, borderColor: colors.primary, borderRadius: 16, opacity: 0.8,
  },

  panel: {
    flex: 1, marginTop: -20, backgroundColor: colors.background,
    paddingHorizontal: 16, paddingTop: 16,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 34, fontWeight: '800' },
  label: { color: colors.textSecondary, fontSize: 13 },
  muted: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
  h1: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  empty: { marginTop: 20 },

  budgetChip: {
    flexDirection: 'row', gap: 6, alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border,
  },
  budgetText: { color: colors.textSecondary, fontSize: 12 },

  list: { gap: 8, paddingVertical: 10 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 16,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  itemName: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  qty: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.background,
  },
  qtyNum: { color: colors.textPrimary, fontWeight: '700', minWidth: 18, textAlign: 'center' },

  footer: { flexDirection: 'row', gap: 10, paddingTop: 6 },
});