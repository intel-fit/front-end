import React, {useState, useEffect, useMemo} from 'react';
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
  InteractionManager,
} from 'react-native';


import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FoodAddOptionsModal from '../../components/modals/FoodAddOptionsModal';
import FoodEditModal from '../../components/modals/FoodEditModal';
import FoodDirectInputModal from '../../components/modals/FoodDirectInputModal';
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
  liked?: boolean; // 좋아요 상태
}

const MealAddScreen = ({navigation, route}: any) => {
  const {selectedDate: contextSelectedDate} = useDate();
  // route params에서 mealData를 받아서 state에 저장 (화면 이동 시 params가 사라질 수 있으므로)
  const [mealData, setMealData] = useState<DailyMeal | undefined>(route?.params?.meal);
  const routeSelectedDateString: string | undefined = route?.params?.selectedDate; // DietScreen에서 전달받은 선택 날짜 (문자열)
  const isEditMode = !!mealData;
  
  // route params가 변경될 때 mealData 업데이트
  useEffect(() => {
    if (route?.params?.meal) {
      console.log('📥 route params에서 mealData 업데이트:', route.params.meal.id);
      setMealData(route.params.meal);
    }
  }, [route?.params?.meal]);
  
  // 날짜 우선순위: route에서 전달받은 날짜 > context의 선택 날짜 > 오늘 날짜
  // 시간은 항상 현재 시간으로 설정 (또는 기존 시간 유지)
  const getInitialDate = (): Date => {
    const now = new Date();
    let baseDate: Date | null = null;
    
    // route에서 전달받은 날짜 문자열을 Date 객체로 변환
    if (routeSelectedDateString) {
      try {
        // yyyy-MM-dd 형식의 문자열을 Date 객체로 변환
        const parts = routeSelectedDateString.split('-');
        if (parts.length === 3) {
          baseDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          // ISO 형식으로 파싱 시도
          baseDate = new Date(routeSelectedDateString);
        }
        if (isNaN(baseDate.getTime())) {
          baseDate = null;
        }
      } catch (e) {
        console.warn('날짜 파싱 실패:', routeSelectedDateString);
        baseDate = null;
      }
    }
    
    // baseDate가 없으면 context의 선택 날짜 사용
    if (!baseDate && contextSelectedDate) {
      baseDate = contextSelectedDate;
    }
    
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
  const [isFoodDirectInputModalOpen, setIsFoodDirectInputModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [dateTimeMode, setDateTimeMode] = useState<'date' | 'time'>('date');
  const [tempDateTime, setTempDateTime] = useState(initialDate);
  const [selectedDateTime, setSelectedDateTime] = useState(initialDate);
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dailyMealsData, setDailyMealsData] = useState<DailyMealsResponse | null>(null);
  const [likedFoods, setLikedFoods] = useState<Set<number>>(new Set()); // 좋아요한 음식 ID 집합

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

  // 영양 목표 로드 (특정 날짜의 목표 조회 API 사용)
  const loadNutritionGoal = async (date?: Date) => {
    try {
      const targetDate = date || selectedDateTime;
      const dateString = formatDateToString(targetDate);
      const data = await mealAPI.getNutritionGoal(dateString);
      setNutritionGoal(data);
      console.log('영양 목표 조회 성공:', data);
    } catch (e: any) {
      console.error('영양 목표 로드 실패:', e);
      // 401 에러가 아닌 경우에만 기본값 설정 (인증 문제가 아닌 경우)
      if (e?.status !== 401) {
        // API에서 자동 생성되므로 잠시 후 재시도
        setTimeout(async () => {
          try {
            const targetDate = date || selectedDateTime;
            const dateString = formatDateToString(targetDate);
            const retryData = await mealAPI.getNutritionGoal(dateString);
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
                  isManual: false,
                  exists: false,
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
      loadNutritionGoal(selectedDateTime);
      // 선택된 날짜의 일일 식단 데이터 조회
      fetchDailyMeals(selectedDateTime);
    }, [selectedDateTime])
  );

  // selectedDateTime이 변경될 때 영양 목표 조회
  useEffect(() => {
    loadNutritionGoal(selectedDateTime);
  }, [selectedDateTime]);

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
      // 중요: food.id는 food_id여야 함 (meal_item_id가 아님)
      const convertedFoods: Food[] = mealData.foods.map((food: any, index: number) => {
        // food_id 우선 사용, 없으면 id 사용, 둘 다 없으면 0
        const foodId = food.food_id || food.id || 0;
        console.log(`음식 변환 ${index + 1}: foodName=${food.foodName}, food_id=${foodId}, meal_item_id=${food.meal_item_id || food.id}`);
        
        return {
          id: foodId, // food_id 사용 (meal_item_id가 아님)
          name: food.foodName,
          calories: food.calories,
          carbs: food.carbs,
          protein: food.protein,
          fat: food.fat,
          weight: food.servingSize,
        };
      });
      setFoods(convertedFoods);
    } else if (routeSelectedDateString && !mealData) {
      // route에서 날짜를 받았을 때 날짜 설정 (수정 모드가 아닐 때)
      // 날짜는 유지하고 시간은 현재 시간으로 설정
      const now = new Date();
      let date: Date;
      try {
        // yyyy-MM-dd 형식의 문자열을 Date 객체로 변환
        const parts = routeSelectedDateString.split('-');
        if (parts.length === 3) {
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          date = new Date(routeSelectedDateString);
        }
        if (isNaN(date.getTime())) {
          date = new Date(); // 파싱 실패 시 현재 날짜 사용
        }
      } catch (e) {
        date = new Date(); // 파싱 실패 시 현재 날짜 사용
      }
      date.setHours(now.getHours());
      date.setMinutes(now.getMinutes());
      date.setSeconds(0);
      date.setMilliseconds(0);
      setSelectedDateTime(date);
    }
  }, [mealData, routeSelectedDateString]);

  // 날짜 선택 모달 열기
  const handleDatePress = () => {
    const currentDateTime = new Date(selectedDateTime);
    setTempDateTime(new Date(currentDateTime));
    setDateTimeMode('date');
    setShowDateTimeModal(true);
  };

  // 시간 선택 모달 열기
  const handleTimePress = () => {
    let newTempDateTime: Date;
    
    if (isEditMode && mealData?.createdAt) {
      // 수정 모드: 원래 식단의 시간으로 시작
      const mealDate = mealData.mealDate ? new Date(mealData.mealDate) : new Date();
      const createdDate = new Date(mealData.createdAt);
      newTempDateTime = new Date(mealDate);
      newTempDateTime.setHours(createdDate.getHours());
      newTempDateTime.setMinutes(createdDate.getMinutes());
      newTempDateTime.setSeconds(0);
      newTempDateTime.setMilliseconds(0);
      console.log('시간 선택 모달 열기 (수정 모드):', {
        원래_시간: createdDate.toLocaleTimeString('ko-KR'),
        tempDateTime: newTempDateTime.toLocaleString('ko-KR')
      });
    } else {
      // 추가 모드: 현재 시간으로 시작
      const now = new Date();
      const currentDate = new Date(selectedDateTime);
      newTempDateTime = new Date(currentDate);
      newTempDateTime.setHours(now.getHours());
      newTempDateTime.setMinutes(now.getMinutes());
      newTempDateTime.setSeconds(0);
      newTempDateTime.setMilliseconds(0);
      console.log('시간 선택 모달 열기 (추가 모드):', {
        현재_시간: now.toLocaleTimeString('ko-KR'),
        tempDateTime: newTempDateTime.toLocaleString('ko-KR')
      });
    }
    
    setTempDateTime(newTempDateTime);
    setDateTimeMode('time');
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
        // 날짜만 변경하고 시간은 기존 시간 유지
        const newDate = new Date(date);
        const currentTime = new Date(tempDateTime);
        newDate.setHours(currentTime.getHours());
        newDate.setMinutes(currentTime.getMinutes());
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
        const currentTime = new Date(tempDateTime);
        newDate.setHours(currentTime.getHours());
        newDate.setMinutes(currentTime.getMinutes());
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
    console.log('onChangeTime 호출:', { event, time, tempDateTime });
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
      // iOS - 시간이 변경될 때마다 tempDateTime 업데이트
      if (time) {
        console.log('iOS 시간 변경:', {
          기존_tempDateTime: tempDateTime.toLocaleString('ko-KR'),
          선택된_time: time.toLocaleString('ko-KR'),
          time_시간: `${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`
        });
        // tempDateTime의 날짜는 유지하고 시간만 업데이트
        const newDate = new Date(tempDateTime);
        const selectedTime = new Date(time);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        console.log('업데이트할 newDate:', newDate.toLocaleString('ko-KR'));
        // 새로운 Date 객체를 생성하여 React가 변경을 감지하도록 함
        setTempDateTime(new Date(newDate.getTime()));
        // iOS에서는 확인 버튼을 눌러야 적용
      } else {
        console.warn('iOS onChangeTime: time 파라미터가 없음', { event, time });
      }
      if (event.type === 'dismissed') {
        setShowDateTimeModal(false);
      }
    }
  };

  // 모달에서 확인 버튼 클릭
  const handleDateTimeConfirm = () => {
    // tempDateTime의 날짜와 시간을 모두 적용
    const finalDate = new Date(tempDateTime);
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);
    setSelectedDateTime(finalDate);
    // tempDateTime도 업데이트하여 다음에 모달을 열 때 올바른 값으로 시작
    setTempDateTime(finalDate);
    setShowDateTimeModal(false);
  };

  // 모달에서 취소 버튼 클릭
  const handleDateTimeCancel = () => {
    // tempDateTime을 selectedDateTime으로 리셋
    setTempDateTime(new Date(selectedDateTime));
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

  // 현재 입력 중인 음식의 영양소 합계 (메모이제이션으로 성능 최적화)
  const currentMealCalories = useMemo(() => 
    foods.reduce((sum, food) => sum + food.calories, 0), 
    [foods]
  );
  const currentMealCarbs = useMemo(() => 
    foods.reduce((sum, food) => sum + food.carbs, 0), 
    [foods]
  );
  const currentMealProtein = useMemo(() => 
    foods.reduce((sum, food) => sum + food.protein, 0), 
    [foods]
  );
  const currentMealFat = useMemo(() => 
    foods.reduce((sum, food) => sum + food.fat, 0), 
    [foods]
  );

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
      // food_id 전달 (검색 또는 직접 입력에서 받은 음식 ID)
      id: food.id || undefined,
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
        
        // food_id 전달 (검색 또는 직접 입력에서 받은 음식 ID)
        if (food.id !== undefined && food.id !== null && food.id > 0) {
          foodData.id = food.id;
        }
        
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
      
      // 선택된 날짜와 시간을 ISO 8601 형식으로 변환
      const timeTaken = selectedDateTime.toISOString();
      
      // 최종 요청 데이터 구성 (API 스펙 순서대로, undefined 필드 제거)
      const mealRequestData: any = {
        mealDate: mealDateString,
        mealType: mealType,
        foods: validatedFoods,
        timeTaken: timeTaken, // 사용자가 선택한 시간 전달
      };
      
      // memo가 비어있지 않으면 추가 (길이 제한, 빈 문자열은 제외)
      const trimmedMemo = mealName?.trim() || '';
      if (trimmedMemo.length > 0) {
        // 수정 모드이고 원본 memo에 " - "가 포함되어 있으면 추천 식단 형식 유지
        if (isEditMode && mealData?.memo && mealData.memo.includes(' - ')) {
          const parts = mealData.memo.split(' - ');
          const originalPlanName = parts[0]; // 원본 플랜 이름
          mealRequestData.memo = `${originalPlanName} - ${trimmedMemo.length > 500 ? trimmedMemo.substring(0, 500) : trimmedMemo}`;
        } else {
          mealRequestData.memo = trimmedMemo.length > 500 ? trimmedMemo.substring(0, 500) : trimmedMemo;
        }
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

      // 수정 모드 확인 로그
      console.log('🔍 저장 시점 수정 모드 확인:', {
        isEditMode,
        mealDataExists: !!mealData,
        mealDataId: mealData?.id,
        mealData: mealData ? {
          id: mealData.id,
          mealType: mealData.mealType,
          mealDate: mealData.mealDate,
          foodsCount: mealData.foods?.length,
        } : null,
      });

      if (isEditMode && mealData?.id) {
        // 수정 모드: 기존 식단 삭제 후 새로 추가하는 방식
        console.log('🔄 ========== 식단 수정 모드 시작 ==========');
        console.log('📋 수정할 식단 정보:', {
          mealId: mealData.id,
          mealType: mealData.mealType,
          mealDate: mealData.mealDate,
          foodsCount: mealData.foods?.length || 0,
        });
        console.log('📋 새로 저장할 식단 정보:', {
          mealType: mealType,
          mealDate: mealDateString,
          foodsCount: validatedFoods.length,
        });
        
        // Step 1: 기존 식단 삭제 (성공 확인 필수)
        let deleteSuccess = false;
        try {
          console.log(`🗑️ 기존 식단 삭제 시작: meal_id=${mealData.id}`);
          const deleteResult = await mealAPI.deleteMeal(mealData.id);
          deleteSuccess = deleteResult.success === true;
          console.log('✅ 기존 식사 삭제 완료:', mealData.id, '결과:', deleteResult);
          
          if (!deleteSuccess) {
            throw new Error('삭제 응답이 성공이 아닙니다.');
          }
        } catch (deleteError: any) {
          console.error('❌ 기존 식사 삭제 실패:', deleteError);
          console.error('삭제 에러 상세:', {
            status: deleteError.status,
            message: deleteError.message,
            error: deleteError,
          });
          
          // 404 에러는 이미 삭제된 것으로 간주하고 계속 진행
          if (deleteError.status === 404 || deleteError.message?.includes('404')) {
            console.log('⚠️ 식단이 이미 삭제되었거나 존재하지 않음, 계속 진행');
            deleteSuccess = true; // 404는 삭제 성공으로 간주
          } else {
            // 다른 에러는 사용자에게 알리고 중단
            const deleteErrorMessage = deleteError.message || '기존 식단 삭제에 실패했습니다.';
            console.error('❌ 삭제 실패로 인한 중단:', deleteErrorMessage);
            Alert.alert('오류', `식단 수정에 실패했습니다.\n${deleteErrorMessage}`);
            setLoading(false);
            return; // 삭제 실패 시 중단
          }
        }
        
        // 삭제가 성공하지 않았으면 중단
        if (!deleteSuccess) {
          console.error('❌ 삭제 성공하지 않음, 중단');
          Alert.alert('오류', '기존 식단 삭제에 실패했습니다. 수정을 취소합니다.');
          setLoading(false);
          return;
        }
        
        // 삭제 성공 후 약간의 지연 (서버 동기화 대기)
        console.log('⏳ 서버 동기화 대기 중... (300ms)');
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('✅ 서버 동기화 완료');
        
        // Step 2: 새로 추가 (일반 추가와 동일한 로직)
        try {
          console.log('➕ 새 식단 추가 시작...');
          await mealAPI.addMeal(cleanMealRequestData as AddMealRequest);
          console.log('✅ 식단 수정 완료 (삭제 후 추가)');
          
          // 수정 모드: 하트 표시된(좋아요한) 음식들만 피드백 API 호출
          const userId = await AsyncStorage.getItem('userId');
          if (userId && likedFoods.size > 0) {
            try {
              // likedFoods에 있는 음식 ID들만 API 호출 (하트 표시된 것만)
              const feedbackPromises = Array.from(likedFoods)
                .filter(foodId => {
                  const food = foods.find(f => f.id === foodId);
                  return food && food.id > 0; // 유효한 음식만 필터링
                })
                .map(async (foodId) => {
                  const food = foods.find(f => f.id === foodId);
                  if (!food) return;
                  
                  // 하트 표시된 음식만 API 호출
                  return mealAPI.submitFoodFeedback({
                    user_id: userId,
                    food_id: food.id,
                    food_name: food.name,
                    feedback: "like",
                  });
                });
              
              await Promise.all(feedbackPromises);
              console.log('✅ 수정 모드 - 좋아요 피드백 전송 완료 (하트 표시된 음식만):', likedFoods.size, '개');
            } catch (feedbackError: any) {
              console.error('⚠️ 수정 모드 - 좋아요 피드백 전송 실패:', feedbackError);
              // 피드백 실패해도 식단 저장은 계속 진행
            }
          } else {
            console.log('ℹ️ 수정 모드 - 하트 표시된 음식이 없어 피드백 API를 호출하지 않습니다.');
          }
          
          // 저장 후 GET으로 최신 데이터 불러오기
          try {
            console.log('📥 저장 후 최신 식단 데이터 불러오기:', mealDate);
            await mealAPI.getDailyMeals(mealDate);
            console.log('✅ 최신 식단 데이터 불러오기 완료');
          } catch (error) {
            console.error('❌ 최신 식단 데이터 불러오기 실패:', error);
          }

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
        } catch (addError: any) {
          // 추가 실패 시 에러 처리
          console.error('❌ 식단 추가 실패 (수정 모드):', addError);
          throw addError; // 외부 catch 블록에서 처리
        }
      } else {
        // 추가 모드
        await mealAPI.addMeal(cleanMealRequestData as AddMealRequest);
        
        // 추가 모드: 하트 표시된(좋아요한) 음식들만 피드백 API 호출
        const userId = await AsyncStorage.getItem('userId');
        if (userId && likedFoods.size > 0) {
          try {
            // likedFoods에 있는 음식 ID들만 API 호출 (하트 표시된 것만)
            const feedbackPromises = Array.from(likedFoods)
              .filter(foodId => {
                const food = foods.find(f => f.id === foodId);
                return food && food.id > 0; // 유효한 음식만 필터링
              })
              .map(async (foodId) => {
                const food = foods.find(f => f.id === foodId);
                if (!food) return;
                
                // 하트 표시된 음식만 API 호출
                return mealAPI.submitFoodFeedback({
                  user_id: userId,
                  food_id: food.id,
                  food_name: food.name,
                  feedback: "like",
                });
              });
            
            await Promise.all(feedbackPromises);
            console.log('✅ 추가 모드 - 좋아요 피드백 전송 완료 (하트 표시된 음식만):', likedFoods.size, '개');
          } catch (feedbackError: any) {
            console.error('⚠️ 추가 모드 - 좋아요 피드백 전송 실패:', feedbackError);
            // 피드백 실패해도 식단 저장은 계속 진행
          }
        } else {
          console.log('ℹ️ 추가 모드 - 하트 표시된 음식이 없어 피드백 API를 호출하지 않습니다.');
        }
        
        // 저장 후 GET으로 최신 데이터 불러오기
        try {
          console.log('📥 저장 후 최신 식단 데이터 불러오기:', mealDate);
          await mealAPI.getDailyMeals(mealDate);
          console.log('✅ 최신 식단 데이터 불러오기 완료');
        } catch (error) {
          console.error('❌ 최신 식단 데이터 불러오기 실패:', error);
        }

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
      // 응답 형식: { "ai_result": [{ "food_id": 162608, "name": "...", "name_ko": "...", ... }] }
      // 다중 음식 감지 지원: ai_result는 배열로 여러 음식을 반환할 수 있음
      const detectedFoods: Food[] = [];
      
      if (response.ai_result) {
        const aiResults = Array.isArray(response.ai_result) 
          ? response.ai_result 
          : [response.ai_result];
        
        // 모든 음식을 처리
        aiResults.forEach((aiResult: any) => {
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
          // API 응답: name_ko (한국어), name (영어)
          const name = aiResult.name_ko || aiResult.name || '음식';
          
          // food_id 사용 (API 응답의 food_id 필드)
          const foodId = aiResult.food_id || aiResult.id || 0;
          
          const food: Food = {
            id: foodId, // food_id (검색/직접 입력과 동일하게 사용)
            name: name,
            calories: Math.max(0, calories),
            carbs: Math.max(0, carbs),
            protein: Math.max(0, protein),
            fat: Math.max(0, fat),
            weight: Math.max(1, weight), // weight는 최소 1
          };
          
          detectedFoods.push(food);
        });
        
        console.log(`사진 업로드로 변환된 음식 데이터 (${detectedFoods.length}개):`, detectedFoods);
        if (aiResults.length > 1) {
          console.log(`✅ 다중 음식 감지됨 (${aiResults.length}개), 모든 음식 추가됨`);
          console.log('감지된 모든 음식:', aiResults.map((r: any) => r.name_ko || r.name));
        }
      } else if (Array.isArray(response)) {
        // 배열인 경우 모든 음식 처리
        response.forEach((item: any) => {
          detectedFoods.push({
            id: item.id || 0, // food_id (없으면 0, 신규 음식으로 처리)
            name: item.name || '음식',
            calories: item.calories || 0,
            carbs: item.carbs || 0,
            protein: item.protein || 0,
            fat: item.fat || 0,
            weight: item.weight || 100,
          });
        });
      } else if (response.foods && Array.isArray(response.foods) && response.foods.length > 0) {
        // foods 배열이 있는 경우 모든 음식 처리
        response.foods.forEach((item: any) => {
          detectedFoods.push({
            id: item.id || 0, // food_id (없으면 0, 신규 음식으로 처리)
            name: item.name || item.foodName || '음식',
            calories: item.calories || 0,
            carbs: item.carbs || 0,
            protein: item.protein || 0,
            fat: item.fat || 0,
            weight: item.weight || item.servingSize || 100,
          });
        });
      } else if (response.name) {
        // 직접 음식 객체인 경우
        detectedFoods.push({
          id: response.id || 0, // food_id (없으면 0, 신규 음식으로 처리)
          name: response.name,
          calories: response.calories || 0,
          carbs: response.carbs || 0,
          protein: response.protein || 0,
          fat: response.fat || 0,
          weight: response.weight || response.servingSize || 100,
        });
      }

      if (detectedFoods.length > 0) {
        // 모든 감지된 음식을 상태에 추가
        setFoods(prev => [...prev, ...detectedFoods]);
        // Alert 제거 - UI 블로킹 방지, 음식이 추가된 것을 화면에서 확인 가능
      } else {
        // 에러는 나중에 표시
        setTimeout(() => {
          Alert.alert('알림', '음식 정보를 가져올 수 없습니다.');
        }, 100);
      }
    } catch (error: any) {
      console.error('사진 업로드 오류:', error);
      // 에러는 나중에 표시
      setTimeout(() => {
        Alert.alert('오류', error.message || '사진 업로드에 실패했습니다. 다시 시도해주세요.');
      }, 100);
    } finally {
      // 상태 업데이트를 즉시 처리
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

  // 음식 직접 입력 모달에서 저장 핸들러
  const handleFoodDirectInputSave = (foodData: {
    id?: number;
    name: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    weight: number;
  }) => {
    if (selectedFood && foodData.id === selectedFood.id) {
      // 기존 음식 수정
      const updatedFood: Food = {
        id: foodData.id || selectedFood.id,
        name: foodData.name,
        calories: foodData.calories,
        carbs: foodData.carbs,
        protein: foodData.protein,
        fat: foodData.fat,
        weight: foodData.weight,
      };
      handleFoodUpdate(updatedFood);
    } else {
      // 새 음식 추가 (이 경우는 없을 것 같지만 안전을 위해)
      const newFood: Food = {
        id: foodData.id || Date.now(),
        name: foodData.name,
        calories: foodData.calories,
        carbs: foodData.carbs,
        protein: foodData.protein,
        fat: foodData.fat,
        weight: foodData.weight,
      };
      setFoods(prev => [...prev, newFood]);
    }
    setIsFoodDirectInputModalOpen(false);
    setSelectedFood(null);
  };

  // 음식 삭제 핸들러
  const handleFoodDelete = (foodId: number) => {
    setFoods(prev => prev.filter(food => food.id !== foodId));
    // 좋아요 상태도 함께 제거
    setLikedFoods(prev => {
      const newSet = new Set(prev);
      newSet.delete(foodId);
      return newSet;
    });
  };

  // 정수 포맷팅 (소수점 제거)
  const formatInteger = (value: number): string => {
    return Math.round(value).toString();
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

        {/* 식단 카테고리 선택 */}
        <View style={styles.categorySection}>
          <TouchableOpacity 
            style={styles.categoryChip}
            onPress={handleMealTypePress}>
            <Text style={styles.chipText}>{getMealTypeDisplay(mealType)}</Text>
            <Icon name="chevron-down" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* 날짜 및 시간 */}
        <View style={styles.timeSection}>
          <TouchableOpacity 
            style={styles.timeChip}
            onPress={handleDatePress}>
            <Text style={styles.chipText}>{formatSelectedDateTime()}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.timeChip}
            onPress={handleTimePress}>
            <Text style={styles.chipText}>
              {selectedDateTime.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 칼로리 요약 */}
        <View style={styles.calorieSummary}>
          <View style={styles.calorieMain}>
            <Text style={styles.calorieNumber}>{formatInteger(totalCalories)}</Text>
            <Text style={styles.calorieUnit}>
              {' '}
              / {formatInteger(targetCalories)}kcal
            </Text>
          </View>
          <View style={styles.nutritionInline}>
            <View style={styles.nutritionInlineItem}>
              <Text style={styles.nutritionInlineLabel}>탄수화물</Text>
              <Text style={styles.nutritionInlineValue}>
                {formatInteger(totalCarbs)} / {formatInteger(targetCarbs)}g
              </Text>
            </View>
            <View style={styles.nutritionInlineItem}>
              <Text style={styles.nutritionInlineLabel}>단백질</Text>
              <Text style={styles.nutritionInlineValue}>
                {formatInteger(totalProtein)} / {formatInteger(targetProtein)}g
              </Text>
            </View>
            <View style={styles.nutritionInlineItem}>
              <Text style={styles.nutritionInlineLabel}>지방</Text>
              <Text style={styles.nutritionInlineValue}>{formatInteger(totalFat)} / {formatInteger(targetFat)}g</Text>
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
                setSelectedFood(food);
                setIsFoodDirectInputModalOpen(true);
              }}
              activeOpacity={0.7}>
              <View style={styles.foodItemContent}>
                <View style={styles.foodItemHeader}>
                  <View style={styles.foodNameContainer}>
                    <Text style={styles.foodName} numberOfLines={2}>{food.name}</Text>
                    <TouchableOpacity
                      style={styles.heartButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        const isLiked = likedFoods.has(food.id);
                        if (isLiked) {
                          setLikedFoods(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(food.id);
                            return newSet;
                          });
                        } else {
                          setLikedFoods(prev => new Set(prev).add(food.id));
                        }
                      }}
                      activeOpacity={0.7}>
                      <Icon 
                        name={likedFoods.has(food.id) ? "heart" : "heart-outline"} 
                        size={20} 
                        color={likedFoods.has(food.id) ? "#ff6b6b" : "#ffffff"} 
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.foodCaloriesContainer}>
                    <Text style={styles.foodCalories}>{Math.round(food.calories)}kcal</Text>
                    <TouchableOpacity
                      style={styles.foodDeleteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleFoodDelete(food.id);
                      }}
                      activeOpacity={0.7}>
                      <Icon name="trash-outline" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.foodNutrition}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>탄</Text>
                    <Text style={styles.nutritionValue}>{Math.floor(food.carbs)}g</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>단</Text>
                    <Text style={styles.nutritionValue}>{Math.floor(food.protein)}g</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>지</Text>
                    <Text style={styles.nutritionValue}>{Math.floor(food.fat)}g</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>중량</Text>
                    <Text style={styles.nutritionValue}>{food.weight}g</Text>
                  </View>
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

      <FoodDirectInputModal
        isOpen={isFoodDirectInputModalOpen}
        onClose={() => {
          setIsFoodDirectInputModalOpen(false);
          setSelectedFood(null);
        }}
        onSave={handleFoodDirectInputSave}
        initialFood={selectedFood ? {
          id: selectedFood.id,
          name: selectedFood.name,
          calories: selectedFood.calories,
          carbs: selectedFood.carbs,
          protein: selectedFood.protein,
          fat: selectedFood.fat,
          weight: selectedFood.weight,
        } : null}
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
              <Text style={styles.modalTitle}>
                {dateTimeMode === 'date' ? '날짜 선택' : '시간 선택'}
              </Text>
              <TouchableOpacity onPress={handleDateTimeConfirm}>
                <Text style={styles.modalConfirmText}>확인</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateTimePickerContainer}>
              {dateTimeMode === 'date' ? (
                <DateTimePicker
                  key={`date-${showDateTimeModal}-${tempDateTime.getTime()}`}
                  value={tempDateTime}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangeDate}
                  minimumDate={new Date(2020, 0, 1)}
                  maximumDate={new Date(2100, 11, 31)}
                  locale={Platform.OS === 'ios' ? 'ko_KR' : 'ko-KR'}
                  textColor={Platform.OS === 'ios' ? '#ffffff' : undefined}
                />
              ) : (
                <DateTimePicker
                  key={`time-${showDateTimeModal}-${tempDateTime.getTime()}`}
                  value={tempDateTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangeTime}
                  locale={Platform.OS === 'ios' ? 'ko_KR' : 'ko-KR'}
                  textColor={Platform.OS === 'ios' ? '#ffffff' : undefined}
                />
              )}
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
          <View style={styles.mealTypeModalContainer} onStartShouldSetResponder={() => true}>
            <Text style={styles.mealTypeModalTitle}>식단 카테고리를 선택해주세요</Text>
            <View style={styles.mealTypeGrid}>
              <TouchableOpacity
                style={[
                  styles.mealTypeGridItem,
                  mealType === 'BREAKFAST' && styles.mealTypeGridItemActive,
                ]}
                onPress={() => handleMealTypeSelect('BREAKFAST')}>
                <Text
                  style={[
                    styles.mealTypeGridText,
                    mealType === 'BREAKFAST' && styles.mealTypeGridTextActive,
                  ]}>
                  아침
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.mealTypeGridItem,
                  mealType === 'LUNCH' && styles.mealTypeGridItemActive,
                ]}
                onPress={() => handleMealTypeSelect('LUNCH')}>
                <Text
                  style={[
                    styles.mealTypeGridText,
                    mealType === 'LUNCH' && styles.mealTypeGridTextActive,
                  ]}>
                  점심
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.mealTypeGridItem,
                  mealType === 'DINNER' && styles.mealTypeGridItemActive,
                ]}
                onPress={() => handleMealTypeSelect('DINNER')}>
                <Text
                  style={[
                    styles.mealTypeGridText,
                    mealType === 'DINNER' && styles.mealTypeGridTextActive,
                  ]}>
                  저녁
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.mealTypeGridItem,
                  mealType === 'SNACK' && styles.mealTypeGridItemActive,
                ]}
                onPress={() => handleMealTypeSelect('SNACK')}>
                <Text
                  style={[
                    styles.mealTypeGridText,
                    mealType === 'SNACK' && styles.mealTypeGridTextActive,
                  ]}>
                  야식
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.mealTypeGridItem,
                  mealType === 'OTHER' && styles.mealTypeGridItemActive,
                ]}
                onPress={() => handleMealTypeSelect('OTHER')}>
                <Text
                  style={[
                    styles.mealTypeGridText,
                    mealType === 'OTHER' && styles.mealTypeGridTextActive,
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
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  categoryChip: {
    backgroundColor: '#393a38',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingVertical: 10,
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
  calorieMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 15,
  },
  calorieNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 22,
  },
  calorieUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: '#ffffff',
    lineHeight: 13,
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
  },
  foodItem: {
    backgroundColor: '#393a38',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  foodItemContent: {
    flex: 1,
    minWidth: 0,
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  foodCaloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foodDeleteButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
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
  mealTypeModalContainer: {
    backgroundColor: '#252525',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '60%',
  },
  mealTypeModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'space-between',
  },
  mealTypeGridItem: {
    backgroundColor: '#393a38',
    borderRadius: 10,
    width: '47%',
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTypeGridItemActive: {
    backgroundColor: '#e3ff7c',
  },
  mealTypeGridText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  mealTypeGridTextActive: {
    color: '#000000',
  },
  foodNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    lineHeight: 18,
  },
  heartButton: {
    padding: 4,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  foodCalories: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'right',
    flexShrink: 0,
    lineHeight: 18,
  },
  foodNutrition: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  nutritionItem: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 12,
  },
  nutritionValue: {
    fontSize: 10,
    fontWeight: '400',
    color: '#ffffff',
    lineHeight: 12,
  },
  addFoodButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  addFoodButton: {
    width: '100%',
    backgroundColor: '#e3ff7c',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addFoodButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteMealButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  deleteMealButton: {
    width: '100%',
    backgroundColor: '#d9d9d9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteMealButtonText: {
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



