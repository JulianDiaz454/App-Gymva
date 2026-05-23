import { View } from 'react-native';

import { colors } from '@/theme/tokens';

export function Divider({ soft }: { soft?: boolean }) {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: soft ? colors.borderSoft : colors.border,
      }}
    />
  );
}
