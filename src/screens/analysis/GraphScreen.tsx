import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Path, Circle, Line, Text as SvgText, G} from 'react-native-svg';
import {Ionicons as Icon} from '@expo/vector-icons';

const GraphScreen = ({navigation}: any) => {
  const [selectedFilter, setSelectedFilter] = useState('체중');
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null,
  );
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // 그래프 데이터
  const data = [
    {x: '04/01', y: 49.2},
    {x: '04/06', y: 52.1},
    {x: '04/19', y: 50.4},
    {x: '04/25', y: 48.9},
    {x: '05/02', y: 47.8},
    {x: '05/04', y: 51.4},
  ];

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.min(screenWidth - 40, 400);
  const padding = {top: 20, right: 28, bottom: 26, left: 42};
  const width = chartWidth;
  const height = 210;
  const yTicks = [54, 52, 50, 48, 46];
  const baseline = 46;
  const smoothness = 0.22;

  // 마지막 포인트 인덱스
  const lastPointIndex = data.length - 1;

  const minY = Math.min(baseline, ...data.map(d => d.y));
  const maxY = Math.max(...yTicks, ...data.map(d => d.y));
  const iw = width - padding.left - padding.right;
  const ih = height - padding.top - padding.bottom;
  const scaleX = (i: number) => padding.left + (iw * i) / (data.length - 1);
  const scaleY = (v: number) =>
    padding.top + ih * (1 - (v - minY) / (maxY - minY));

  // 부드러운 곡선 경로 생성
  const pathSmooth = (points: {x: number; y: number}[], k = 0.22) => {
    if (points.length < 2) return '';
    const cps = (
      p0: {x: number; y: number},
      p1: {x: number; y: number},
      p2: {x: number; y: number},
      t: number,
    ) => ({
      x: p1.x + (p2.x - p0.x) * t,
      y: p1.y + (p2.y - p0.y) * t,
    });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] ?? points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      const c1 = cps(p0, p1, p2, k);
      const c2 = cps(p1, p2, p3, -k);
      d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const points = useMemo(
    () => data.map((d, i) => ({x: scaleX(i), y: scaleY(d.y)})),
    [data],
  );

  const pathData = useMemo(() => pathSmooth(points, smoothness), [points]);

  const handleInBodyClick = () => {
    navigation.navigate('InBody');
  };

  const filterMessages: {[key: string]: {tag: string; text: string; detail: string}} = {
    체중: {
      tag: '체중 조절',
      text: '적정 체중 | 50.0kg',
      detail: '-1.4kg의 체중 감량이 필요합니다',
    },
    체지방량: {
      tag: '지방량 조절',
      text: '적정 체지방량 | 12.5kg',
      detail: '-0.8kg의 체지방 감량이 필요합니다',
    },
    골격근량: {
      tag: '근육량 조절',
      text: '적정 근육량 | 25.0kg',
      detail: '+2.1kg의 근육량 증가가 필요합니다',
    },
  };

  const currentMessage = filterMessages[selectedFilter];

  // 컴포넌트 마운트 시 마지막 포인트를 활성화
  React.useEffect(() => {
    if (points.length > 0) {
      const lastPoint = points[lastPointIndex];
      setSelectedPointIndex(lastPointIndex);
      // 툴팁 위치를 퍼센트로 계산 (반응형 대응)
      setTooltipPosition({
        x: (lastPoint.x / width) * 100,
        y: ((lastPoint.y - 30) / height) * 100,
      });
    }
  }, [points.length]);

  const handlePointPress = (index: number, event: any) => {
    setSelectedPointIndex(index);
    const point = points[index];
    // 툴팁 위치를 퍼센트로 계산 (반응형 대응)
    setTooltipPosition({
      x: (point.x / width) * 100,
      y: ((point.y - 30) / height) * 100,
    });
  };

  // 외부 클릭 시 툴팁 닫기
  const handleChartHostPress = () => {
    if (selectedPointIndex !== lastPointIndex) {
      setSelectedPointIndex(null);
      setTooltipPosition(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>인바디 정보</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}>
        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <TouchableOpacity style={styles.tab} onPress={handleInBodyClick}>
            <Text style={styles.tabText}>인바디 정보</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={[styles.tabText, styles.tabTextActive]}>그래프</Text>
            <View style={styles.tabIndicator} />
          </TouchableOpacity>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              selectedFilter === '체중' && styles.filterBtnActive,
            ]}
            onPress={() => setSelectedFilter('체중')}>
            <Text
              style={[
                styles.filterBtnText,
                selectedFilter === '체중' && styles.filterBtnTextActive,
              ]}>
              체중
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              selectedFilter === '체지방량' && styles.filterBtnActive,
            ]}
            onPress={() => setSelectedFilter('체지방량')}>
            <Text
              style={[
                styles.filterBtnText,
                selectedFilter === '체지방량' && styles.filterBtnTextActive,
              ]}>
              체지방량
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              selectedFilter === '골격근량' && styles.filterBtnActive,
            ]}
            onPress={() => setSelectedFilter('골격근량')}>
            <Text
              style={[
                styles.filterBtnText,
                selectedFilter === '골격근량' && styles.filterBtnTextActive,
              ]}>
              골격근량
            </Text>
          </TouchableOpacity>
        </View>

        {/* 사용자 메시지 */}
        <View style={styles.userMessage}>
          <Text style={styles.userMessageText}>
            <Text style={styles.highlightName}>유정님</Text>, 지난주보다 체중이
            1.2% 감소했어요!{'\n'}목표치가 얼마 안 남았어요 👍
          </Text>
        </View>

        {/* 그래프 섹션 */}
        <View style={styles.graphSection}>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>체중 변화</Text>
            <TouchableOpacity
              style={styles.chartHost}
              activeOpacity={1}
              onPress={handleChartHostPress}>
              <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={styles.svg}>
                {/* Y축 라벨 */}
                {yTicks.map(t => (
                  <React.Fragment key={t}>
                    <SvgText
                      x={6}
                      y={scaleY(t) + 3}
                      fontSize={10}
                      fill="#bdbdbd"
                      fontFamily="System">
                      {t.toFixed(1)}kg
                    </SvgText>
                    {/* baseline만 점선 */}
                    {t === baseline && (
                      <Line
                        x1={padding.left}
                        x2={width - padding.right}
                        y1={scaleY(baseline)}
                        y2={scaleY(baseline)}
                        stroke="#8f8f8f55"
                        strokeDasharray="6 6"
                      />
                    )}
                  </React.Fragment>
                ))}

                {/* X축 라벨 */}
                {data.map((d, i) => (
                  <SvgText
                    key={i}
                    x={scaleX(i)}
                    y={height - 6}
                    fontSize={10}
                    fill="#bdbdbd"
                    fontFamily="System"
                    textAnchor="middle">
                    {d.x}
                  </SvgText>
                ))}

                {/* 라인 경로 */}
                <Path
                  d={pathData}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={2}
                />

                {/* 포인트(원) - 그룹으로 묶어서 터치 가능하게 */}
                <G>
                  {points.map((point, i) => {
                    const isActive =
                      i === lastPointIndex || selectedPointIndex === i;
                    return (
                      <React.Fragment key={i}>
                        {/* Glow 효과 (마지막 포인트 또는 선택된 포인트) */}
                        {isActive && (
                          <>
                            <Circle
                              cx={point.x}
                              cy={point.y}
                              r={7}
                              fill="#daff50"
                              opacity={0.3}
                            />
                            <Circle
                              cx={point.x}
                              cy={point.y}
                              r={6}
                              fill="#daff50"
                              opacity={0.4}
                            />
                          </>
                        )}
                        <Circle
                          cx={point.x}
                          cy={point.y}
                          r={5}
                          fill="#0e0e0e"
                          stroke="#daff50"
                          strokeWidth={2}
                          onPress={() => handlePointPress(i, null)}
                        />
                      </React.Fragment>
                    );
                  })}
                </G>
              </Svg>
              
              {/* 툴팁 */}
              {tooltipPosition && selectedPointIndex !== null && (
                <View
                  style={[
                    styles.tooltip,
                    {
                      left: `${tooltipPosition.x}%`,
                      top: `${tooltipPosition.y}%`,
                      transform: [{translateX: -25}, {translateY: 0}],
                    },
                  ]}>
                  <Text style={styles.tooltipText}>
                    {data[selectedPointIndex].y.toFixed(1)}kg
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 체중 조절 섹션 */}
        <View style={styles.weightControlSection}>
          <View style={styles.weightControlTag}>
            <Text style={styles.weightControlTagText}>{currentMessage.tag}</Text>
          </View>
          <View style={styles.weightControlContent}>
            <View style={styles.trainerAvatar}>
              <Text style={styles.trainerAvatarText}>👨‍💼</Text>
            </View>
            <View style={styles.weightInfo}>
              <Text style={styles.weightText}>{currentMessage.text}</Text>
              <Text style={styles.weightDetail}>{currentMessage.detail}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  tabNavigation: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 14.4,
    color: '#aaaaaa',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 80,
    height: 2,
    backgroundColor: '#daff50',
    alignSelf: 'center',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  filterBtn: {
    flex: 1,
    backgroundColor: '#333333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    alignItems: 'center',
    minWidth: 0,
  },
  filterBtnActive: {
    backgroundColor: '#daff50',
  },
  filterBtnText: {
    fontSize: 14.4,
    color: '#aaaaaa',
  },
  filterBtnTextActive: {
    color: '#1c1c1c',
  },
  userMessage: {
    marginBottom: 24,
  },
  userMessageText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ffffff',
  },
  highlightName: {
    color: '#daff50',
    fontWeight: '600',
  },
  graphSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  chartContainer: {
    maxWidth: 420,
    width: '100%',
  },
  chartTitle: {
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 2,
    fontSize: 14,
    color: '#cfcfcf',
  },
  chartHost: {
    position: 'relative',
    width: '100%',
    aspectRatio: 400 / 210,
  },
  svg: {
    width: '100%',
    height: 'auto',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#d6ff4b',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  tooltipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0b0b0b',
  },
  weightControlSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  weightControlTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  weightControlTagText: {
    fontSize: 12.8,
    fontWeight: '500',
    color: '#ffffff',
  },
  weightControlContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  trainerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#666666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trainerAvatarText: {
    fontSize: 28.8,
  },
  weightInfo: {
    flex: 1,
    gap: 8,
  },
  weightText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  weightDetail: {
    fontSize: 14.4,
    color: '#cccccc',
  },
});

export default GraphScreen;
