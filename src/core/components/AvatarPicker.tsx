import { AVATAR_KEYS } from '@/core/avatars';
import { Pressable, StyleSheet } from 'react-native';

import { ChipRow } from '@/core/components/ChipRow';
import { colors } from '@/core/theme/colors';
import { Avatar } from './Avatar';

type Props = {
  value: string | null;
  onChange: (key: string | null) => void;
  bleed?: number;
};

export function AvatarPicker({ value, onChange, bleed = 0 }: Props) {
  return (
    <ChipRow bleed={bleed} gap={10}>
      {AVATAR_KEYS.map((key) => (
        <Pressable
          key={key}
          onPress={() => onChange(value === key ? null : key)}
          style={[styles.ring, value === key && styles.ringActive]}
        >
          <Avatar name="" avatar={key} size={52} />
        </Pressable>
      ))}
    </ChipRow>
  );
}

const styles = StyleSheet.create({
  ring: { padding: 3, borderRadius: 999, borderWidth: 2, borderColor: 'transparent' },
  ringActive: { borderColor: colors.primary },
});