import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {Ionicons as Icon} from '@expo/vector-icons';
import {colors} from '../theme/colors';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResult(true);
    }, 2000);
  };

  const handleClose = () => {
    setShowResult(false);
    onClose();
  };

  const analysisResult = {
    overall: 'good',
    score: 85,
    insights: [
      {
        category: '체중 관리',
        status: 'good',
        message: '목표 체중을 향해 꾸준히 진행 중입니다',
        detail: '지난 한 달간 0.5kg 감량에 성공했습니다',
      },
      {
        category: '근육량 증가',
        status: 'excellent',
        message: '근육량이 이상적으로 증가하고 있습니다',
        detail: '근육량이 0.3kg 증가했습니다',
      },
      {
        category: '체지방률',
        status: 'warning',
        message: '체지방률 관리가 필요합니다',
        detail: '목표 대비 1.5% 높은 수준입니다',
      },
    ],
    recommendations: [
      '주 3-4회 근력 운동을 유지하세요',
      '단백질 섭취를 하루 120g으로 늘려보세요',
      '유산소 운동 시간을 주 150분으로 늘려보세요',
    ],
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>AI 분석</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body}>
            {!showResult ? (
              <View style={styles.analysisStart}>
                <Text style={styles.icon}>🤖</Text>
                <Text style={styles.startTitle}>AI 기반 InBody 분석</Text>
                <Text style={styles.description}>
                  최근 InBody 검사 결과를 AI가 분석하여{'\n'}맞춤형 피드백을
                  제공합니다
                </Text>

                {isAnalyzing ? (
                  <View style={styles.analyzing}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.analyzingText}>분석 중...</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.startBtn}
                    onPress={handleAnalyze}>
                    <Text style={styles.startBtnText}>분석 시작하기</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.result}>
                <View style={styles.scoreSection}>
                  <View style={styles.scoreCircle}>
                    <Text style={styles.scoreValue}>
                      {analysisResult.score}
                    </Text>
                    <Text style={styles.scoreLabel}>점</Text>
                  </View>
                  <Text style={styles.scoreStatus}>
                    전반적으로 좋은 상태입니다
                  </Text>
                </View>

                <View style={styles.insightsSection}>
                  <Text style={styles.sectionTitle}>분석 결과</Text>
                  {analysisResult.insights.map((insight, index) => (
                    <View key={index} style={styles.insightItem}>
                      <View style={styles.insightHeader}>
                        <Text style={styles.insightCategory}>
                          {insight.category}
                        </Text>
                        {insight.status === 'excellent' && (
                          <Icon
                            name="checkmark-circle"
                            size={20}
                            color={colors.success}
                          />
                        )}
                        {insight.status === 'good' && (
                          <Icon
                            name="trending-up"
                            size={20}
                            color={colors.primary}
                          />
                        )}
                        {insight.status === 'warning' && (
                          <Icon
                            name="alert-circle"
                            size={20}
                            color={colors.warning}
                          />
                        )}
                      </View>
                      <Text style={styles.insightMessage}>
                        {insight.message}
                      </Text>
                      <Text style={styles.insightDetail}>{insight.detail}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.recommendationsSection}>
                  <Text style={styles.sectionTitle}>AI 추천 사항</Text>
                  {analysisResult.recommendations.map((rec, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.recommendationText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
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
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  analysisStart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  startTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  analyzing: {
    alignItems: 'center',
    gap: 16,
  },
  analyzingText: {
    fontSize: 16,
    color: colors.textLight,
  },
  startBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  startBtnText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  result: {
    gap: 24,
  },
  scoreSection: {
    alignItems: 'center',
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.white,
  },
  scoreLabel: {
    fontSize: 16,
    color: colors.white,
  },
  scoreStatus: {
    fontSize: 16,
    color: colors.text,
  },
  insightsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  insightItem: {
    backgroundColor: colors.grayLight,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  insightMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  insightDetail: {
    fontSize: 12,
    color: colors.textLight,
  },
  recommendationsSection: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});

export default AIAnalysisModal;

