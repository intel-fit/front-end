import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import {colors} from '../theme/colors';

const FoodAddOptionsScreen = ({navigation}: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>음식 추가</Text>
        <View style={{width: 28}} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => navigation.navigate('FoodSearch')}>
          <View style={styles.optionIcon}>
            <Icon name="search" size={32} color={colors.primary} />
          </View>
          <Text style={styles.optionTitle}>음식 검색</Text>
          <Text style={styles.optionDescription}>
            음식 이름으로 검색하여 추가
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => navigation.navigate('MealAdd')}>
          <View style={styles.optionIcon}>
            <Icon name="camera" size={32} color={colors.secondary} />
          </View>
          <Text style={styles.optionTitle}>사진으로 추가</Text>
          <Text style={styles.optionDescription}>
            음식 사진을 찍어서 자동 인식
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard}>
          <View style={styles.optionIcon}>
            <Icon name="barcode" size={32} color={colors.warning} />
          </View>
          <Text style={styles.optionTitle}>바코드 스캔</Text>
          <Text style={styles.optionDescription}>
            제품 바코드를 스캔하여 추가
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 20,
  },
  optionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  optionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.grayDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default FoodAddOptionsScreen;

