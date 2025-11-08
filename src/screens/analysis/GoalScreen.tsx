import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../../theme/colors';

const GoalScreen = ({navigation}: any) => {
  const [goals, setGoals] = useState({
    frequency: 3,
    duration: '30분 이상',
    type: '유산소',
    calories: 1500,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [userIdLoaded, setUserIdLoaded] = useState(false);

  const storageKey = React.useMemo(
    () => (userId ? `workoutGoals:${userId}` : 'workoutGoals'),
    [userId],
  );

  React.useEffect(() => {
    (async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        setUserId(storedUserId);
      } finally {
        setUserIdLoaded(true);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!userIdLoaded) return;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(storageKey);
        if (saved) {
          setGoals(JSON.parse(saved));
        }
      } catch (error) {
        console.error('목표 불러오기 실패:', error);
      }
    })();
  }, [userIdLoaded, storageKey]);

  const handleSave = async () => {
    try {
      if (!userIdLoaded) {
        console.warn('사용자 정보를 불러오는 중입니다.');
        return;
      }
      await AsyncStorage.setItem(storageKey, JSON.stringify(goals));
      console.log('목표 저장:', goals);
      navigation.navigate('Stats');
    } catch (error) {
      console.error('목표 저장 실패:', error);
    }
  };

  const adjustFrequency = (change: number) => {
    setGoals(prev => ({
      ...prev,
      frequency: Math.max(1, Math.min(7, prev.frequency + change)),
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>운동 목표 설정</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={false}>
          <Icon name="checkmark" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주간 운동 횟수</Text>
          <View style={styles.frequencyControl}>
            <Text style={styles.frequencyValue}>주 {goals.frequency}회</Text>
            <View style={styles.adjustButtons}>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => adjustFrequency(-1)}>
                <Text style={styles.adjustBtnText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => adjustFrequency(1)}>
                <Text style={styles.adjustBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1회 운동 시간</Text>
          <View style={styles.timeContainer}>
            <TextInput
              style={styles.input}
              value={goals.duration}
              onChangeText={text => setGoals({...goals, duration: text})}
              placeholder="예: 30분 이상"
              placeholderTextColor="#666666"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>운동 종류</Text>
          <View style={styles.typeOptions}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                goals.type === '전체' && styles.typeBtnActive,
              ]}
              onPress={() => setGoals({...goals, type: '전체'})}>
              <Text
                style={[
                  styles.typeBtnText,
                  goals.type === '전체' && styles.typeBtnTextActive,
                ]}>
                전체
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                goals.type === '유산소' && styles.typeBtnActive,
              ]}
              onPress={() => setGoals({...goals, type: '유산소'})}>
              <Text
                style={[
                  styles.typeBtnText,
                  goals.type === '유산소' && styles.typeBtnTextActive,
                ]}>
                유산소
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                goals.type === '무산소' && styles.typeBtnActive,
              ]}
              onPress={() => setGoals({...goals, type: '무산소'})}>
              <Text
                style={[
                  styles.typeBtnText,
                  goals.type === '무산소' && styles.typeBtnTextActive,
                ]}>
                무산소
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주간 칼로리 소모 목표</Text>
          <View style={styles.calorieContainer}>
            <TextInput
              style={styles.input}
              value={String(goals.calories)}
              onChangeText={text =>
                setGoals({...goals, calories: parseInt(text) || 0})
              }
              keyboardType="number-pad"
              placeholder="예: 1500"
              placeholderTextColor="#666666"
            />
            <Text style={styles.unit}>kcal</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#252525',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 80,
    marginTop: 8,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 12,
  },
  frequencyControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  frequencyValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  adjustButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  adjustBtn: {
    backgroundColor: '#404040',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  timeContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  calorieContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#404040',
  },
  typeBtnActive: {
    backgroundColor: '#e3ff7c',
    borderColor: '#e3ff7c',
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  typeBtnTextActive: {
    color: '#000000',
  },
  unit: {
    fontSize: 16,
    color: '#ffffff',
  },
});

export default GoalScreen;

