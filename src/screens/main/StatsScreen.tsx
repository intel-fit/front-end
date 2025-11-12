import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ExerciseScreen from '../exercise/ExerciseScreen';
import DietScreen from '../diet/DietScreen';

const StatsScreen = ({navigation, route}: any) => {
  const [activeTab, setActiveTab] = useState(0);
  const [goalData, setGoalData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userIdLoaded, setUserIdLoaded] = useState(false);

  const storageKey = React.useMemo(
    () => (userId ? `workoutGoals:${userId}` : 'workoutGoals'),
    [userId],
  );

  useEffect(() => {
    (async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        setUserId(storedUserId);
      } finally {
        setUserIdLoaded(true);
      }
    })();
  }, []);

  const loadGoalData = useCallback(async () => {
    try {
      if (!userIdLoaded) return;
      const saved = await AsyncStorage.getItem(storageKey);
      if (saved) {
        setGoalData(JSON.parse(saved));
      } else {
        setGoalData(null);
      }
    } catch (error) {
      console.log('Failed to load goal data', error);
    }
  }, [storageKey, userIdLoaded]);

  useEffect(() => {
    loadGoalData();
  }, [loadGoalData]);

  useEffect(() => {
    if (route?.params?.exerciseGoal !== undefined) {
      const newGoal = route.params.exerciseGoal ?? null;
      setGoalData(newGoal);
      if (newGoal) {
        AsyncStorage.setItem(storageKey, JSON.stringify(newGoal)).catch(() => {});
      } else {
        AsyncStorage.removeItem(storageKey).catch(() => {});
      }
      navigation.setParams({exerciseGoal: undefined});
    }
  }, [route?.params?.exerciseGoal, navigation, storageKey]);

  // route params에서 activeTab 받아서 설정
  useEffect(() => {
    if (route?.params?.activeTab !== undefined) {
      setActiveTab(route.params.activeTab);
      navigation.setParams({activeTab: undefined});
    }
  }, [route?.params?.activeTab, navigation]);

  const tabs = ['운동기록', '식단기록'];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <ExerciseScreen navigation={navigation} />;
      case 1:
        return <DietScreen navigation={navigation} route={route} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>기록하기</Text>
      </View>

      {/* 탭 버튼 */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.tab, activeTab === index && styles.tabActive]}
            onPress={() => setActiveTab(index)}>
            <Text
              style={[
                styles.tabText,
                activeTab === index && styles.tabTextActive,
              ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 탭 콘텐츠 */}
      <View style={styles.tabContent}>{renderTabContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 8,
    gap: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  tabTextActive: {
    color: '#e3ff7c',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
  },
});

export default StatsScreen;

