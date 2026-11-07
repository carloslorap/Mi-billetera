import { colors } from '@/core/theme/colors';
import { fontSize, radius, spacing } from '@/core/theme/layout';
import { formatSoles } from '@/core/utils/money';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import type { Transaction } from '../types';

// Un tono por tipo de movimiento: color, flecha de fondo y signo
const TONES = {
    expense: {
        color: colors.danger,
        arrow: 'arrow-up',
        tint: 'rgba(255,107,107,0.14)',
        watermark: 'rgba(255,107,107,0.07)',
        sign: '-',
        fallback: 'Gasto',
    },
    income: {
        color: colors.success,
        arrow: 'arrow-down',
        tint: 'rgba(149,255,119,0.12)',
        watermark: 'rgba(149,255,119,0.07)',
        sign: '+',
        fallback: 'Ingreso',
    },
} as const;

const ARROW_SIZE = 65;

export function TransactionItem({ item }: { item: Transaction }) {
    const tone = TONES[item.type];
    const title = item.description || item.category || tone.fallback;
    const date = new Date(item.occurred_at).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
    });

    return (
        <View style={styles.wrap}>
            <LinearGradient
                colors={[colors.surface, tone.tint]}
                start={{ x: 0.3, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.row}
            >
                <View style={styles.watermarkBox} pointerEvents="none">
                    <Ionicons
                        name={tone.arrow}
                        size={ARROW_SIZE}
                        color={tone.watermark}
                        style={styles.watermarkIcon}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                    <Text style={styles.sub} numberOfLines={1}>
                        {item.card_name} · {date}
                    </Text>
                </View>
                <Text style={[styles.amount, { color: tone.color }]}>
                    {tone.sign} {formatSoles(item.amount_cents)}
                </Text>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { marginHorizontal: spacing.lg },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.md,
        overflow: 'hidden', // la flecha se recorta en los bordes de la tarjeta
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderTopColor: 'rgba(255,255,255,0.10)',
    },
    watermarkBox: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    watermarkIcon: {
        lineHeight: ARROW_SIZE,
        includeFontPadding: false,
    },
    title: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '600' },
    sub: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
    amount: { fontSize: fontSize.lg, fontWeight: '700' },
});