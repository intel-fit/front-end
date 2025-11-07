import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';


import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {colors} from '../../theme/colors';
import FoodAddOptionsModal from '../../components/modals/FoodAddOptionsModal';
import {mealAPI} from '../../services';
import {useDate} from '../../contexts/DateContext';
import type {AddMealRequest, AddMealFoodRequest} from '../../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

interface Food {
  id: number;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  weight: number;
}

const MealAddScreen = ({navigation, route}: any) => {
  const {selectedDate} = useDate();
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'>('DINNER');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isFoodOptionsModalOpen, setIsFoodOptionsModalOpen] = useState(false);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  // 날짜 선택 핸들러
const onChangeDate = (event: any, date?: Date) => {
  if (Platform.OS === 'android') {
    setShowDatePicker(false);
    // 취소한 경우
    if (event.type === 'dismissed') {
      return;
    }
  }
  if (date) {
    setSelectedDateTime(prev => {
      const newDate = new Date(date);
      newDate.setHours(prev.getHours());
      newDate.setMinutes(prev.getMinutes());
      return newDate;
    });
    // Android에서는 날짜 선택 후 시간 선택기 표시
    if (Platform.OS === 'android' && event.type !== 'dismissed') {
      setTimeout(() => setShowTimePicker(true), 100);
    }
  }
  // iOS에서는 날짜 선택 후 시간 선택기로 이동
  if (Platform.OS === 'ios') {
    if (event.type === 'set') {
      setShowDatePicker(false);
      setShowTimePicker(true);
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  }
};

// 시간 선택 핸들러
const onChangeTime = (event: any, time?: Date) => {
  if (Platform.OS === 'android') {
    setShowTimePicker(false);
    // 취소한 경우
    if (event.type === 'dismissed') {
      return;
    }
  }
  if (time && event.type !== 'dismissed') {
    setSelectedDateTime(prev => {
      const newDate = new Date(prev);
      newDate.setHours(time.getHours());
      newDate.setMinutes(time.getMinutes());
      return newDate;
    });
  }
  // iOS 처리
  if (Platform.OS === 'ios') {
    if (event.type === 'set' || event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  }
};

  // 날짜/시간 선택 버튼 핸들러
  const handleDateTimePress = () => {
    if (Platform.OS === 'ios') {
      // iOS는 날짜부터 시작
      setShowDatePicker(true);
    } else {
      // Android는 날짜부터 시작
      setShowDatePicker(true);
    }
  };

  // route에서 전달받은 음식 추가
  useEffect(() => {
    if (route?.params?.selectedFood) {
      const newFood = route.params.selectedFood;
      setFoods(prev => [...prev, newFood]);
      // route params 초기화
      navigation.setParams({selectedFood: undefined});
    }
  }, [route?.params?.selectedFood]);

  // 날짜 형식 변환 (Date -> yyyy-MM-dd)
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 한글 mealType을 영어로 변환
  const getMealTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      '아침': 'BREAKFAST',
      '점심': 'LUNCH',
      '저녁': 'DINNER',
      '야식': 'SNACK',
    };
    return typeMap[type] || 'DINNER';
  };

  // mealType 한글 표시
  const getMealTypeDisplay = (type: string): string => {
    const typeMap: Record<string, string> = {
      'BREAKFAST': '아침',
      'LUNCH': '점심',
      'DINNER': '저녁',
      'SNACK': '야식',
    };
    return typeMap[type] || '저녁';
  };

  // 선택된 날짜/시간 표시 포맷
  const formatSelectedDateTime = (): string => {
    const now = new Date();
    const selected = selectedDateTime;
    
    // 오늘인지 확인
    const isToday = 
      selected.getFullYear() === now.getFullYear() &&
      selected.getMonth() === now.getMonth() &&
      selected.getDate() === now.getDate();
    
    const hours = selected.getHours();
    const minutes = String(selected.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    
    if (isToday) {
      return `today, ${displayHours}:${minutes} ${ampm}`;
    } else {
      const month = selected.getMonth() + 1;
      const day = selected.getDate();
      return `${month}/${day}, ${displayHours}:${minutes} ${ampm}`;
    }
  };

  const totalCalories = foods.reduce((sum, food) => sum + food.calories, 0);
  const targetCalories = 1157;
  const totalCarbs = foods.reduce((sum, food) => sum + food.carbs, 0);
  const totalProtein = foods.reduce((sum, food) => sum + food.protein, 0);
  const totalFat = foods.reduce((sum, food) => sum + food.fat, 0);

  const handlePhotoUpload = () => {
    Alert.alert('사진 추가', '사진을 선택하세요', [
      {
        text: '카메라',
        onPress: async () => {
          const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
          if (permissionResult.granted === false) {
            Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });
          if (!result.canceled && result.assets && result.assets[0]) {
            setPhotos([...photos, result.assets[0].uri]);
          }
        },
      },
      {
        text: '갤러리',
        onPress: async () => {
          const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (permissionResult.granted === false) {
            Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });
          if (!result.canceled && result.assets && result.assets[0]) {
            setPhotos([...photos, result.assets[0].uri]);
          }
        },
      },
      {text: '취소', style: 'cancel'},
    ]);
  };

  // Food를 API 형식으로 변환
  const convertFoodToAPIFormat = (food: Food): AddMealFoodRequest => {
    return {
      foodName: food.name,
      servingSize: food.weight || 100, // weight를 servingSize로 사용
      calories: food.calories,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat,
      sodium: 0, // 기본값
      cholesterol: 0, // 기본값
      sugar: 0, // 기본값
      fiber: 0, // 기본값
      imageUrl: photos[0] || undefined, // 첫 번째 사진 URL
      aiConfidenceScore: undefined,
    };
  };

  const handleSave = async () => {
    if (foods.length === 0) {
      Alert.alert('알림', '음식을 추가해주세요.');
      return;
    }

    setLoading(true);
    try {
      const dateToUse = selectedDateTime; // selectedDate 대신 selectedDateTime 사용
      const mealData: AddMealRequest = {
        mealDate: formatDateToString(dateToUse),
        mealType: mealType,
        foods: foods.map(convertFoodToAPIFormat),
        memo: mealName || undefined,
      };

      await mealAPI.addMeal(mealData);
      Alert.alert('성공', '식사가 추가되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      console.error('식사 추가 실패:', error);
      let errorMessage = '식사를 추가하는데 실패했습니다.';
      
      if (error.status === 409) {
        errorMessage = '해당 날짜/타입의 식사가 이미 존재합니다.';
      } else if (error.status === 400) {
        errorMessage = '잘못된 요청 데이터입니다.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = () => {
    setIsFoodOptionsModalOpen(true);
  };

  const handlePhotoOption = () => {
    handlePhotoUpload();
  };

  const handleSearchOption = () => {
    navigation.navigate('FoodSearch');
  };

  // 식사 타입 선택 핸들러
  const handleMealTypePress = () => {
    Alert.alert(
      '식사 타입 선택',
      '식사 타입을 선택해주세요.',
      [
        {
          text: '아침',
          onPress: () => setMealType('BREAKFAST'),
        },
        {
          text: '점심',
          onPress: () => setMealType('LUNCH'),
        },
        {
          text: '저녁',
          onPress: () => setMealType('DINNER'),
        },
        {
          text: '야식',
          onPress: () => setMealType('SNACK'),
        },
        {
          text: '취소',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>식단 추가하기</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Icon name="checkmark" size={28} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 식단 이름 입력 */}
        <View style={styles.nameInputSection}>
          <TextInput
            style={styles.nameInput}
            placeholder="식단 이름을 작성해주세요."
            value={mealName}
            onChangeText={setMealName}
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
          />
        </View>

        {/* 날짜 및 식사 시간 */}
        <View style={styles.timeSection}>
          <TouchableOpacity 
            style={styles.timeChip}
            onPress={handleDateTimePress}>
            <Text style={styles.chipText}>{formatSelectedDateTime()}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.mealTypeChip}
            onPress={handleMealTypePress}>
            <Text style={styles.chipText}>{getMealTypeDisplay(mealType)}</Text>
          </TouchableOpacity>
        </View>

        {/* 칼로리 요약 */}
        <View style={styles.calorieSummary}>
          <Text style={styles.calorieText}>
            {totalCalories} / {targetCalories}kcal
          </Text>
          <View style={styles.nutritionInline}>
            <View style={styles.nutritionInlineItem}>
              <Text style={styles.nutritionInlineLabel}>탄수화물</Text>
              <Text style={styles.nutritionInlineValue}>
                {totalCarbs} / 198g
              </Text>
            </View>
            <View style={styles.nutritionInlineItem}>
              <Text style={styles.nutritionInlineLabel}>단백질</Text>
              <Text style={styles.nutritionInlineValue}>
                {totalProtein} / 132g
              </Text>
            </View>
            <View style={styles.nutritionInlineItem}>
              <Text style={styles.nutritionInlineLabel}>지방</Text>
              <Text style={styles.nutritionInlineValue}>{totalFat} / 49g</Text>
            </View>
          </View>
        </View>

        {/* 사진 섹션 */}
        <ScrollView
          horizontal
          style={styles.photoSection}
          showsHorizontalScrollIndicator={false}>
          {photos.map((photo, idx) => (
            <View key={idx} style={styles.photoBox}>
              <Image source={{uri: photo}} style={styles.photoImage} />
            </View>
          ))}
          <TouchableOpacity
            style={styles.photoBox}
            onPress={handlePhotoUpload}>
            <Icon name="camera" size={34} color="#ffffff" />
          </TouchableOpacity>
        </ScrollView>

        {/* 음식 목록 */}
        <View style={styles.foodList}>
          {foods.map((food, index) => (
            <View key={food.id} style={styles.foodItem}>
              <View style={styles.foodItemHeader}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.foodCalories}>{food.calories}kcal</Text>
              </View>
              <View style={styles.foodNutrition}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>탄</Text>
                  <Text style={styles.nutritionValue}>{food.carbs}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>단</Text>
                  <Text style={styles.nutritionValue}>{food.protein}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>지</Text>
                  <Text style={styles.nutritionValue}>{food.fat}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>중량</Text>
                  <Text style={styles.nutritionValue}>{food.weight}g</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 음식 추가하기 버튼 */}
        <View style={styles.addFoodButtonContainer}>
          <TouchableOpacity
            style={styles.addFoodButton}
            onPress={handleAddFood}>
            <Text style={styles.addFoodButtonText}>음식 추가하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FoodAddOptionsModal
        isOpen={isFoodOptionsModalOpen}
        onClose={() => setIsFoodOptionsModalOpen(false)}
        onPhotoOption={handlePhotoOption}
        onSearchOption={handleSearchOption}
      />

      {/* 날짜 선택기 */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDateTime}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeDate}
          maximumDate={new Date()}
          minimumDate={new Date(2020, 0, 1)}
        />
      )}

      {/* 시간 선택기 */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedDateTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeTime}
          is24Hour={false}
        />
      )}
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  saveButton: {
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
  content: {
    flex: 1,
    paddingBottom: 40,
  },
  nameInputSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  nameInput: {
    width: '100%',
    backgroundColor: '#393a38',
    borderWidth: 0,
    borderRadius: 10,
    padding: 20,
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  timeSection: {
    flexDirection: 'row',
    gap: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  timeChip: {
    backgroundColor: '#393a38',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTypeChip: {
    backgroundColor: '#393a38',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  calorieSummary: {
    backgroundColor: '#393a38',
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  calorieText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 15,
  },
  nutritionInline: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  nutritionInlineItem: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  nutritionInlineLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  nutritionInlineValue: {
    fontSize: 10,
    fontWeight: '400',
    color: '#ffffff',
  },
  photoSection: {
    flexDirection: 'row',
    gap: 18,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  photoBox: {
    width: 136,
    height: 124,
    backgroundColor: '#393a38',
    borderRadius: 20,
    marginRight: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  foodList: {
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 15,
  },
  foodItem: {
    backgroundColor: '#393a38',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  foodName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  foodCalories: {
    fontSize: 20,
    fontWeight: '400',
    color: '#ffffff',
    textAlign: 'right',
  },
  foodNutrition: {
    flexDirection: 'row',
    gap: 10,
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
  addFoodButtonContainer: {
    paddingHorizontal: 20,
  },
  addFoodButton: {
    width: '100%',
    backgroundColor: '#e3ff7c',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  addFoodButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default MealAddScreen;

