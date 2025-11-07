import React, {useState, useMemo, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Ionicons as Icon} from '@expo/vector-icons';

interface InbodyDateNavigatorProps {
  dates?: string[];
  onChange?: (date: Date) => void;
  selectedDate?: Date; // 외부에서 선택된 날짜
}

const InbodyDateNavigator: React.FC<InbodyDateNavigatorProps> = ({
  dates = [],
  onChange,
  selectedDate,
}) => {
  const sorted = useMemo(
    () => dates
      .map(d => {
        // 점(.) 형식이면 하이픈(-)으로 변환하여 Date 객체 생성
        const dateStr = d.includes(".") ? d.replace(/\./g, "-") : d;
        return new Date(dateStr);
      })
      .filter(d => !isNaN(d.getTime())) // 유효한 날짜만 필터링
      .sort((a, b) => a.getTime() - b.getTime()),
    [dates],
  );
  const [idx, setIdx] = useState(sorted.length > 0 ? sorted.length - 1 : 0);

  // selectedDate가 변경되면 해당 날짜에 맞는 인덱스 찾기
  useEffect(() => {
    if (selectedDate && sorted.length > 0) {
      // 같은 날짜인지 확인하는 헬퍼 함수
      const isSameDay = (date1: Date, date2: Date): boolean => {
        return (
          date1.getFullYear() === date2.getFullYear() &&
          date1.getMonth() === date2.getMonth() &&
          date1.getDate() === date2.getDate()
        );
      };

      const foundIdx = sorted.findIndex(d => isSameDay(d, selectedDate));
      
      if (foundIdx !== -1) {
        setIdx(foundIdx);
      } else if (sorted.length > 0) {
        // 선택된 날짜가 목록에 없으면 가장 가까운 날짜 찾기
        const selectedTime = selectedDate.getTime();
        const closestIdx = sorted.reduce((closest, current, currentIdx) => {
          const currentDiff = Math.abs(current.getTime() - selectedTime);
          const closestDiff = Math.abs(sorted[closest].getTime() - selectedTime);
          return currentDiff < closestDiff ? currentIdx : closest;
        }, 0);
        setIdx(closestIdx);
      }
    }
  }, [selectedDate, sorted]);

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

