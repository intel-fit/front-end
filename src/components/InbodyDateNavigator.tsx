import React, {useState, useMemo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons as Icon} from '@expo/vector-icons';

interface InbodyDateNavigatorProps {
  dates?: string[];
  onChange?: (date: Date) => void;
}

const InbodyDateNavigator: React.FC<InbodyDateNavigatorProps> = ({
  dates = [],
  onChange,
}) => {
  const sorted = useMemo(
    () => dates.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime()),
    [dates],
  );
  const [idx, setIdx] = useState(sorted.length > 0 ? sorted.length - 1 : 0);

  const hasPrev = idx > 0;
  const hasNext = idx < sorted.length - 1;

  const goPrev = () => {
    if (hasPrev) {
      const newIdx = idx - 1;
      setIdx(newIdx);
      onChange?.(sorted[newIdx]);
    }
  };

  const goNext = () => {
    if (hasNext) {
      const newIdx = idx + 1;
      setIdx(newIdx);
      onChange?.(sorted[newIdx]);
    }
  };

  const fmt = (d: Date) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
      d.getDate(),
    ).padStart(2, '0')}`;

  const current = sorted[idx];

  if (!current) {
    return null;
  }

  return (
    <View style={styles.nav}>
      <TouchableOpacity
        onPress={goPrev}
        disabled={!hasPrev}
        style={[styles.btn, !hasPrev && styles.btnDisabled]}>
        <Icon name="chevron-back" size={20} color="#ffffff" />
      </TouchableOpacity>
      <Text style={styles.date}>{fmt(current)}</Text>
      <TouchableOpacity
        onPress={goNext}
        disabled={!hasNext}
        style={[styles.btn, !hasNext && styles.btnDisabled]}>
        <Icon name="chevron-forward" size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222222',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 0,
  },
  btn: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  btnDisabled: {
    opacity: 0.3,
  },
  date: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    minWidth: 140,
    textAlign: 'center',
  },
});

export default InbodyDateNavigator;

