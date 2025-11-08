import React, {useState, useEffect} from 'react';
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

const StatsScreen = ({navigation}: any) => {
  const [activeTab, setActiveTab] = useState(0);
  const [goalData, setGoalData] = useState<any>(null);

  useEffect(() => {
    loadGoalData();
  }, []);

  const loadGoalData = async () => {
    try {
      const saved = await AsyncStorage.getItem('workoutGoals');
      if (saved) {
        setGoalData(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Failed to load goal data', error);
    }
  };

  const tabs = ['운동기록', '식단기록'];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <ExerciseScreen navigation={navigation} />;
      case 1:
        return <DietScreen navigation={navigation} />;
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
    marginTop: 12,
    marginBottom: 16,
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

