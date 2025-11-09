import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../../theme/colors';
import FoodDirectInputModal from '../../components/modals/FoodDirectInputModal';
import {mealAPI} from '../../services';
import type {SearchFoodResponse} from '../../types';

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
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 검색어 변경 시 API 호출 (디바운싱)
  useEffect(() => {
    // 이전 타이머 취소
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 검색어가 비어있으면 결과 초기화
    if (searchQuery.trim() === '') {
      setFoods([]);
      return;
    }

    // 500ms 후에 API 호출 (디바운싱)
    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await mealAPI.searchFood(searchQuery.trim());
        // API 응답을 Food 타입으로 변환
        const convertedFoods: Food[] = results.map((item: SearchFoodResponse) => ({
          id: item.id,
          name: item.name,
          calories: item.calories,
          carbs: item.carbs,
          protein: item.protein,
          fat: item.fat,
          weight: item.weight || undefined,
        }));
        setFoods(convertedFoods);
      } catch (error: any) {
        console.error('음식 검색 오류:', error);
        Alert.alert('오류', '음식 검색에 실패했습니다. 다시 시도해주세요.');
        setFoods([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    // cleanup 함수
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

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
          <Text style={styles.foodName} numberOfLines={2}>{item.name}</Text>
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
        <Text style={styles.headerTitle}>음식 검색하기</Text>
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
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>검색 중...</Text>
        </View>
      ) : (
        <FlatList
          data={foods}
          renderItem={renderFoodItem}
          keyExtractor={item => item.id.toString()}
          style={styles.foodList}
          contentContainerStyle={styles.foodListContent}
          ListEmptyComponent={
            searchQuery.trim() !== '' ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
              </View>
            ) : null
          }
        />
      )}

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
    gap: 12,
  },
  foodNameGroup: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flexShrink: 1,
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
    flexShrink: 0,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '400',
    color: '#ffffff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default FoodSearchScreen;

