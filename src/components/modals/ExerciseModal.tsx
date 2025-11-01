import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import {Ionicons as Icon} from '@expo/vector-icons';
import {colors} from '../../theme/colors';

interface Set {
  id: number;
  weight: number;
  reps: number;
  completed: boolean;
}

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'add' | 'edit';
  exerciseData?: any;
  onSave?: (sets: Set[], exerciseName: string) => void;
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({
  isOpen,
  onClose,
  mode = 'add',
  exerciseData,
  onSave,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [currentMode, setCurrentMode] = useState(mode);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [sets, setSets] = useState<Set[]>([
    {id: 1, weight: 20, reps: 15, completed: false},
    {id: 2, weight: 20, reps: 12, completed: false},
    {id: 3, weight: 20, reps: 12, completed: false},
  ]);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'add') {
        setCurrentMode('add');
        setSelectedExercise(null);
        setSearchTerm('');
        setSelectedCategory('전체');
        setSets([
          {id: 1, weight: 20, reps: 15, completed: false},
          {id: 2, weight: 20, reps: 12, completed: false},
          {id: 3, weight: 20, reps: 12, completed: false},
        ]);
      } else if (mode === 'edit') {
        setCurrentMode('detail');
        setSelectedExercise(exerciseData);
        if (exerciseData?.sets && exerciseData.sets.length > 0) {
          setSets(exerciseData.sets);
        } else {
          setSets([
            {id: 1, weight: 20, reps: 15, completed: false},
            {id: 2, weight: 20, reps: 12, completed: false},
            {id: 3, weight: 20, reps: 12, completed: false},
          ]);
        }
      }
    } else {
      // 모달이 닫힐 때 초기화
      setCurrentMode('add');
      setSelectedExercise(null);
      setSearchTerm('');
      setSelectedCategory('전체');
    }
  }, [isOpen, mode, exerciseData]);

  const categories = ['전체', '가슴', '등', '하체', '어깨', '팔', '코어'];

  const exercises = [
    {name: '스텝밀 (천국의계단)', category: '하체', lastUsed: '2시간 전'},
    {name: '리버스 펙 덱 플라이', category: '가슴', lastUsed: '4일 전'},
    {name: '시티드 로우 머신', category: '등', lastUsed: '4일 전'},
    {name: '풀다운 머신', category: '등', lastUsed: '4일 전'},
    {name: '펙 덱 플라이', category: '가슴', lastUsed: '4일 전'},
  ];

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === '전체' || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSetChange = (setId: number, field: string, value: number) => {
    setSets(prev =>
      prev.map(set => (set.id === setId ? {...set, [field]: value} : set)),
    );
  };

  const handleSetComplete = (setId: number) => {
    setSets(prev =>
      prev.map(set =>
        set.id === setId ? {...set, completed: !set.completed} : set,
      ),
    );
  };

  const handleAddSet = () => {
    const newSet = {
      id: sets.length + 1,
      weight: 20,
      reps: 12,
      completed: false,
    };
    setSets(prev => [...prev, newSet]);
  };

  const handleRemoveSet = (setId: number) => {
    if (sets.length > 1) {
      setSets(prev => {
        const filtered = prev.filter(set => set.id !== setId);
        return filtered.map((set, index) => ({
          ...set,
          id: index + 1,
        }));
      });
    }
  };

  const handleExerciseSelect = (exercise: any) => {
    setSelectedExercise(exercise);
    setCurrentMode('detail');
    setSets([
      {id: 1, weight: 20, reps: 15, completed: false},
      {id: 2, weight: 20, reps: 12, completed: false},
      {id: 3, weight: 20, reps: 12, completed: false},
    ]);
  };

  const handleSave = () => {
    // detail 모드에서만 저장 가능 (운동이 선택된 상태)
    if (currentMode !== 'detail') {
      return;
    }
    if (onSave && (selectedExercise || exerciseData)) {
      onSave(
        sets,
        selectedExercise?.name || exerciseData?.name || '운동',
      );
    }
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {currentMode === 'add' ? (
            <View style={styles.addExerciseModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>종목 추가</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Icon name="close" size={12} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                  <Icon name="search" size={20} color="#666666" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="종목 이름을 검색하세요."
                    placeholderTextColor="#666666"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterContainer}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterBtn,
                      selectedCategory === category && styles.filterBtnActive,
                    ]}
                    onPress={() => setSelectedCategory(category)}>
                    <Text
                      style={[
                        styles.filterBtnText,
                        selectedCategory === category &&
                          styles.filterBtnTextActive,
                      ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView style={styles.exerciseList}>
                {filteredExercises.map((exercise, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.exerciseItem}
                    onPress={() => handleExerciseSelect(exercise)}>
                    <View style={styles.exerciseIcon}>
                      <Text style={{fontSize: 16}}>🏋️</Text>
                    </View>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseLastUsed}>
                        {exercise.lastUsed}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.exerciseDetailModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedExercise?.name || exerciseData?.name || '운동'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Icon name="close" size={12} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.setsContainer}>
                <View style={styles.setsHeader}>
                  <TouchableOpacity
                    onPress={() =>
                      handleRemoveSet(sets[sets.length - 1]?.id || 1)
                    }
                    style={styles.setControlBtn}>
                    <Text style={styles.setControlText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.setsHeaderText}>세트</Text>
                  <TouchableOpacity
                    onPress={handleAddSet}
                    style={styles.setControlBtn}>
                    <Text style={styles.setControlText}>+</Text>
                  </TouchableOpacity>
                  <Text style={styles.setsHeaderText}>추천 세트</Text>
                  <View style={{width: 40}} />
                </View>

                {sets.map(set => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setNumber}>{set.id}</Text>
                    <View style={styles.weightInput}>
                      <TextInput
                        style={styles.weightInputText}
                        value={set.weight.toString()}
                        onChangeText={text =>
                          handleSetChange(set.id, 'weight', parseInt(text) || 0)
                        }
                        keyboardType="numeric"
                      />
                      <Text style={styles.unitText}>kg</Text>
                    </View>
                    <Text style={styles.repsDisplay}>{set.reps}회</Text>
                    <TouchableOpacity
                      style={[
                        styles.completeBtn,
                        set.completed && styles.completeBtnCompleted,
                      ]}
                      onPress={() => handleSetComplete(set.id)}>
                      <Icon
                        name="checkmark"
                        size={16}
                        color={set.completed ? '#000000' : '#666666'}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.saveExerciseBtn}
                onPress={handleSave}>
                <Text style={styles.saveExerciseBtnText}>운동 저장</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '74%',
    minHeight: '50%',
  },
  addExerciseModal: {
    flex: 1,
    maxHeight: '100%',
  },
  exerciseDetailModal: {
    flex: 1,
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    padding: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#404040',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#404040',
    marginRight: 8,
  },
  filterBtnActive: {
    backgroundColor: '#404040',
    borderColor: '#666666',
  },
  filterBtnText: {
    color: '#ffffff',
    fontSize: 12,
  },
  filterBtnTextActive: {
    color: '#ffffff',
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: 400,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  exerciseIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 14,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 4,
  },
  exerciseLastUsed: {
    fontSize: 12,
    color: '#666666',
  },
  setsContainer: {
    padding: 20,
    maxHeight: '48%',
  },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    marginBottom: 8,
    gap: 12,
  },
  setControlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#404040',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setControlText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  setsHeaderText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    gap: 12,
  },
  setNumber: {
    width: 40,
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  weightInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#404040',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  weightInputText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'right',
    minWidth: 60,
  },
  unitText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  repsDisplay: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
  },
  completeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#404040',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeBtnCompleted: {
    backgroundColor: '#e3ff7c',
  },
  saveExerciseBtn: {
    backgroundColor: '#e3ff7c',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveExerciseBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExerciseModal;

