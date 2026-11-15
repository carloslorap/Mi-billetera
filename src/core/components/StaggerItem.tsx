import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  index: number;
  children: ReactNode;
  /** Retraso entre un elemento y el siguiente (ms). */
  step?: number;
  /** Solo se animan los primeros N; el resto aparece directo. */
  maxAnimated?: number;
  style?: StyleProp<ViewStyle>;
};

export function StaggerItem({ index, children, step = 60, maxAnimated = 10, style }: Props) {
  const animate = index < maxAnimated;
  const progress = useRef(new Animated.Value(animate ? 0 : 1)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay: index * step,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}