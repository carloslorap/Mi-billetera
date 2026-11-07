import { colors } from '@/core/theme/colors';
import { spacing } from '@/core/theme/layout';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
    Animated,
    BackHandler,
    Easing,
    Keyboard,
    KeyboardAvoidingView,
    PanResponder,
    Pressable,
    StyleSheet,
    View,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CloseFn = (after?: () => void) => void;

type Props = {
  onClose: () => void; // se llama cuando termina la animación de salida
  children: (close: CloseFn) => ReactNode;
};

export function BottomSheet({ onClose, children }: Props) {
  const { height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [progress] = useState(() => new Animated.Value(0)); // 0 = cerrado, 1 = abierto
  const [drag] = useState(() => new Animated.Value(0)); // arrastre hacia abajo
  const closing = useRef(false);
  const onCloseRef = useRef(onClose);
  const closeRef = useRef<CloseFn>(() => {});

  const close = useCallback<CloseFn>(
    (after) => {
      if (closing.current) return;
      closing.current = true;
      Keyboard.dismiss();
      Animated.timing(progress, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        onCloseRef.current();
        after?.();
      });
    },
    [progress]
  );

  useEffect(() => {
    onCloseRef.current = onClose;
    closeRef.current = close;
  });

  // Animación de entrada
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  // El botón "atrás" de Android cierra el sheet
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeRef.current();
      return true;
    });
    return () => sub.remove();
  }, []);

  // Arrastrar el asa hacia abajo para cerrar
  const [pan] = useState(() => {
    const springBack = () =>
      Animated.spring(drag, { toValue: 0, friction: 8, useNativeDriver: true }).start();
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) drag.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 110 || g.vy > 0.9) closeRef.current();
        else springBack();
      },
      onPanResponderTerminate: springBack,
    });
  });

  const translateY = Animated.add(
    progress.interpolate({ inputRange: [0, 1], outputRange: [screenH, 0] }),
    drag
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => close()}
          accessibilityLabel="Cerrar"
        />
      </Animated.View>

      <KeyboardAvoidingView behavior="padding" style={styles.avoid}>
        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight: screenH * 0.92,
              paddingBottom: insets.bottom + spacing.md,
              transform: [{ translateY }],
            },
          ]}
        >
          <View {...pan.panHandlers} style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
          {children(close)}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.6)' },
  avoid: { flex: 1, justifyContent: 'flex-end', pointerEvents: 'box-none' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  handleArea: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.md },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
});