import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import InBodyManualForm from '../../components/common/InBodyManualForm';

const InBodyManualScreen = ({navigation, route}: any) => {
  const handleSubmit = (data: any) => {
    console.log('인바디 수기 입력 저장:', data);
    Alert.alert('저장 완료', '인바디 정보가 저장되었습니다.', [
      {
        text: '확인',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>인바디 수기 입력</Text>
        <View style={{width: 28}} />
      </View>
      <InBodyManualForm onSubmit={handleSubmit} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default InBodyManualScreen;

