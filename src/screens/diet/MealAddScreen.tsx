import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';


import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {useFocusEffect} from '@react-navigation/native';
import FoodAddOptionsModal from '../../components/modals/FoodAddOptionsModal';
import FoodEditModal from '../../components/modals/FoodEditModal';
import {mealAPI} from '../../services';
import {useDate} from '../../contexts/DateContext';
import {fetchDateProgress, fetchTodayProgress} from '../../utils/exerciseApi';
import type {AddMealRequest, AddMealFoodRequest, DailyMeal, DailyMealsResponse, NutritionGoal, SearchFoodResponse, DailyProgressWeekItem} from '../../types';
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
  const {selectedDate: contextSelectedDate} = useDate();
  const mealData: DailyMeal | undefined = route?.params?.meal; // 수정 모드일 때 전달받은 식단 데이터
  const routeSelectedDate: Date | undefined = route?.params?.selectedDate; // DietScreen에서 전달받은 선택 날짜
  const isEditMode = !!mealData;
  
  // 날짜 우선순위: route에서 전달받은 날짜 > context의 선택 날짜 > 오늘 날짜
  // 시간은 항상 현재 시간으로 설정 (또는 기존 시간 유지)
  const getInitialDate = (): Date => {
    const now = new Date();
    const baseDate = routeSelectedDate || contextSelectedDate;
    
    if (baseDate) {
      // 기존 날짜를 사용하되, 시간은 현재 시간으로 설정
      const date = new Date(baseDate);
      date.setHours(now.getHours());
      date.setMinutes(now.getMinutes());
      date.setSeconds(0);
      date.setMilliseconds(0);
      return date;
    }
    
    return now;
  };
  
  const initialDate = getInitialDate();
  
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER'>('BREAKFAST');
  const [isFoodOptionsModalOpen, setIsFoodOptionsModalOpen] = useState(false);
  const [isMealTypeModalOpen, setIsMealTypeModalOpen] = useState(false);
  const [foods, setFoods] = useState<Food[]>([]);
  const [isFoodEditModalOpen, setIsFoodEditModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [tempDateTime, setTempDateTime] = useState(initialDate);
  const [selectedDateTime, setSelectedDateTime] = useState(initialDate);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dailyMealsData, setDailyMealsData] = useState<DailyMealsResponse | null>(null);

  // 날짜 형식 변환 함수 (Date -> yyyy-MM-dd)
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 일일 식단 데이터 조회
  const fetchDailyMeals = async (date: Date) => {
    try {
      const dateString = formatDateToString(date);
      const data = await mealAPI.getDailyMeals(dateString);
      setDailyMealsData(data);
    } catch (error: any) {
      console.error('일별 식단 조회 실패:', error);
      setDailyMealsData(null);
    }
  };

  // 영양 목표 로드 (목표가 없으면 API에서 자동 생성)
  const loadNutritionGoal = async () => {
    try {
      const data = await mealAPI.getNutritionGoal();
      setNutritionGoal(data);
      console.log('영양 목표 조회 성공:', data);
    } catch (e: any) {
      console.error('영양 목표 로드 실패:', e);
      // 401 에러가 아닌 경우에만 기본값 설정 (인증 문제가 아닌 경우)
      if (e?.status !== 401) {
        // API에서 자동 생성되므로 잠시 후 재시도
        setTimeout(async () => {
          try {
            const retryData = await mealAPI.getNutritionGoal();
            setNutritionGoal(retryData);
            console.log('영양 목표 재시도 성공:', retryData);
          } catch (retryError) {
            console.error('영양 목표 재시도 실패:', retryError);
            // 재시도 실패 시 현재 nutritionGoal이 없으면 0으로 설정
            setNutritionGoal(prev => {
              if (!prev) {
                return {
                  id: 0,
                  targetCalories: 0,
                  targetCarbs: 0,
                  targetProtein: 0,
                  targetFat: 0,
                  goalType: 'AUTO',
                  goalTypeDescription: '자동 계산',
                };
              }
              return prev;
            });
          }
        }, 500);
      }
    }
  };

  // 컴포넌트 마운트 시 영양 목표 조회
  useEffect(() => {
    loadNutritionGoal();
  }, []);

  // 화면 포커스 시 영양 목표 다시 조회
  useFocusEffect(
    React.useCallback(() => {
      loadNutritionGoal();
      // 선택된 날짜의 일일 식단 데이터 조회
      fetchDailyMeals(selectedDateTime);
    }, [selectedDateTime])
  );

  // selectedDateTime이 변경될 때 일일 식단 데이터 조회
  useEffect(() => {
    fetchDailyMeals(selectedDateTime);
  }, [selectedDateTime]);

  // 수정 모드일 때 기존 데이터 로드, 또는 route에서 날짜를 받았을 때 날짜 설정
  useEffect(() => {
    if (mealData) {
      // 수정 모드
      setMealName(mealData.memo || '');
      setMealType(mealData.mealType);
      // 날짜 설정
      if (mealData.mealDate) {
        const date = new Date(mealData.mealDate);
        if (mealData.createdAt) {
          const createdDate = new Date(mealData.createdAt);
          date.setHours(createdDate.getHours());
          date.setMinutes(createdDate.getMinutes());
          date.setSeconds(0);
          date.setMilliseconds(0);
        } else {
          // createdAt이 없으면 현재 시간 사용
          const now = new Date();
          date.setHours(now.getHours());
          date.setMinutes(now.getMinutes());
          date.setSeconds(0);
          date.setMilliseconds(0);
        }
        setSelectedDateTime(date);
      }
      // 음식 데이터 변환
      const convertedFoods: Food[] = mealData.foods.map((food: any, index: number) => ({
        id: food.id || Date.now() + index,
        name: food.foodName,
        calories: food.calories,
        carbs: food.carbs,
        protein: food.protein,
        fat: food.fat,
        weight: food.servingSize,
      }));
      setFoods(convertedFoods);
    } else if (routeSelectedDate && !mealData) {
      // route에서 날짜를 받았을 때 날짜 설정 (수정 모드가 아닐 때)
      // 날짜는 유지하고 시간은 현재 시간으로 설정
      const now = new Date();
      const date = new Date(routeSelectedDate);
      date.setHours(now.getHours());
      date.setMinutes(now.getMinutes());
      date.setSeconds(0);
      date.setMilliseconds(0);
      setSelectedDateTime(date);
    }
  }, [mealData, routeSelectedDate]);

  // 날짜 선택 모달 열기
  const handleDateTimePress = () => {
    // 현재 선택된 날짜를 정확히 복사 (새로운 객체 생성)
    const currentDateTime = new Date(selectedDateTime);
    setTempDateTime(new Date(currentDateTime));
    setShowDateTimeModal(true);
  };

  // 날짜 선택 핸들러
  const onChangeDate = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setShowDateTimeModal(false);
        return;
      }
      if (date) {
        // 날짜만 변경하고 시간은 현재 시간으로 유지
        const newDate = new Date(date);
        const now = new Date();
        newDate.setHours(now.getHours());
        newDate.setMinutes(now.getMinutes());
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        setTempDateTime(newDate);
        // 날짜 선택 후 바로 적용
        setSelectedDateTime(newDate);
        setShowDateTimeModal(false);
      }
    } else {
      // iOS - 날짜가 변경될 때마다 tempDateTime 업데이트
      if (date) {
        const newDate = new Date(date);
        const now = new Date();
        newDate.setHours(now.getHours());
        newDate.setMinutes(now.getMinutes());
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        setTempDateTime(newDate);
        // iOS에서는 확인 버튼을 눌러야 적용
      }
      if (event.type === 'dismissed') {
        setShowDateTimeModal(false);
      }
    }
  };

  // 시간 선택 핸들러
  const onChangeTime = (event: any, time?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setShowDateTimeModal(false);
        return;
      }
      if (time) {
        // 시간만 변경하고 날짜는 유지
        const newDate = new Date(tempDateTime);
        newDate.setHours(time.getHours());
        newDate.setMinutes(time.getMinutes());
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        setTempDateTime(newDate);
        setShowDateTimeModal(false);
        setSelectedDateTime(newDate);
      }
    } else {
      // iOS - 시간이 변경될 때마다 tempDateTime 업데이트 (실시간 반영)
      // iOS에서는 onChange가 사용자가 값을 변경할 때마다 호출됨
      if (time) {
        // 새로운 Date 객체를 생성하여 업데이트
        const newDate = new Date(tempDateTime);
        newDate.setHours(time.getHours());
        newDate.setMinutes(time.getMinutes());
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        // 새로운 객체를 생성하여 React가 변경을 감지하도록 함
        setTempDateTime(new Date(newDate));
        console.log('시간 변경:', newDate.toLocaleTimeString());
      }
      // iOS에서는 dismissed 이벤트가 발생하지 않을 수 있으므로 확인 버튼으로만 닫기
    }
  };

  // 모달에서 확인 버튼 클릭
  const handleDateTimeConfirm = () => {
    // 날짜만 적용하고 시간은 현재 시간으로 설정
    const now = new Date();
    const finalDate = new Date(tempDateTime);
    finalDate.setHours(now.getHours());
    finalDate.setMinutes(now.getMinutes());
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);
    setSelectedDateTime(finalDate);
    setShowDateTimeModal(false);
  };

  // 모달에서 취소 버튼 클릭
  const handleDateTimeCancel = () => {
    setTempDateTime(selectedDateTime);
    setShowDateTimeModal(false);
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

  // 한글 mealType을 영어로 변환
  const getMealTypeName = (type: string): string => {
    const typeMap: Record<string, string> = {
      '아침': 'BREAKFAST',
      '점심': 'LUNCH',
      '저녁': 'DINNER',
      '야식': 'SNACK',
      '기타': 'OTHER',
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
      'OTHER': '기타',
    };
    return typeMap[type] || '저녁';
  };

  // 선택된 날짜 표시 포맷 (25.11.02 형식)
  const formatSelectedDateTime = (): string => {
    const selected = selectedDateTime;
    
    const year = String(selected.getFullYear()).slice(-2); // 연도 마지막 2자리
    const month = String(selected.getMonth() + 1).padStart(2, '0'); // 월 (2자리)
    const day = String(selected.getDate()).padStart(2, '0'); // 일 (2자리)
    
    return `${year}.${month}.${day}`;
  };

  // API 데이터를 UI 형식으로 변환 (목표가 없으면 0)
  const targetCalories = nutritionGoal?.targetCalories || 0;
  const targetCarbs = nutritionGoal?.targetCarbs || 0;
  const targetProtein = nutritionGoal?.targetProtein || 0;
  const targetFat = nutritionGoal?.targetFat || 0;

  // 현재 입력 중인 음식의 영양소 합계
  const currentMealCalories = foods.reduce((sum, food) => sum + food.calories, 0);
  const currentMealCarbs = foods.reduce((sum, food) => sum + food.carbs, 0);
  const currentMealProtein = foods.reduce((sum, food) => sum + food.protein, 0);
  const currentMealFat = foods.reduce((sum, food) => sum + food.fat, 0);

  // 수정 모드일 때는 현재 수정 중인 식단의 영양소를 제외하고 계산
  const existingMealsCalories = isEditMode && mealData
    ? (dailyMealsData?.dailyTotalCalories || 0) - mealData.totalCalories
    : (dailyMealsData?.dailyTotalCalories || 0);

  const existingMealsCarbs = isEditMode && mealData
    ? (dailyMealsData?.dailyTotalCarbs || 0) - mealData.totalCarbs
    : (dailyMealsData?.dailyTotalCarbs || 0);

  const existingMealsProtein = isEditMode && mealData
    ? (dailyMealsData?.dailyTotalProtein || 0) - mealData.totalProtein
    : (dailyMealsData?.dailyTotalProtein || 0);

  const existingMealsFat = isEditMode && mealData
    ? (dailyMealsData?.dailyTotalFat || 0) - mealData.totalFat
    : (dailyMealsData?.dailyTotalFat || 0);

  // 전체 일일 영양소 합계 (기존 식단 + 현재 입력 중인 음식)
  const totalCalories = existingMealsCalories + currentMealCalories;
  const totalCarbs = existingMealsCarbs + currentMealCarbs;
  const totalProtein = existingMealsProtein + currentMealProtein;
  const totalFat = existingMealsFat + currentMealFat;

  // Food를 API 형식으로 변환
  const convertFoodToAPIFormat = (food: Food): AddMealFoodRequest => {
    // 숫자 타입 보장 및 검증
    const servingSize = typeof food.weight === 'number' 
      ? (food.weight > 0 ? food.weight : 100)
      : (parseFloat(String(food.weight || 100)) || 100);
    
    const calories = typeof food.calories === 'number' 
      ? food.calories 
      : (parseFloat(String(food.calories || 0)) || 0);
    const carbs = typeof food.carbs === 'number' 
      ? food.carbs 
      : (parseFloat(String(food.carbs || 0)) || 0);
    const protein = typeof food.protein === 'number' 
      ? food.protein 
      : (parseFloat(String(food.protein || 0)) || 0);
    const fat = typeof food.fat === 'number' 
      ? food.fat 
      : (parseFloat(String(food.fat || 0)) || 0);
    
    // 필수 필드만 포함 (optional 필드는 제외)
    const foodData: AddMealFoodRequest = {
      foodName: food.name.trim(),
      servingSize: Math.max(1, Math.round(servingSize)),
      calories: Math.max(0, Math.round(calories)),
      carbs: Math.max(0, Math.round(carbs * 10) / 10), // 소수점 1자리
      protein: Math.max(0, Math.round(protein * 10) / 10),
      fat: Math.max(0, Math.round(fat * 10) / 10), // 소수점 1자리
      // optional 필드들은 제외 (sodium, cholesterol, sugar, fiber)
    };
    
    return foodData;
  };

  const handleSave = async () => {
    if (foods.length === 0) {
      Alert.alert('알림', '음식을 추가해주세요.');
      return;
    }

    setLoading(true);
    try {
      const dateToUse = selectedDateTime; // selectedDate 대신 selectedDateTime 사용
      
      // 음식 데이터 검증 및 변환
      const convertedFoods = foods.map(convertFoodToAPIFormat);
      
      // 검증: 모든 음식이 유효한지 확인
      for (let i = 0; i < convertedFoods.length; i++) {
        const food = convertedFoods[i];
        if (!food.foodName || food.foodName.trim() === '') {
          Alert.alert('알림', `${i + 1}번째 음식의 이름이 비어있습니다.`);
          setLoading(false);
          return;
        }
        if (food.servingSize <= 0) {
          Alert.alert('알림', `${food.foodName}의 중량이 0보다 커야 합니다.`);
          setLoading(false);
          return;
        }
        if (food.calories < 0 || food.carbs < 0 || food.protein < 0 || food.fat < 0) {
          Alert.alert('알림', `${food.foodName}의 영양소 값이 올바르지 않습니다.`);
          setLoading(false);
          return;
        }
      }
      
      const mealDateString = formatDateToString(dateToUse);
      
      // 최종 검증: 모든 음식 데이터 확인
      const validatedFoods = convertedFoods.map((food, index) => {
        // 모든 필수 필드가 있는지 확인
        if (!food.foodName || food.foodName.trim() === '') {
          throw new Error(`${index + 1}번째 음식의 이름이 비어있습니다.`);
        }
        if (!food.servingSize || food.servingSize <= 0) {
          throw new Error(`${food.foodName}의 중량이 올바르지 않습니다.`);
        }
        if (food.calories < 0 || food.carbs < 0 || food.protein < 0 || food.fat < 0) {
          throw new Error(`${food.foodName}의 영양소 값이 올바르지 않습니다.`);
        }
        
        // foodName 길이 제한 (서버 검증을 위해)
        const trimmedName = food.foodName.trim();
        const maxNameLength = 100; // 서버가 요구하는 최대 길이 (필요시 조정)
        const finalFoodName = trimmedName.length > maxNameLength 
          ? trimmedName.substring(0, maxNameLength) 
          : trimmedName;
        
        // 숫자 값 검증 및 정규화 (API 스펙에 맞게)
        // servingSize는 정수 (1~10000)
        const finalServingSize = Math.max(1, Math.min(10000, Math.round(food.servingSize)));
        
        // calories는 정수 (0~100000)
        const finalCalories = Math.max(0, Math.min(100000, Math.round(food.calories)));
        
        // carbs, protein, fat은 소수점 가능 (소수점 1자리로 제한, 0~10000)
        // API 스펙 예제를 보면 fat: 3.6처럼 소수점이 있음
        const finalCarbs = Math.max(0, Math.min(10000, Math.round((food.carbs || 0) * 10) / 10));
        const finalProtein = Math.max(0, Math.min(10000, Math.round((food.protein || 0) * 10) / 10));
        const finalFat = Math.max(0, Math.min(10000, Math.round((food.fat || 0) * 10) / 10));
        
        // optional 필드들도 정규화 (소수점 가능)
        const finalSodium = Math.max(0, Math.min(100000, Math.round((food.sodium || 0) * 10) / 10));
        const finalCholesterol = Math.max(0, Math.min(100000, Math.round((food.cholesterol || 0) * 10) / 10));
        const finalSugar = Math.max(0, Math.min(10000, Math.round((food.sugar || 0) * 10) / 10));
        const finalFiber = Math.max(0, Math.min(10000, Math.round((food.fiber || 0) * 10) / 10));
        
        // NaN이나 Infinity 체크
        if (isNaN(finalServingSize) || isNaN(finalCalories) || isNaN(finalCarbs) || 
            isNaN(finalProtein) || isNaN(finalFat) || isNaN(finalSodium) || 
            isNaN(finalCholesterol) || isNaN(finalSugar) || isNaN(finalFiber)) {
          throw new Error(`${food.foodName}의 영양소 값에 유효하지 않은 숫자가 포함되어 있습니다.`);
        }
        
        // API 스펙에 맞게 모든 필드 포함 (필드 순서도 스펙과 동일하게)
        const foodData: any = {
          foodName: finalFoodName,
          servingSize: finalServingSize,
          calories: finalCalories,
          carbs: finalCarbs,
          protein: finalProtein,
          fat: finalFat,
          sodium: finalSodium,
          cholesterol: finalCholesterol,
          sugar: finalSugar,
          fiber: finalFiber,
        };
        
        // optional 필드들 (값이 있을 때만 추가, undefined 제거)
        if (food.imageUrl) {
          foodData.imageUrl = food.imageUrl;
        }
        if (food.aiConfidenceScore !== undefined && food.aiConfidenceScore !== null) {
          foodData.aiConfidenceScore = food.aiConfidenceScore;
        }
        
        console.log(`검증된 음식 데이터 ${index + 1}:`, JSON.stringify(foodData, null, 2));
        
        return foodData as AddMealFoodRequest;
      });
      
      // 최종 요청 데이터 구성 (API 스펙 순서대로, undefined 필드 제거)
      const mealRequestData: any = {
        mealDate: mealDateString,
        mealType: mealType,
        foods: validatedFoods,
      };
      
      // memo가 비어있지 않으면 추가 (길이 제한, 빈 문자열은 제외)
      const trimmedMemo = mealName?.trim() || '';
      if (trimmedMemo.length > 0) {
        mealRequestData.memo = trimmedMemo.length > 500 ? trimmedMemo.substring(0, 500) : trimmedMemo;
      }
      
      // undefined 필드 제거 (서버가 거부할 수 있음)
      const cleanMealRequestData = JSON.parse(JSON.stringify(mealRequestData));
      
      // 최종 검증: 날짜 형식 재확인
      if (!/^\d{4}-\d{2}-\d{2}$/.test(mealDateString)) {
        Alert.alert('오류', '날짜 형식이 올바르지 않습니다.');
        setLoading(false);
        return;
      }
      
      // 최종 검증: mealType 확인
      const validMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER'];
      if (!validMealTypes.includes(mealType)) {
        Alert.alert('오류', '식사 타입이 올바르지 않습니다.');
        setLoading(false);
        return;
      }
      
      // 최종 검증: foods 배열이 비어있지 않은지 확인
      if (!cleanMealRequestData.foods || cleanMealRequestData.foods.length === 0) {
        Alert.alert('알림', '음식을 추가해주세요.');
        setLoading(false);
        return;
      }
      
      console.log('식사 추가 요청 데이터:', JSON.stringify(cleanMealRequestData, null, 2));
      console.log('날짜:', mealDateString);
      console.log('식사 타입:', mealType);
      console.log('음식 개수:', validatedFoods.length);
      validatedFoods.forEach((food, index) => {
        console.log(`음식 ${index + 1}:`, {
          foodName: food.foodName,
          servingSize: food.servingSize,
          calories: food.calories,
          carbs: food.carbs,
          protein: food.protein,
          fat: food.fat,
        });
      });

      // 식단 추가/수정할 날짜
      const mealDate = formatDateToString(dateToUse);
      const today = new Date();
      const isToday = 
        dateToUse.getFullYear() === today.getFullYear() &&
        dateToUse.getMonth() === today.getMonth() &&
        dateToUse.getDate() === today.getDate();

      if (isEditMode && mealData?.id) {
        // 수정 모드: PUT 요청 (API가 없으면 일단 추가 API 사용)
        await mealAPI.addMeal(cleanMealRequestData as AddMealRequest);
        Alert.alert('성공', '식사가 수정되었습니다.', [
          {
            text: '확인',
            onPress: async () => {
              // 해당 날짜의 진행률 가져오기
              let dateProgress: DailyProgressWeekItem | null = null;
              try {
                if (isToday) {
                  dateProgress = await fetchTodayProgress();
                } else {
                  dateProgress = await fetchDateProgress(mealDate);
                }
              } catch (error) {
                console.error('진행률 조회 실패:', error);
              }
              // StatsScreen으로 돌아가기 (탭바 유지)
              navigation.navigate('Stats', { 
                activeTab: 1, // 식단기록 탭 활성화
                updatedProgress: dateProgress,
                updatedDate: mealDate 
              });
            },
          },
        ]);
      } else {
        // 추가 모드
        await mealAPI.addMeal(cleanMealRequestData as AddMealRequest);
        Alert.alert('성공', '식사가 추가되었습니다.', [
          {
            text: '확인',
            onPress: async () => {
              // 해당 날짜의 진행률 가져오기
              let dateProgress: DailyProgressWeekItem | null = null;
              try {
                if (isToday) {
                  dateProgress = await fetchTodayProgress();
                } else {
                  dateProgress = await fetchDateProgress(mealDate);
                }
              } catch (error) {
                console.error('진행률 조회 실패:', error);
              }
              // StatsScreen으로 돌아가기 (탭바 유지)
              navigation.navigate('Stats', { 
                activeTab: 1, // 식단기록 탭 활성화
                updatedProgress: dateProgress,
                updatedDate: mealDate 
              });
            },
          },
        ]);
      }
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

  const handlePhotoOption = async () => {
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
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: false,
          });
          if (!result.canceled && result.assets && result.assets[0]) {
            await handleUploadFood(result.assets[0].uri);
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
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: false,
          });
          if (!result.canceled && result.assets && result.assets[0]) {
            await handleUploadFood(result.assets[0].uri);
          }
        },
      },
      {text: '취소', style: 'cancel'},
    ]);
  };

  const handleUploadFood = async (imageUri: string) => {
    setIsUploading(true);
    try {
      const response = await mealAPI.uploadFood(imageUri);
      
      // API 응답에서 음식 정보 추출 (응답 형식에 따라 조정 필요)
      // 예상 응답 형식: { ai_result: {...} }, { foods: [...] }, 또는 직접 음식 배열
      let foodData: Food | null = null;
      
      console.log('업로드 응답:', JSON.stringify(response, null, 2));
      
      // ai_result가 있는 경우 (사진 업로드 응답)
      if (response.ai_result) {
        // ai_result가 배열인 경우 첫 번째 항목 사용
        const aiResult = Array.isArray(response.ai_result) 
          ? response.ai_result[0] 
          : response.ai_result;
        
        if (aiResult) {
          // 숫자 타입 보장 및 검증
          const calories = typeof aiResult.calories === 'number' 
            ? aiResult.calories 
            : parseFloat(String(aiResult.calories || 0)) || 0;
          const carbs = typeof aiResult.carbs === 'number' 
            ? aiResult.carbs 
            : parseFloat(String(aiResult.carbs || 0)) || 0;
          const protein = typeof aiResult.protein === 'number' 
            ? aiResult.protein 
            : parseFloat(String(aiResult.protein || 0)) || 0;
          const fat = typeof aiResult.fat === 'number' 
            ? aiResult.fat 
            : parseFloat(String(aiResult.fat || 0)) || 0;
          const weight = typeof aiResult.weight === 'number' 
            ? aiResult.weight 
            : parseFloat(String(aiResult.weight || 100)) || 100;
          
          // 이름은 한국어 우선, 없으면 영어
          const name = aiResult.name_ko || aiResult.name_en || aiResult.name || '음식';
          
          foodData = {
            id: aiResult.id || Date.now(),
            name: name,
            calories: Math.max(0, calories),
            carbs: Math.max(0, carbs),
            protein: Math.max(0, protein),
            fat: Math.max(0, fat),
            weight: Math.max(1, weight), // weight는 최소 1
          };
          
          console.log('사진 업로드로 변환된 음식 데이터:', foodData);
        }
      } else if (Array.isArray(response)) {
        // 배열인 경우 첫 번째 음식 사용
        if (response.length > 0) {
          const item = response[0];
          foodData = {
            id: item.id || Date.now(),
            name: item.name || '음식',
            calories: item.calories || 0,
            carbs: item.carbs || 0,
            protein: item.protein || 0,
            fat: item.fat || 0,
            weight: item.weight || 100,
          };
        }
      } else if (response.foods && Array.isArray(response.foods) && response.foods.length > 0) {
        // foods 배열이 있는 경우
        const item = response.foods[0];
        foodData = {
          id: item.id || Date.now(),
          name: item.name || item.foodName || '음식',
          calories: item.calories || 0,
          carbs: item.carbs || 0,
          protein: item.protein || 0,
          fat: item.fat || 0,
          weight: item.weight || item.servingSize || 100,
        };
      } else if (response.name) {
        // 직접 음식 객체인 경우
        foodData = {
          id: response.id || Date.now(),
          name: response.name,
          calories: response.calories || 0,
          carbs: response.carbs || 0,
          protein: response.protein || 0,
          fat: response.fat || 0,
          weight: response.weight || response.servingSize || 100,
        };
      }

      if (foodData) {
        setFoods(prev => [...prev, foodData!]);
        Alert.alert('성공', '음식이 추가되었습니다.');
      } else {
        Alert.alert('알림', '음식 정보를 가져올 수 없습니다.');
      }
    } catch (error: any) {
      console.error('사진 업로드 오류:', error);
      Alert.alert('오류', error.message || '사진 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearchOption = () => {
    navigation.navigate('FoodSearch');
  };

  // 식사 타입 선택 핸들러
  const handleMealTypePress = () => {
    setIsMealTypeModalOpen(true);
  };

  const handleMealTypeSelect = (type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER') => {
    setMealType(type);
    setIsMealTypeModalOpen(false);
  };

  // 음식 수정 핸들러
  const handleFoodUpdate = (updatedFood: Food) => {
    setFoods(prev => prev.map(food => 
      food.id === updatedFood.id ? updatedFood : food
    ));
  };

  // 음식 삭제 핸들러
  const handleFoodDelete = (foodId: number) => {
    setFoods(prev => prev.filter(food => food.id !== foodId));
  };

  // 소수점 한 자리 포맷팅 (소수점이 0이면 정수로 표시)
  const formatDecimal = (value: number): string => {
    const fixed = value.toFixed(1);
    return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? '식단 수정하기' : '식단 추가하기'}</Text>
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
            {formatDecimal(totalCalories)} / {formatDecimal(targetCalories)}kcal
          </Text>
          <View style={styles.nutritionInline}>
            <View style={styles.nutritionInlineItem}>
              <Text style={styles.nutritionInlineLabel}>탄수화물</Text>
              <Text style={styles.nutritionInlineValue}>
                {formatDecimal(totalCarbs)} / {formatDecimal(targetCarbs)}g
              </Text>
            </View>
            <View style={styles.nutritionInlineItem}>
              <Text style={styles.nutritionInlineLabel}>단백질</Text>
              <Text style={styles.nutritionInlineValue}>
                {formatDecimal(totalProtein)} / {formatDecimal(targetProtein)}g
              </Text>
            </View>
            <View style={styles.nutritionInlineItem}>
              <Text style={styles.nutritionInlineLabel}>지방</Text>
              <Text style={styles.nutritionInlineValue}>{formatDecimal(totalFat)} / {formatDecimal(targetFat)}g</Text>
            </View>
          </View>
        </View>

        {/* 음식 목록 */}
        <View style={styles.foodList}>
          {foods.map((food, index) => (
            <TouchableOpacity
              key={food.id}
              style={styles.foodItem}
              onPress={() => {
                // 음식 수정 기능 일시 비활성화
                // setSelectedFood(food);
                // setIsFoodEditModalOpen(true);
              }}
              activeOpacity={0.7}>
              <View style={styles.foodItemHeader}>
                <Text style={styles.foodName} numberOfLines={2}>{food.name}</Text>
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
            </TouchableOpacity>
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

      <FoodEditModal
        isOpen={isFoodEditModalOpen}
        onClose={() => {
          setIsFoodEditModalOpen(false);
          setSelectedFood(null);
        }}
        food={selectedFood}
        onSave={handleFoodUpdate}
        onDelete={handleFoodDelete}
      />

      {/* 업로드 중 로딩 모달 */}
      {isUploading && (
        <Modal
          visible={isUploading}
          transparent={true}
          animationType="fade">
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#e3ff7c" />
              <Text style={styles.loadingText}>사진 분석 중...</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* 날짜/시간 선택 모달 */}
      <Modal
        visible={showDateTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleDateTimeCancel}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleDateTimeCancel}>
          <View style={styles.dateTimeModalContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.dateTimeModalHeader}>
              <TouchableOpacity onPress={handleDateTimeCancel}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>날짜 선택</Text>
              <TouchableOpacity onPress={handleDateTimeConfirm}>
                <Text style={styles.modalConfirmText}>확인</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateTimePickerContainer}>
              <DateTimePicker
                value={tempDateTime}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeDate}
                minimumDate={new Date(2020, 0, 1)}
                maximumDate={new Date(2100, 11, 31)}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 식사 타입 선택 모달 */}
      <Modal
        visible={isMealTypeModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsMealTypeModalOpen(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMealTypeModalOpen(false)}>
          <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>식사 타입 선택</Text>
              <TouchableOpacity
                onPress={() => setIsMealTypeModalOpen(false)}
                style={styles.modalCloseButton}>
                <Icon name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalOptions}>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  mealType === 'BREAKFAST' && styles.modalOptionActive,
                ]}
                onPress={() => handleMealTypeSelect('BREAKFAST')}>
                <Text
                  style={[
                    styles.modalOptionText,
                    mealType === 'BREAKFAST' && styles.modalOptionTextActive,
                  ]}>
                  아침
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  mealType === 'LUNCH' && styles.modalOptionActive,
                ]}
                onPress={() => handleMealTypeSelect('LUNCH')}>
                <Text
                  style={[
                    styles.modalOptionText,
                    mealType === 'LUNCH' && styles.modalOptionTextActive,
                  ]}>
                  점심
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  mealType === 'DINNER' && styles.modalOptionActive,
                ]}
                onPress={() => handleMealTypeSelect('DINNER')}>
                <Text
                  style={[
                    styles.modalOptionText,
                    mealType === 'DINNER' && styles.modalOptionTextActive,
                  ]}>
                  저녁
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  mealType === 'SNACK' && styles.modalOptionActive,
                ]}
                onPress={() => handleMealTypeSelect('SNACK')}>
                <Text
                  style={[
                    styles.modalOptionText,
                    mealType === 'SNACK' && styles.modalOptionTextActive,
                  ]}>
                  야식
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  mealType === 'OTHER' && styles.modalOptionActive,
                ]}
                onPress={() => handleMealTypeSelect('OTHER')}>
                <Text
                  style={[
                    styles.modalOptionText,
                    mealType === 'OTHER' && styles.modalOptionTextActive,
                  ]}>
                  기타
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#252525',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptions: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  modalOption: {
    backgroundColor: '#393a38',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalOptionActive: {
    backgroundColor: '#e3ff7c',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOptionTextActive: {
    color: '#000000',
  },
  foodName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  foodCalories: {
    fontSize: 20,
    fontWeight: '400',
    color: '#ffffff',
    textAlign: 'right',
    flexShrink: 0,
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
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#252525',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  dateTimeModalContainer: {
    backgroundColor: '#252525',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '70%',
  },
  dateTimeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  dateTimePickerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  dateTimeConfirmButton: {
    marginTop: 20,
    backgroundColor: '#e3ff7c',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  dateTimeConfirmButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  modalCancelText: {
    color: '#999999',
    fontSize: 16,
    fontWeight: '400',
  },
  modalConfirmText: {
    color: '#e3ff7c',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MealAddScreen;



