import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {colors} from '../../theme/colors';
import FoodAddOptionsModal from '../../components/modals/FoodAddOptionsModal';

interface Food {
  id: number;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  weight: number;
}

const MealAddScreen = ({navigation}: any) => {
  const [mealName, setMealName] = useState('');
  const [mealTime] = useState('today, 20:38');
  const [mealType] = useState('저녁');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isFoodOptionsModalOpen, setIsFoodOptionsModalOpen] = useState(false);
  const [foods, setFoods] = useState<Food[]>([
    {
      id: 1,
      name: '엽기 떡복이',
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
    },
    {
      id: 2,
      name: '엽기 떡복이',
      calories: 3289,
      carbs: 198,
      protein: 132,
      fat: 149,
      weight: 81,
    },
  ]);

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

  const handleSave = () => {
    console.log('식단 저장:', {mealName, mealTime, mealType, photos, foods});
    navigation.goBack();
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

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>식단 추가하기</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Icon name="checkmark" size={28} color="#ffffff" />
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
          <View style={styles.timeChip}>
            <Text style={styles.chipText}>{mealTime}</Text>
          </View>
          <View style={styles.mealTypeChip}>
            <Text style={styles.chipText}>{mealType}</Text>
          </View>
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
        <TouchableOpacity
          style={styles.addFoodButton}
          onPress={handleAddFood}>
          <Text style={styles.addFoodButtonText}>음식 추가하기</Text>
        </TouchableOpacity>
      </ScrollView>

      <FoodAddOptionsModal
        isOpen={isFoodOptionsModalOpen}
        onClose={() => setIsFoodOptionsModalOpen(false)}
        onPhotoOption={handlePhotoOption}
        onSearchOption={handleSearchOption}
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
  addFoodButton: {
    width: '100%',
    marginHorizontal: 20,
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

