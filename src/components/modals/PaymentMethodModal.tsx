import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {Ionicons as Icon} from '@expo/vector-icons';
import {colors} from '../theme/colors';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
  });

  const paymentMethods = [
    {
      id: 1,
      cardType: '신한카드',
      lastFourDigits: '1234',
      expiryDate: '12/25',
      isDefault: true,
    },
    {
      id: 2,
      cardType: '국민카드',
      lastFourDigits: '5678',
      expiryDate: '08/26',
      isDefault: false,
    },
  ];

  const handleAddCard = () => {
    Alert.alert('결제 수단 추가', '결제 수단이 추가되었습니다!');
    setShowAddForm(false);
    setNewCard({cardNumber: '', expiryDate: '', cvc: '', cardholderName: ''});
  };

  const handleDeleteCard = (id: number) => {
    Alert.alert('삭제', '이 결제 수단을 삭제하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          Alert.alert('삭제 완료', '결제 수단이 삭제되었습니다.');
        },
      },
    ]);
  };

  const handleSetDefault = (id: number) => {
    Alert.alert('기본 설정', '기본 결제 수단이 변경되었습니다.');
  };

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const groups = numbers.match(/.{1,4}/g);
    return groups ? groups.join(' ') : numbers;
  };

  const formatExpiryDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return numbers.slice(0, 2) + '/' + numbers.slice(2, 4);
    }
    return numbers;
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>결제 수단 관리</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>등록된 결제 수단</Text>
              {paymentMethods.length === 0 ? (
                <Text style={styles.emptyText}>등록된 결제 수단이 없습니다</Text>
              ) : (
                <View style={styles.methodsList}>
                  {paymentMethods.map(method => (
                    <View key={method.id} style={styles.methodItem}>
                      <View style={styles.methodInfo}>
                        <Icon name="card" size={32} color="#4ade80" />
                        <View style={{flex: 1}}>
                          <View style={styles.methodHeader}>
                            <Text style={styles.cardType}>{method.cardType}</Text>
                            {method.isDefault && (
                              <View style={styles.defaultBadge}>
                                <Text style={styles.defaultBadgeText}>기본</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.cardNumber}>
                            **** **** **** {method.lastFourDigits}
                          </Text>
                          <Text style={styles.cardExpiry}>
                            유효기간: {method.expiryDate}
                          </Text>
                        </View>
                      </View>
                      {!method.isDefault && (
                        <View style={styles.methodActions}>
                          <TouchableOpacity
                            style={styles.defaultBtn}
                            onPress={() => handleSetDefault(method.id)}>
                            <Icon name="checkmark-circle" size={14} color="#4ade80" />
                            <Text style={styles.defaultBtnText}>기본으로 설정</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAddForm(!showAddForm)}>
                <Icon name="add-circle" size={20} color="#4ade80" />
                <Text style={styles.addBtnText}>새 결제 수단 추가</Text>
              </TouchableOpacity>
            </View>

            {showAddForm && (
              <View style={styles.addForm}>
                <Text style={styles.formTitle}>카드 정보 입력</Text>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>카드 번호</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor="#999999"
                    value={newCard.cardNumber}
                    onChangeText={text =>
                      setNewCard({
                        ...newCard,
                        cardNumber: formatCardNumber(text),
                      })
                    }
                    maxLength={19}
                  />
                </View>
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, {flex: 1}]}>
                    <Text style={styles.label}>유효기간</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="MM/YY"
                      placeholderTextColor="#999999"
                      value={newCard.expiryDate}
                      onChangeText={text =>
                        setNewCard({
                          ...newCard,
                          expiryDate: formatExpiryDate(text),
                        })
                      }
                      maxLength={5}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.formGroup, {flex: 1}]}>
                    <Text style={styles.label}>CVC</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      placeholderTextColor="#999999"
                      value={newCard.cvc}
                      onChangeText={text =>
                        setNewCard({
                          ...newCard,
                          cvc: text.replace(/\D/g, ''),
                        })
                      }
                      maxLength={3}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>카드 소유자명</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="홍길동"
                      placeholderTextColor="#999999"
                      value={newCard.cardholderName}
                      onChangeText={text =>
                        setNewCard({...newCard, cardholderName: text})
                      }
                    />
                </View>
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowAddForm(false)}>
                    <Text style={styles.cancelBtnText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitBtn} onPress={handleAddCard}>
                    <Text style={styles.submitBtnText}>추가하기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 안내 사항 */}
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentInfoTitle}>💳 안전한 결제</Text>
              <View style={styles.paymentInfoList}>
                <Text style={styles.paymentInfoItem}>
                  • 모든 결제 정보는 암호화되어 안전하게 저장됩니다
                </Text>
                <Text style={styles.paymentInfoItem}>
                  • PCI-DSS 인증을 받은 결제 시스템을 사용합니다
                </Text>
                <Text style={styles.paymentInfoItem}>
                  • 카드 정보는 절대 외부에 공유되지 않습니다
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
    flexShrink: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  body: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  emptyText: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  methodsList: {
    gap: 12,
    marginBottom: 12,
  },
  methodItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 10,
    padding: 14,
  },
  methodInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  defaultBadge: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '600',
  },
  cardNumber: {
    fontSize: 13,
    color: '#cccccc',
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: 11,
    color: '#999999',
  },
  methodActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addBtn: {
    width: '100%',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#555555',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBtnText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
  },
  addForm: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#cccccc',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#404040',
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 6,
    padding: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#ffffff',
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#404040',
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    padding: 10,
    backgroundColor: '#4ade80',
    borderRadius: 6,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentInfo: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderWidth: 1,
    borderColor: '#4ade80',
    borderRadius: 10,
    padding: 14,
  },
  paymentInfoTitle: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  paymentInfoList: {
    gap: 6,
  },
  paymentInfoItem: {
    color: '#cccccc',
    fontSize: 12,
    lineHeight: 18,
  },
  defaultBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#4ade80',
    borderRadius: 6,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  defaultBtnText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default PaymentMethodModal;

