import { CardView } from '@/core/components/CardView';
import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/layout';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

export type DeckCard = {
  id: string;
  name: string;
  bank?: string | null;
  balanceCents: number;
  last4?: string | null;
};

type Props = {
  cards: DeckCard[];
  width: number;
  onChange?: (index: number) => void;
};

// Cuánto se achican y bajan las tarjetas según su profundidad en el mazo
const SCALE = [1, 0.94, 0.88];
const OFFSET_Y = [0, 16, 32];
const MAX_DEPTH = 2;
const RATIO = 1.586; // proporción de una tarjeta real
const SWIPE_DISTANCE = 80;
const SWIPE_VELOCITY = 0.6;

const scaleAt = (d: number) => SCALE[Math.min(d, MAX_DEPTH)];
const offsetAt = (d: number) => OFFSET_Y[Math.min(d, MAX_DEPTH)];

export function CardDeck({ cards, width, onChange }: Props) {
  const n = cards.length;
  const [front, setFront] = useState(0);
  const [sendingBack, setSendingBack] = useState(false);

  const [x] = useState(() => new Animated.Value(0)); // arrastre horizontal
  const [shift] = useState(() => new Animated.Value(0)); // las de atrás suben (0 a 1)
  const [back] = useState(() => new Animated.Value(0)); // la de adelante se va atrás (0 a 1)

  const busy = useRef(false);
  const pendingReset = useRef(false);
  const nRef = useRef(n);
  const widthRef = useRef(width);
  const frontRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const advanceRef = useRef<(dir: 1 | -1) => void>(() => {});

  const current = n > 0 ? Math.min(front, n - 1) : 0;

  const advance = (dir: 1 | -1) => {
    if (busy.current || nRef.current < 2) return;
    busy.current = true;
    const w = widthRef.current;

    // Las tarjetas de atrás suben mientras la de adelante sale hacia el costado
    Animated.timing(shift, { toValue: 1, duration: 300, useNativeDriver: false }).start();

    Animated.timing(x, {
      toValue: dir * w * 0.7,
      duration: 170,
      useNativeDriver: false,
    }).start(() => {
      // Ahora la tarjeta pasa por detrás y vuelve al fondo del mazo
      setSendingBack(true);
      Animated.parallel([
        Animated.timing(x, { toValue: 0, duration: 240, useNativeDriver: false }),
        Animated.timing(back, { toValue: 1, duration: 240, useNativeDriver: false }),
      ]).start(() => {
        const next = (frontRef.current + 1) % nRef.current;
        pendingReset.current = true;
        setSendingBack(false);
        setFront(next);
        onChangeRef.current?.(next);
      });
    });
  };

  // Mantiene al día los valores que lee el gesto
  useEffect(() => {
    nRef.current = n;
    widthRef.current = width;
    frontRef.current = current;
    onChangeRef.current = onChange;
    advanceRef.current = advance;
  });

  // Tras cambiar el orden, deja las animaciones en cero antes de pintar
  useLayoutEffect(() => {
    if (!pendingReset.current) return;
    pendingReset.current = false;
    x.setValue(0);
    shift.setValue(0);
    back.setValue(0);
    busy.current = false;
  }, [front, x, shift, back]);

  const [pan] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        nRef.current > 1 &&
        !busy.current &&
        Math.abs(g.dx) > 8 &&
        Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: Animated.event([null, { dx: x }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        const far =
          Math.abs(g.dx) > SWIPE_DISTANCE ||
          (Math.abs(g.vx) > SWIPE_VELOCITY && Math.abs(g.dx) > 20);
        if (far) advanceRef.current(g.dx >= 0 ? 1 : -1);
        else Animated.spring(x, { toValue: 0, friction: 7, useNativeDriver: false }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(x, { toValue: 0, friction: 7, useNativeDriver: false }).start();
      },
    })
  );

  if (n === 0) return null;

  const cardHeight = width / RATIO;
  const backDepth = Math.min(n - 1, MAX_DEPTH);
  const height = cardHeight + offsetAt(backDepth) + spacing.sm;

  // Al arrastrar, las de atrás ya empiezan a subir un poco
  const dragProgress = x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: [0.5, 0, 0.5],
    extrapolate: 'clamp',
  });
  const stackProgress = Animated.add(shift, dragProgress);
  const rotate = x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ width }}>
      <View style={{ width, height }}>
        {cards.map((card, i) => {
          const d = (i - current + n) % n; // 0 = la de adelante
          const isFront = d === 0;

          const transform = isFront
            ? [
                { translateX: x },
                {
                  translateY: back.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, offsetAt(backDepth)],
                  }),
                },
                {
                  scale: back.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, scaleAt(backDepth)],
                  }),
                },
                { rotate },
              ]
            : [
                {
                  translateY: stackProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [offsetAt(d), offsetAt(d - 1)],
                    extrapolate: 'clamp',
                  }),
                },
                {
                  scale: stackProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [scaleAt(d), scaleAt(d - 1)],
                    extrapolate: 'clamp',
                  }),
                },
              ];

          // Con más de 3 tarjetas, solo se ven las 3 de arriba
          const opacity = isFront
            ? n > MAX_DEPTH + 1
              ? back.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
              : 1
            : d > MAX_DEPTH + 1
              ? 0
              : d === MAX_DEPTH + 1
                ? stackProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                    extrapolate: 'clamp',
                  })
                : 1;

          const zIndex = isFront ? (sendingBack ? 0 : 20) : Math.max(1, 10 - d);

          return (
            <Animated.View
              key={card.id}
              {...(isFront ? pan.panHandlers : {})}
              style={[
                styles.cardSlot,
                { width, zIndex, opacity, transform, pointerEvents: isFront ? 'auto' : 'none' },
              ]}
            >
              <CardView
                name={card.name}
                bank={card.bank}
                balanceCents={card.balanceCents}
                last4={card.last4}
              />
            </Animated.View>
          );
        })}
      </View>

      {n > 1 ? (
        <View style={styles.dots}>
          {cards.map((c, i) => (
            <View key={c.id} style={[styles.dot, i === current && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cardSlot: { position: 'absolute', top: 0, left: 0 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 18, backgroundColor: colors.primary },
});