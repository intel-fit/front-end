import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {authAPI} from '../../services';

const healthGoalOptions = [
  {label: '벌크업', value: 'BULK'},
  {label: '다이어트', value: 'DIET'},
  {label: '린매스업', value: 'LEAN_MASS'},
  {label: '유지', value: 'MAINTENANCE'},
  {label: '유연성 향상', value: 'FLEXIBILITY'},
  {label: '체력증진', value: 'ENDURANCE'},
  {label: '자세 교정', value: 'POSTURE'},
  {label: '기타', value: 'OTHER'},
];

const workoutDaysOptions = [
  {label: '주 1회', value: '1일'},
  {label: '주 2회', value: '2일'},
  {label: '주 3회', value: '3일'},
  {label: '주 3-4회', value: '3-4일'},
  {label: '주 4회', value: '4일'},
  {label: '주 5회', value: '5일'},
  {label: '주 6회', value: '6일'},
  {label: '주 7회', value: '7일'},
];

const experienceLevelOptions = [
  {label: '초보자', value: 'BEGINNER'},
  {label: '중급자', value: 'INTERMEDIATE'},
  {label: '고급자', value: 'ADVANCED'},
];

const KakaoOnboardingScreen = ({navigation}: any) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    gender: '' as 'M' | 'F' | '',
    height: '',
    weight: '',
    weightGoal: '',
    healthGoal: '',
    workoutDaysPerWeek: '',
    experienceLevel: '',
    fitnessConcerns: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [tempPickerValue, setTempPickerValue] = useState({year: '', month: '', day: ''});
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [workoutDaysModalVisible, setWorkoutDaysModalVisible] = useState(false);
  const [healthGoalModalVisible, setHealthGoalModalVisible] = useState(false);
  const [experienceLevelModalVisible, setExperienceLevelModalVisible] = useState(false);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({...prev, [name]: value}));
    if (errors[name]) {
      setErrors((prev: any) => ({...prev, [name]: ''}));
    }
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 100; i--) {
      years.push(i);
    }
    return years;
  };

  const generateMonthOptions = () => {
    return Array.from({length: 12}, (_, i) => i + 1);
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.birthYear || !formData.birthMonth || !formData.birthDay) {
      newErrors.birth = '생년월일을 선택해주세요';
    }

    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }

    if (!formData.height.trim()) {
      newErrors.height = '키를 입력해주세요';
    } else {
      const heightNum = Number(formData.height);
      if (heightNum < 100 || heightNum > 250) {
        newErrors.height = '키는 100cm 이상 250cm 이하여야 합니다';
    }
    }

    if (!formData.weight.trim()) {
      newErrors.weight = '체중을 입력해주세요';
    } else {
      const weightNum = Number(formData.weight);
      if (weightNum < 30 || weightNum > 200) {
        newErrors.weight = '체중은 30kg 이상 200kg 이하여야 합니다';
      }
    }

    if (!formData.weightGoal.trim()) {
      newErrors.weightGoal = '목표 체중을 입력해주세요';
    } else {
      const weightGoalNum = Number(formData.weightGoal);
      if (weightGoalNum < 30 || weightGoalNum > 200) {
        newErrors.weightGoal = '목표 체중은 30kg 이상 200kg 이하여야 합니다';
    }
    }

    if (!formData.healthGoal) {
      newErrors.healthGoal = '헬스 목적을 선택해주세요';
    }

    if (!formData.workoutDaysPerWeek) {
      newErrors.workoutDaysPerWeek = '주간 운동 횟수를 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const birthDate = `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`;
      
      // 유연성향상, 체력증진, 자세교정은 "MAINTENANCE"로 변환
      const healthGoalValue = ['FLEXIBILITY', 'ENDURANCE', 'POSTURE'].includes(formData.healthGoal)
        ? 'MAINTENANCE'
        : formData.healthGoal;
      
      const onboardingData = {
        birthDate,
        agreePrivacy: true,
        agreeTerms: true,
        gender: formData.gender as "M" | "F",
        height: Number(formData.height),
        weight: Number(formData.weight),
        weightGoal: Number(formData.weightGoal),
        healthGoal: healthGoalValue,
        workoutDaysPerWeek: formData.workoutDaysPerWeek,
      };

      const response = await authAPI.submitOnboarding(onboardingData);

      setLoading(false);
      
      // 200 응답 (온보딩 완료) → Alert 없이 바로 홈으로 이동
      // response.success가 false여도 200 응답이면 성공으로 처리
      setTimeout(() => {
        navigation.replace('Main');
      }, 100);
      return;
    } catch (error: any) {
      console.error('온보딩 제출 실패:', error);
      setLoading(false);
      
      // 400 에러 (이미 온보딩 완료됨) → Alert 없이 홈으로 이동
      if (error.status === 400) {
        setTimeout(() => {
          navigation.replace('Main');
        }, 100);
        return;
      }
      
      // 401 에러 (인증 필요) → 로그인 화면으로 이동
      if (error.status === 401) {
        navigation.replace('Login');
        return;
      }
      
      // 기타 에러만 Alert 표시
      Alert.alert('오류', error.message || '신체정보 저장에 실패했습니다.');
    }
  };

  return (
      <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>신체정보를 입력해주세요</Text>
          <Text style={styles.subtitle}>맞춤형 서비스를 제공하기 위해 필요합니다</Text>
        </View>

        <View style={styles.form}>
          {/* 생년월일 */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.birthDateButtonContainer}
              onPress={() => {
                const currentYear = new Date().getFullYear();
                const defaultYear = formData.birthYear || String(currentYear - 20);
                const defaultMonth = formData.birthMonth || '1';
                const defaultDay = formData.birthDay || '1';
                
                setTempPickerValue({
                  year: defaultYear,
                  month: defaultMonth,
                  day: defaultDay,
                });
                setPickerModalVisible(true);
              }}>
              <TextInput
                style={styles.input}
                value={
                  formData.birthYear && formData.birthMonth && formData.birthDay
                    ? `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`
                    : ''
                }
                placeholder="생년월일"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>
            {errors.birth && (
              <Text style={styles.errorMessage}>{errors.birth}</Text>
            )}
          </View>

          {/* 생년월일 선택 모달 */}
          <Modal
            visible={pickerModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setPickerModalVisible(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setPickerModalVisible(false)}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {}}
                style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setPickerModalVisible(false)}>
                    <Text style={styles.modalCancelText}>취소</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>생년월일 선택</Text>
                  <TouchableOpacity
                    onPress={() => {
                      handleChange('birthYear', tempPickerValue.year);
                      handleChange('birthMonth', tempPickerValue.month);
                      handleChange('birthDay', tempPickerValue.day);
                      setPickerModalVisible(false);
                    }}>
                    <Text style={styles.modalConfirmText}>확인</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.birthPickerGroup}>
                  <View style={styles.birthPickerItem}>
                    <Text style={styles.birthPickerLabelTop}>년</Text>
                    <Picker
                      selectedValue={tempPickerValue.year}
                      onValueChange={value => {
                        const newValue = {...tempPickerValue, year: value};
                        if (newValue.year && newValue.month) {
                          const daysInMonth = new Date(
                            Number(newValue.year),
                            Number(newValue.month),
                            0
                          ).getDate();
                          const currentDay = Number(newValue.day) || 1;
                          if (currentDay > daysInMonth) {
                            newValue.day = '1';
                          }
                        }
                        setTempPickerValue(newValue);
                      }}
                      style={styles.modalPicker}
                      itemStyle={styles.pickerItemStyle}>
                      {generateYearOptions().map(year => (
                        <Picker.Item key={year} label={String(year)} value={String(year)} />
                      ))}
                    </Picker>
                  </View>
                  <View style={styles.birthPickerItem}>
                    <Text style={styles.birthPickerLabelTop}>월</Text>
                    <Picker
                      selectedValue={tempPickerValue.month}
                      onValueChange={value => {
                        const newValue = {...tempPickerValue, month: value};
                        if (newValue.year && newValue.month) {
                          const daysInMonth = new Date(
                            Number(newValue.year),
                            Number(newValue.month),
                            0
                          ).getDate();
                          const currentDay = Number(newValue.day) || 1;
                          if (currentDay > daysInMonth) {
                            newValue.day = '1';
                          }
                        }
                        setTempPickerValue(newValue);
                      }}
                      style={styles.modalPicker}
                      itemStyle={styles.pickerItemStyle}>
                      {generateMonthOptions().map(month => (
                        <Picker.Item
                          key={month}
                          label={String(month).padStart(2, '0')}
                          value={String(month)}
                        />
                      ))}
                    </Picker>
                  </View>
                  <View style={styles.birthPickerItem}>
                    <Text style={styles.birthPickerLabelTop}>일</Text>
                    <Picker
                      selectedValue={tempPickerValue.day}
                      onValueChange={value => {
                        setTempPickerValue({...tempPickerValue, day: value});
                      }}
                      style={styles.modalPicker}
                      itemStyle={styles.pickerItemStyle}>
                      {(() => {
                        if (tempPickerValue.year && tempPickerValue.month) {
                          const year = Number(tempPickerValue.year);
                          const month = Number(tempPickerValue.month);
                          const daysInMonth = new Date(year, month, 0).getDate();
                          const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
                          
                          const currentDay = Number(tempPickerValue.day) || 1;
                          if (currentDay > daysInMonth) {
                            setTimeout(() => {
                              setTempPickerValue({...tempPickerValue, day: '1'});
                            }, 0);
                          }
                          
                          return days;
                        }
                        return Array.from({length: 31}, (_, i) => i + 1);
                      })().map(day => (
                        <Picker.Item
                          key={day}
                          label={String(day).padStart(2, '0')}
                          value={String(day)}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* 성별 */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.birthDateButtonContainer}
              onPress={() => setGenderModalVisible(true)}>
              <TextInput
                style={styles.input}
                value={formData.gender === 'M' ? '남성' : formData.gender === 'F' ? '여성' : ''}
                placeholder="성별"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>
            {errors.gender && (
              <Text style={styles.errorMessage}>{errors.gender}</Text>
            )}
          </View>

          {/* 성별 선택 모달 */}
          <Modal
            visible={genderModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setGenderModalVisible(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setGenderModalVisible(false)}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {}}
                style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setGenderModalVisible(false)}>
                    <Text style={styles.modalCancelText}>취소</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>성별 선택</Text>
                  <View style={{width: 50}} />
                </View>
                <View style={styles.genderOptionContainer}>
              <TouchableOpacity
                style={[
                      styles.genderOption,
                      formData.gender === 'M' && styles.genderOptionSelected,
                ]}
                    onPress={() => {
                      handleChange('gender', 'M');
                      setGenderModalVisible(false);
                    }}>
                <Text
                  style={[
                        styles.genderOptionText,
                        formData.gender === 'M' && styles.genderOptionTextSelected,
                  ]}>
                  남성
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                      styles.genderOption,
                      formData.gender === 'F' && styles.genderOptionSelected,
                ]}
                    onPress={() => {
                      handleChange('gender', 'F');
                      setGenderModalVisible(false);
                    }}>
                <Text
                  style={[
                        styles.genderOptionText,
                        formData.gender === 'F' && styles.genderOptionTextSelected,
                  ]}>
                  여성
                </Text>
              </TouchableOpacity>
            </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* 키, 체중 */}
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputHalf]}>
            <TextInput
              style={styles.input}
                placeholder="키 (cm)"
              value={formData.height}
                onChangeText={text => handleChange('height', text)}
                keyboardType="number-pad"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
              />
              {errors.height && (
                <Text style={styles.errorMessage}>{errors.height}</Text>
              )}
          </View>

            <View style={[styles.inputGroup, styles.inputHalf]}>
            <TextInput
              style={styles.input}
                placeholder="체중 (kg)"
              value={formData.weight}
                onChangeText={text => handleChange('weight', text)}
                keyboardType="number-pad"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
              />
              {errors.weight && (
                <Text style={styles.errorMessage}>{errors.weight}</Text>
              )}
            </View>
          </View>

          {/* 목표 체중 */}
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="목표 체중 (kg)"
              value={formData.weightGoal}
              onChangeText={text => handleChange('weightGoal', text)}
              keyboardType="number-pad"
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
            />
            {errors.weightGoal && (
              <Text style={styles.errorMessage}>{errors.weightGoal}</Text>
            )}
          </View>

          {/* 헬스 목적 */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.birthDateButtonContainer}
              onPress={() => setHealthGoalModalVisible(true)}>
            <TextInput
              style={styles.input}
                value={
                  formData.healthGoal
                    ? healthGoalOptions.find(opt => opt.value === formData.healthGoal)?.label || ''
                    : ''
                }
                placeholder="헬스 목적"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>
            {errors.healthGoal && (
              <Text style={styles.errorMessage}>{errors.healthGoal}</Text>
            )}
          </View>

          {/* 헬스 목적 선택 모달 */}
          <Modal
            visible={healthGoalModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setHealthGoalModalVisible(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setHealthGoalModalVisible(false)}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {}}
                style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setHealthGoalModalVisible(false)}>
                    <Text style={styles.modalCancelText}>취소</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>헬스 목적 선택</Text>
                  <View style={{width: 50}} />
                </View>
                <View style={styles.modalOptionContainer}>
                  <View style={styles.optionGrid}>
                    {healthGoalOptions.map((option) => (
                <TouchableOpacity
                        key={option.value}
                  style={[
                    styles.optionButton,
                          formData.healthGoal === option.value && styles.optionButtonSelected,
                  ]}
                        onPress={() => {
                          handleChange('healthGoal', option.value);
                          setHealthGoalModalVisible(false);
                        }}>
                  <Text
                    style={[
                            styles.optionButtonText,
                            formData.healthGoal === option.value && styles.optionButtonTextSelected,
                    ]}>
                          {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* 주간 운동 횟수 */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.birthDateButtonContainer}
              onPress={() => setWorkoutDaysModalVisible(true)}>
              <TextInput
                style={styles.input}
                value={
                  formData.workoutDaysPerWeek
                    ? workoutDaysOptions.find(opt => opt.value === formData.workoutDaysPerWeek)?.label || ''
                    : ''
                }
                placeholder="주간 운동 횟수"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>
            {errors.workoutDaysPerWeek && (
              <Text style={styles.errorMessage}>{errors.workoutDaysPerWeek}</Text>
            )}
          </View>

          {/* 주간 운동 횟수 선택 모달 */}
          <Modal
            visible={workoutDaysModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setWorkoutDaysModalVisible(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setWorkoutDaysModalVisible(false)}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {}}
                style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setWorkoutDaysModalVisible(false)}>
                    <Text style={styles.modalCancelText}>취소</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>주간 운동 횟수 선택</Text>
                  <View style={{width: 50}} />
                </View>
                <View style={styles.modalOptionContainer}>
                  <View style={styles.optionGrid}>
                    {workoutDaysOptions.map((option) => (
                <TouchableOpacity
                        key={option.value}
                  style={[
                    styles.optionButton,
                          formData.workoutDaysPerWeek === option.value && styles.optionButtonSelected,
                  ]}
                        onPress={() => {
                          handleChange('workoutDaysPerWeek', option.value);
                          setWorkoutDaysModalVisible(false);
                        }}>
                  <Text
                    style={[
                            styles.optionButtonText,
                            formData.workoutDaysPerWeek === option.value && styles.optionButtonTextSelected,
                    ]}>
                          {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* 운동 경험 수준 (선택) */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.birthDateButtonContainer}
              onPress={() => setExperienceLevelModalVisible(true)}>
              <TextInput
                style={styles.input}
                value={
                  formData.experienceLevel
                    ? experienceLevelOptions.find(opt => opt.value === formData.experienceLevel)?.label || ''
                    : ''
                }
                placeholder="운동 경험 수준 (선택)"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                editable={false}
                pointerEvents="none"
              />
            </TouchableOpacity>
          </View>

          {/* 운동 경험 수준 선택 모달 */}
          <Modal
            visible={experienceLevelModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setExperienceLevelModalVisible(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setExperienceLevelModalVisible(false)}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {}}
                style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setExperienceLevelModalVisible(false)}>
                    <Text style={styles.modalCancelText}>취소</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>운동 경험 수준 선택</Text>
                  <View style={{width: 50}} />
                </View>
                <View style={styles.modalOptionContainer}>
                  <View style={styles.optionGrid}>
                    {experienceLevelOptions.map((option) => (
                <TouchableOpacity
                        key={option.value}
                  style={[
                    styles.optionButton,
                          formData.experienceLevel === option.value && styles.optionButtonSelected,
                  ]}
                        onPress={() => {
                          handleChange('experienceLevel', option.value);
                          setExperienceLevelModalVisible(false);
                        }}>
                  <Text
                    style={[
                            styles.optionButtonText,
                            formData.experienceLevel === option.value && styles.optionButtonTextSelected,
                    ]}>
                          {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* 헬스 고민 (선택) */}
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="헬스 고민 (선택)"
              value={formData.fitnessConcerns}
              onChangeText={text => handleChange('fitnessConcerns', text)}
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              multiline
            />
          </View>
          </View>

          <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.submitBtnText}>완료</Text>
          )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  form: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  input: {
    width: '100%',
    height: 60,
    backgroundColor: '#434343',
    borderWidth: 0,
    borderRadius: 20,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '400',
    color: '#ffffff',
  },
  birthDateButtonContainer: {
    width: '100%',
  },
  errorMessage: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 5,
    marginLeft: 5,
  },
  submitBtn: {
    width: '100%',
    height: 60,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#252525',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#434343',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCancelText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  birthPickerGroup: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  birthPickerItem: {
    flex: 1,
    alignItems: 'center',
  },
  birthPickerLabelTop: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  modalPicker: {
    width: '100%',
    height: 150,
  },
  pickerItemStyle: {
    color: '#ffffff',
  },
  genderOptionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  genderOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#434343',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: '#ffffff',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#ffffff',
  },
  genderOptionTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  modalOptionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#434343',
    borderRadius: 12,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#ffffff',
  },
  optionButtonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  optionButtonTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
});

export default KakaoOnboardingScreen;

