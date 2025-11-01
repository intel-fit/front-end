import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../theme/colors';

const MealDetailScreen = ({navigation, route}: any) => {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const mealData = {
    day: '1일차',
    name: '아침 - 오트밀',
    type: '아침식사',
    calories: '350kcal',
    prepTime: '10분',
    difficulty: '쉬움',
    ingredients: [
      {name: '오트밀', amount: '50g'},
      {name: '바나나', amount: '1개'},
      {name: '아몬드', amount: '10알'},
      {name: '우유', amount: '200ml'},
      {name: '꿀', amount: '1큰술'},
    ],
    instructions: [
      '물 또는 우유를 끓입니다',
      '오트밀을 넣고 3-5분간 끓입니다',
      '바나나를 썰어 넣습니다',
      '아몬드와 꿀을 토핑으로 올립니다',
    ],
    nutrition: {
      protein: '12g',
      carbs: '55g',
      fat: '8g',
      fiber: '6g',
    },
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    Alert.alert(
      '',
      isBookmarked ? '북마크에서 제거되었습니다' : '북마크에 추가되었습니다',
    );
  };

  const handleStartCooking = () => {
    Alert.alert('요리 시작', '요리 시작 기능 (추후 구현)');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{mealData.day} 추천 식단</Text>
        <TouchableOpacity onPress={handleBookmark}>
          <Icon
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 식단 이름 */}
        <View style={styles.mealNameSection}>
          <Text style={styles.mealName}>{mealData.name}</Text>
          <Text style={styles.mealType}>{mealData.type}</Text>
        </View>

        {/* 식단 이미지 플레이스홀더 */}
        <View style={styles.mealImageContainer}>
          <View style={styles.mealImagePlaceholder}>
            <Icon name="image-outline" size={60} color={colors.textLight} />
          </View>
        </View>

        {/* 기본 정보 */}
        <View style={styles.mealInfoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>칼로리</Text>
            <Text style={styles.infoValue}>{mealData.calories}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>조리시간</Text>
            <Text style={styles.infoValue}>{mealData.prepTime}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>난이도</Text>
            <Text style={styles.infoValue}>{mealData.difficulty}</Text>
          </View>
        </View>

        {/* 영양성분 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>영양성분</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>단백질</Text>
              <Text style={styles.nutritionValue}>
                {mealData.nutrition.protein}
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>탄수화물</Text>
              <Text style={styles.nutritionValue}>
                {mealData.nutrition.carbs}
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>지방</Text>
              <Text style={styles.nutritionValue}>
                {mealData.nutrition.fat}
              </Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>식이섬유</Text>
              <Text style={styles.nutritionValue}>
                {mealData.nutrition.fiber}
              </Text>
            </View>
          </View>
        </View>

        {/* 재료 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>재료</Text>
          {mealData.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientItem}>
              <Text style={styles.ingredientName}>{ingredient.name}</Text>
              <Text style={styles.ingredientAmount}>{ingredient.amount}</Text>
            </View>
          ))}
        </View>

        {/* 조리 방법 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>조리 방법</Text>
          {mealData.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>{index + 1}</Text>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>

        {/* 요리 시작 버튼 */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartCooking}>
          <Text style={styles.startButtonText}>요리 시작하기</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  mealNameSection: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    marginBottom: 12,
  },
  mealName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  mealType: {
    fontSize: 16,
    color: colors.textLight,
  },
  mealImageContainer: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    marginBottom: 12,
  },
  mealImagePlaceholder: {
    height: 200,
    backgroundColor: colors.grayLight,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.cardBackground,
    padding: 20,
    marginBottom: 12,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  nutritionLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  ingredientName: {
    fontSize: 16,
    color: colors.text,
  },
  ingredientAmount: {
    fontSize: 16,
    color: colors.textLight,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 20,
    backgroundColor: colors.primary,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: colors.primary,
    margin: 20,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MealDetailScreen;

