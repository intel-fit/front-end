import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../theme/colors';

const HomeScreen = ({navigation}: any) => {
  const handleCalendarClick = () => {
    navigation.navigate('Calendar');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>홈</Text>
      </View>
      <View style={styles.divider} />
      <ScrollView style={styles.content}>
        {/* 인사말 섹션 */}
        <View style={styles.greetingSection}>
          <View style={styles.profileGroup}>
            <View style={styles.profileImage}>
              <Text style={styles.profilePlaceholder}>👤</Text>
            </View>
            <Text style={styles.greetingText}>님 어서오세요😊</Text>
          </View>
        </View>

        {/* 운동 진행률 섹션 */}
        <TouchableOpacity
          style={styles.exerciseProgressSection}
          onPress={handleCalendarClick}>
          <View style={styles.progressGrid}>
            {[1, 2, 3, 4, 5, 6, 7].map((day, index) => (
              <View key={day} style={styles.progressItem}>
                <View
                  style={[
                    styles.progressNumber,
                    index === 3 && styles.progressNumberToday,
                  ]}>
                  <Text
                    style={[
                      styles.progressNumberText,
                      index === 3 && styles.progressNumberTodayText,
                    ]}>
                    15
                  </Text>
                </View>
                <Text style={styles.progressCalories}>388k</Text>
                <Text style={styles.progressPercentage}>97%</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* 칼로리 섹션 */}
        <View style={styles.calorieSection}>
          <View style={styles.calorieHeader}>
            <View style={styles.calorieLeft}>
              <Text style={styles.calorieCurrent}>384</Text>
              <Text style={styles.calorieGoal}> / 1,157kcal</Text>
            </View>
            <Text style={styles.caloriePercentage}>30%</Text>
          </View>
          <View style={styles.calorieProgressBar}>
            <View style={[styles.calorieProgressFill, {width: '30%'}]} />
          </View>
        </View>

        {/* 식단 추천 섹션 */}
        <View style={styles.dietRecommendationSection}>
          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>
              운동 잘 마무리 하셨나요?
            </Text>
            <Text style={styles.recommendationSubtitle}>저녁 식단으로</Text>
            <View style={styles.foodRecommendations}>
              <View style={styles.foodItem}>
                <Text style={styles.foodItemText}>닭가슴살 300g</Text>
              </View>
              <View style={styles.foodItem}>
                <Text style={styles.foodItemText}>단백질 쉐이크</Text>
              </View>
              <View style={styles.foodItem}>
                <Text style={styles.foodItemText}>구운 계란 2개</Text>
              </View>
            </View>
            <Text style={styles.recommendationQuestion}>어떤가요?</Text>
          </View>
        </View>

        {/* 추가 메뉴 섹션 */}
        <View style={styles.additionalMenuSection}>
          <View style={styles.menuGrid}>
            <View style={[styles.menuItem, styles.weightItem]}>
              <Text style={styles.menuTitle}>체중</Text>
              <Text style={styles.menuValue}>51 / 58.6kg</Text>
            </View>
            <View style={[styles.menuItem, styles.nutritionItem]}>
              <View style={styles.nutritionContent}>
                <Text style={[styles.nutritionLine, {fontWeight: '700'}]}>탄 | 52g</Text>
                <Text style={styles.nutritionLine}>단 | 120g</Text>
                <Text style={styles.nutritionLine}>지 | 9g</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.menuItem, styles.plusItem]}>
              <View style={styles.plusButton}>
                <Text style={styles.plusIcon}>+</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greetingSection: {
    marginBottom: 20,
  },
  profileGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    fontSize: 24,
    backgroundColor: '#555',
    textAlign: 'center',
    lineHeight: 50,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  exerciseProgressSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 14,
    marginBottom: 20,
    height: 109,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 79,
    gap: 0,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  progressNumber: {
    height: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressNumberToday: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e3ff7c',
  },
  progressNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#738700',
    lineHeight: 19.36,
  },
  progressNumberTodayText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 1,
  },
  progressCalories: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    height: 15,
    lineHeight: 14.52,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    height: 15,
    lineHeight: 14.52,
  },
  calorieSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  calorieLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  calorieCurrent: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  calorieGoal: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.text,
  },
  caloriePercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  calorieProgressBar: {
    height: 30,
    backgroundColor: '#555',
    borderRadius: 10,
    overflow: 'hidden',
  },
  calorieProgressFill: {
    height: '100%',
    backgroundColor: '#e3ff7c',
    borderRadius: 10,
  },
  dietRecommendationSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  recommendationContent: {
    maxWidth: 249,
  },
  recommendationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e3ff7c',
    marginBottom: 5,
  },
  recommendationSubtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  foodRecommendations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  foodItem: {
    backgroundColor: '#e3ff7c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  foodItemText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  recommendationQuestion: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  additionalMenuSection: {
    marginBottom: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  menuItem: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 15,
  },
  weightItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 5,
    lineHeight: 18,
    textAlign: 'center',
  },
  menuValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 18,
    textAlign: 'center',
  },
  nutritionItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionContent: {
    gap: 5,
  },
  nutritionLine: {
    fontSize: 15,
    color: colors.text,
  },
  plusItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#777',
  },
  plusIcon: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '400',
  },
});

export default HomeScreen;

