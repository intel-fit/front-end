// src/screens/main/HomeWidgetEditScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WIDGET_NAMES: Record<string, string> = {
  recommendationCard: '식단/운동 추천 카드',
  notificationCard: 'AI코멘트 카드',
  weekCalendar: '주간 진행률',
  exerciseRoutineCard: '오늘의 운동',
  exerciseStatsCard: '운동 통계',
  bodyStatsCard: '체중/골격근량/체지방량',
  mealRecommendationCard: '식단 추천',
  calorieCard: '칼로리 섹션',
};

const DEFAULT_ORDER = [
  'recommendationCard',
  'notificationCard',
  'weekCalendar',
  'exerciseRoutineCard',
  'exerciseStatsCard',
  'bodyStatsCard',
  'mealRecommendationCard',
  'calorieCard',
];

const HomeWidgetEditScreen = ({ navigation, route }: any) => {
  const [widgetOrder, setWidgetOrder] = useState<string[]>(DEFAULT_ORDER);

  useEffect(() => {
    loadWidgetOrder();
  }, []);

  const loadWidgetOrder = async () => {
    try {
      const savedOrder = await AsyncStorage.getItem('homeWidgetOrder');
      if (savedOrder) {
        const parsed = JSON.parse(savedOrder);
        setWidgetOrder(parsed);
      }
    } catch (error) {
      console.error('위젯 순서 불러오기 실패:', error);
    }
  };

  const saveWidgetOrder = async () => {
    try {
      await AsyncStorage.setItem('homeWidgetOrder', JSON.stringify(widgetOrder));
      Alert.alert('저장 완료', '위젯 순서가 저장되었습니다.', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('위젯 순서 저장 실패:', error);
      Alert.alert('오류', '저장에 실패했습니다.');
    }
  };

  const moveWidget = (fromIndex: number, toIndex: number) => {
    const newOrder = [...widgetOrder];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setWidgetOrder(newOrder);
  };

  const renderWidgetItem = (widgetId: string, index: number) => {
    return (
      <View key={widgetId} style={styles.widgetItem}>
        <View style={styles.widgetItemContent}>
          <Ionicons name="reorder-three-outline" size={24} color="#ffffff" />
          <Text style={styles.widgetItemText}>{WIDGET_NAMES[widgetId] || widgetId}</Text>
        </View>
        <View style={styles.widgetItemActions}>
          {index > 0 && (
            <TouchableOpacity
              style={styles.moveButton}
              onPress={() => moveWidget(index, index - 1)}
            >
              <Ionicons name="chevron-up" size={20} color="#e3ff7c" />
            </TouchableOpacity>
          )}
          {index < widgetOrder.length - 1 && (
            <TouchableOpacity
              style={styles.moveButton}
              onPress={() => moveWidget(index, index + 1)}
            >
              <Ionicons name="chevron-down" size={20} color="#e3ff7c" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>홈 위젯 순서 편집</Text>
        <View style={styles.backButton} />
      </View>
      <View style={styles.divider} />

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          위젯의 순서를 변경하려면 위/아래 화살표를 눌러주세요.
        </Text>

        {widgetOrder.map((widgetId, index) => renderWidgetItem(widgetId, index))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveWidgetOrder}
        >
          <Text style={styles.saveButtonText}>저장하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 20,
    textAlign: 'center',
  },
  widgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#393a38',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  widgetItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  widgetItemText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 12,
    fontWeight: '500',
  },
  widgetItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  moveButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  saveButton: {
    backgroundColor: '#e3ff7c',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});

export default HomeWidgetEditScreen;

