import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";

interface InBodyCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  inBodyDates?: string[]; // 인바디 입력된 날짜 목록 (YYYY-MM-DD 형식), 빈 배열이면 모든 날짜 선택 가능
}

const InBodyCalendarModal: React.FC<InBodyCalendarModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  selectedDate,
  inBodyDates = [], // 기본값: 빈 배열 (모든 날짜 선택 가능)
}) => {
  // 유효한 날짜인지 확인
  const validSelectedDate = selectedDate && !isNaN(selectedDate.getTime()) 
    ? selectedDate 
    : new Date();
    
  const [currentMonth, setCurrentMonth] = useState(
    new Date(validSelectedDate.getFullYear(), validSelectedDate.getMonth(), 1)
  );

  // 인바디 입력된 날짜를 Set으로 변환 (빠른 검색을 위해)
  const inBodyDatesSet = useMemo(() => {
    return new Set(inBodyDates || []);
  }, [inBodyDates]);

  // 달력 데이터 생성
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // 주의 첫 번째 날

    const days: (Date | null)[] = [];
    const current = new Date(startDate);

    // 6주 * 7일 = 42일
    for (let i = 0; i < 42; i++) {
      if (current.getMonth() === month && current.getFullYear() === year) {
        days.push(new Date(current));
      } else {
        days.push(null);
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth]);

  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  const goToPrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleDateSelect = (date: Date) => {
    onSelectDate(date);
    onClose();
  };

  const formatDateKey = (date: Date): string => {
    // 점(.) 형식으로 반환 (API 응답 형식과 일치)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const hasInBodyData = (date: Date): boolean => {
    return inBodyDatesSet.has(formatDateKey(date));
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={styles.modalContent}
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.monthButton}>
              <Icon name="chevron-back" size={20} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
              <Icon name="chevron-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* 요일 헤더 */}
          <View style={styles.weekDaysContainer}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.weekDay}>
                <Text
                  style={[
                    styles.weekDayText,
                    index === 0 && styles.sundayText,
                    index === 6 && styles.saturdayText,
                  ]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* 달력 그리드 */}
          <View style={styles.calendarGrid}>
            {calendarData.map((date, index) => {
              if (!date) {
                return <View key={index} style={styles.dayCell} />;
              }

              const dateKey = formatDateKey(date);
              const isSelected = isSameDay(date, validSelectedDate);
              const isInBodyDate = hasInBodyData(date);
              const isTodayDate = isToday(date);

              // 날짜 목록이 비어있으면 모든 날짜 선택 가능 (수기 입력 모드)
              const isSelectable = inBodyDates.length === 0 || isInBodyDate;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.dayCell}
                  onPress={() => {
                    if (isSelectable) {
                      handleDateSelect(date);
                    }
                  }}
                  disabled={!isSelectable}
                  activeOpacity={isSelectable ? 0.7 : 1}
                >
                  <View
                    style={[
                      styles.dayContent,
                      isSelected && styles.selectedDay,
                      isTodayDate && !isSelected && styles.todayDay,
                      !isSelectable && styles.disabledDay,
                    ]}
                  >
                    {isInBodyDate && (
                      <View style={styles.inBodyIndicator} />
                    )}
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        isTodayDate && !isSelected && styles.todayDayText,
                        date.getMonth() !== currentMonth.getMonth() &&
                          styles.otherMonthText,
                        !isSelectable && styles.disabledDayText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 닫기 버튼 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 20,
    width: Dimensions.get("window").width * 0.9,
    maxWidth: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  weekDaysContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    color: "#aaaaaa",
    fontWeight: "500",
  },
  sundayText: {
    color: "#ff4444",
  },
  saturdayText: {
    color: "#4444ff",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 4,
  },
  dayContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    position: "relative",
  },
  selectedDay: {
    backgroundColor: "#d6ff4b",
  },
  todayDay: {
    borderWidth: 1,
    borderColor: "#d6ff4b",
  },
  inBodyIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ade80",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  dayText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "400",
  },
  selectedDayText: {
    color: "#000000",
    fontWeight: "700",
  },
  todayDayText: {
    color: "#d6ff4b",
    fontWeight: "600",
  },
  otherMonthText: {
    color: "#666666",
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: "#666666",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: "#333333",
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default InBodyCalendarModal;

