import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../theme/colors';
import FoodDirectInputModal from '../components/FoodDirectInputModal';

interface Food {
  id: number;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  weight?: number;
  recordCount?: string;
}

const FoodSearchScreen = ({navigation}: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDirectInputModalOpen, setIsDirectInputModalOpen] = useState(false);

  const foods: Food[] = [
    {
      id: 1,
      name: '엽기 떡복이',
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
      recordCount: '1000+',
    },
    {
      id: 2,
      name: '엽기 떡복이',
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
      recordCount: '100미만',
    },
    {
      id: 3,
      name: '엽기 떡복이',
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
    },
    {
      id: 4,
      name: '엽기 떡복이',
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
    },
    {
      id: 5,
      name: '엽기 떡복이',
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
    },
    {
      id: 6,
      name: '엽기 떡복이',
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
    },
  ];

  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleFoodSelect = (food: Food) => {
    navigation.navigate('MealAdd', {selectedFood: food});
  };

  const handleDirectInput = () => {
    setIsDirectInputModalOpen(true);
  };

  const handleSaveFood = (foodData: any) => {
    // 음식 저장 후 MealAdd 페이지로 돌아가면서 데이터 전달
    navigation.navigate('MealAdd', {selectedFood: foodData});
  };

  const renderFoodItem = ({item}: {item: Food}) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => handleFoodSelect(item)}>
      <View style={styles.foodItemHeader}>
        <View style={styles.foodNameGroup}>
          <Text style={styles.foodName}>{item.name}</Text>
          {item.recordCount && (
            <Text style={styles.recordCount}>{item.recordCount} 기록</Text>
          )}
        </View>
        <Text style={styles.foodCalories}>{item.calories}kcal</Text>
      </View>
      <View style={styles.foodNutrition}>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionLabel}>탄</Text>
          <Text style={styles.nutritionValue}>{item.carbs}g</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionLabel}>단</Text>
          <Text style={styles.nutritionValue}>{item.protein}g</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={styles.nutritionLabel}>지</Text>
          <Text style={styles.nutritionValue}>{item.fat}g</Text>
        </View>
        {item.weight && (
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>중량</Text>
            <Text style={styles.nutritionValue}>{item.weight}g</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>식단 검색하기</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MealAdd')} style={styles.checkButton}>
          <Icon name="checkmark" size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* 검색 입력 */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="음식 이름을 입력해주세요"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
          />
          <Icon
            name="search"
            size={26}
            color="#ffffff"
            style={styles.searchIcon}
          />
        </View>
      </View>

      {/* 직접 입력하기 버튼 */}
      <View style={styles.directInputSection}>
        <TouchableOpacity
          style={styles.directInputButton}
          onPress={handleDirectInput}>
          <Text style={styles.directInputButtonText}>직접 음식 입력하기</Text>
        </TouchableOpacity>
      </View>

      {/* 음식 검색 결과 */}
      <FlatList
        data={filteredFoods}
        renderItem={renderFoodItem}
        keyExtractor={item => item.id.toString()}
        style={styles.foodList}
        contentContainerStyle={styles.foodListContent}
      />

      {/* 직접 음식 입력 모달 */}
      <FoodDirectInputModal
        isOpen={isDirectInputModalOpen}
        onClose={() => setIsDirectInputModalOpen(false)}
        onSave={handleSaveFood}
      />
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  checkButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#ffffff',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#393a38',
    borderWidth: 0,
    borderRadius: 10,
    paddingVertical: 10,
    paddingLeft: 18,
    paddingRight: 50,
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  searchIcon: {
    position: 'absolute',
    right: 15,
  },
  directInputSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  directInputButton: {
    width: '100%',
    backgroundColor: '#393a38',
    borderWidth: 0,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  directInputButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  foodList: {
    flex: 1,
  },
  foodListContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  foodItem: {
    backgroundColor: '#393a38',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  foodNameGroup: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  recordCount: {
    fontSize: 8,
    fontWeight: '400',
    color: '#ffffff',
    lineHeight: 22,
  },
  foodCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
    marginLeft: 10,
  },
  foodNutrition: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-start',
  },
  nutritionItem: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  nutritionValue: {
    fontSize: 10,
    fontWeight: '400',
    color: '#ffffff',
  },
});

export default FoodSearchScreen;

