import React, { useMemo, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Keyboard,
  Platform,
  InputAccessoryView,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import InBodyCalendarModal from "./InBodyCalendarModal";

interface InBodyManualFormProps {
  onSubmit: (data: any) => void;
  defaultValues?: Partial<{
    date: string;
    gender: string;
    age: string;
    height: string;
    weight: string;
    smm: string;
    muscleMass: string;
    bfm: string;
    pbf: string;
    score: string;
    vfa: string;
    bmr: string;
    rArm: string;
    lArm: string;
    trunk: string;
    rLeg: string;
    lLeg: string;
    rArmFat: string;
    lArmFat: string;
    trunkFat: string;
    rLegFat: string;
    lLegFat: string;
    tbw: string;
    protein: string;
    mineral: string;
    pbfStd: string;
    obesityDegree: string;
    ecw: string;
    wtCtrl: string;
    fatCtrl: string;
    musCtrl: string;
  }>;
  inBodyDates?: string[];
}

// iOS 숫자패드 상단에 표시될 액세서리 뷰의 고유 ID
const ACCESSORY_ID = "doneAccessory";

const InBodyManualForm: React.FC<InBodyManualFormProps> = ({
  onSubmit,
  defaultValues,
  inBodyDates,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const ageInputRef = useRef<TextInput>(null);
  const ageTextRef = useRef<string>("");
  const inputRefs = useRef<{ [key: string]: TextInput | null }>({});

  // 날짜를 YYYY-MM-DD 형식으로 자동 포맷팅
  const formatDate = (text: string): string => {
    // 숫자만 추출
    const numbers = text.replace(/[^0-9]/g, "");

    // 길이에 따라 자동으로 하이픈 추가
    if (numbers.length <= 4) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    } else {
      return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(
        6,
        8
      )}`;
    }
  };

  // 키보드가 올라올 때 입력 필드가 보이도록 스크롤
  const handleInputFocus = (key: string) => {
    // measureLayout 대신 간단한 스크롤 사용
    setTimeout(() => {
      if (inputRefs.current[key]) {
        // 입력 필드가 하단에 있을 가능성이 높으므로 하단으로 스크롤
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    }, 300);
  };

  const [v, setV] = useState({
    date: new Date().toISOString().slice(0, 10),
    gender: "female",
    age: "",
    height: "",
    weight: "",
    smm: "",
    muscleMass: "",
    bfm: "",
    pbf: "",
    score: "",
    vfa: "",
    bmr: "",
    rArm: "",
    lArm: "",
    trunk: "",
    rLeg: "",
    lLeg: "",
    rArmFat: "",
    lArmFat: "",
    trunkFat: "",
    rLegFat: "",
    lLegFat: "",
    tbw: "",
    protein: "",
    mineral: "",
    pbfStd: "",
    obesityDegree: "",
    ecw: "",
    wtCtrl: "",
    fatCtrl: "",
    musCtrl: "",
  });

  const [calendarVisible, setCalendarVisible] = useState(false);

  // apply defaults on mount/update
  React.useEffect(() => {
    if (defaultValues && typeof defaultValues === "object") {
      setV((s) => ({ ...s, ...(defaultValues as any) }));
      if (typeof defaultValues.age === "string") {
        ageTextRef.current = defaultValues.age;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultValues ?? {})]);

  const handle = useCallback((k: string, value: string) => {
    setV((s) => ({ ...s, [k]: value }));
  }, []);

  // 달력에서 날짜 선택 핸들러
  const handleDateSelect = (selectedDate: Date) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    handle("date", dateStr);
    setCalendarVisible(false);
  };

  const bmi = useMemo(() => {
    const h = parseFloat(v.height);
    const w = parseFloat(v.weight);
    if (!h || !w) return "";
    const m = h / 100;
    return (w / (m * m)).toFixed(1);
  }, [v.height, v.weight]);

  const handleSubmit = () => {
    const payload = {
      ...v,
      age: ageTextRef.current,
      bmi,
    };
    onSubmit?.(payload);
  };

  const fixedBottomPadding = 400; // 키보드 가림 방지를 위해 증가

  // iOS 숫자패드 상단의 '완료' 버튼을 포함하는 InputAccessoryView
  const DoneBar =
    Platform.OS === "ios" ? (
      <InputAccessoryView nativeID={ACCESSORY_ID}>
        <View style={styles.bar}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => Keyboard.dismiss()}>
            <Text style={styles.barBtn}>완료</Text>
          </TouchableOpacity>
        </View>
      </InputAccessoryView>
    ) : null;

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        style={styles.wrap}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: fixedBottomPadding }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 기본 정보 */}
        <View style={styles.sec}>
          {/* 검사일 - 달력 선택 */}
          <View style={styles.field}>
            <Text style={styles.lab}>검사일</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setCalendarVisible(true)}
            >
              <Text style={styles.datePickerText}>
                {v.date ? v.date.replace(/-/g, ".") : "날짜 선택"}
              </Text>
              <Icon name="calendar-outline" size={20} color="#d6ff4b" />
            </TouchableOpacity>
          </View>

          {/* 성별 */}
          <View style={styles.field}>
            <Text style={styles.lab}>성별</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setV((s) => ({ ...s, gender: "male" }))}
              >
                <View
                  style={[
                    styles.radioCircle,
                    v.gender === "male" && styles.radioSelected,
                  ]}
                />
                <Text style={styles.radioText}>남성</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setV((s) => ({ ...s, gender: "female" }))}
              >
                <View
                  style={[
                    styles.radioCircle,
                    v.gender === "female" && styles.radioSelected,
                  ]}
                />
                <Text style={styles.radioText}>여성</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 나이 (비제어) */}
          <View style={styles.field}>
            <Text style={styles.lab}>나이</Text>
            <View style={styles.unitBox}>
              <TextInput
                ref={ageInputRef}
                style={styles.inpRight}
                defaultValue={v.age}
                onChangeText={(text) => {
                  ageTextRef.current = text;
                }}
                keyboardType="number-pad"
                // ✅ 수정: InputAccessoryView 표시를 위해 필수
                blurOnSubmit={false}
                // ❌ 키보드 닫힘을 방해하던 onBlur 로직 제거
                onSubmitEditing={() => Keyboard.dismiss()}
                inputAccessoryViewID={ACCESSORY_ID}
              />
              <Text style={styles.unit}>세</Text>
            </View>
          </View>

          {/* 신장 */}
          <View style={styles.field}>
            <Text style={styles.lab}>신장</Text>
            <View style={styles.unitBox}>
              <TextInput
                style={styles.inpRight}
                value={v.height}
                onChangeText={(t) => handle("height", t)}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
                // ✅ 수정: InputAccessoryView 표시를 위해 필수
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
              />
              <Text style={styles.unit}>cm</Text>
            </View>
          </View>
        </View>

        {/* 핵심 수치 */}
        <View style={styles.sec}>
          {/* 체중 */}
          <View style={styles.field}>
            <Text style={styles.lab}>체중</Text>
            <View style={styles.unitBox}>
              <TextInput
                style={styles.inpRight}
                value={v.weight}
                onChangeText={(t) => handle("weight", t)}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
                // ✅ 수정
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          </View>

          {/* 골격근량 */}
          <View style={styles.field}>
            <Text style={styles.lab}>골격근량(SMM)</Text>
            <View style={styles.unitBox}>
              <TextInput
                style={styles.inpRight}
                value={v.smm}
                onChangeText={(t) => handle("smm", t)}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
                // ✅ 수정
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          </View>

          {/* 근육량(Muscle Mass) */}
          <View style={styles.field}>
            <Text style={styles.lab}>근육량(Muscle Mass)</Text>
            <View style={styles.unitBox}>
              <TextInput
                style={styles.inpRight}
                value={v.muscleMass}
                onChangeText={(t) => handle("muscleMass", t)}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
                placeholder="골격근량과 동일 또는 다를 수 있음"
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          </View>

          {/* 체지방량 */}
          <View style={styles.field}>
            <Text style={styles.lab}>체지방량(BFM)</Text>
            <View style={styles.unitBox}>
              <TextInput
                style={styles.inpRight}
                value={v.bfm}
                onChangeText={(t) => handle("bfm", t)}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
                // ✅ 수정
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          </View>

          {/* 체지방률 */}
          <View style={styles.field}>
            <Text style={styles.lab}>체지방률(PBF)</Text>
            <View style={styles.unitBox}>
              <TextInput
                style={styles.inpRight}
                value={v.pbf}
                onChangeText={(t) => handle("pbf", t)}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
                placeholder="예: 0.23 (또는 23)"
                // ✅ 수정
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
              />
              <Text style={styles.unit}>%</Text>
            </View>
          </View>

          {/* BMI (읽기전용) */}
          <View style={styles.field}>
            <Text style={styles.lab}>BMI</Text>
            <View style={styles.unitBox}>
              <TextInput
                style={[styles.inpRight, styles.inpReadOnly]}
                value={bmi}
                editable={false}
                // ✅ 읽기 전용이라도 accessory view ID 지정
                inputAccessoryViewID={ACCESSORY_ID}
              />
              <Text style={styles.unit}>kg/m²</Text>
            </View>
          </View>
        </View>

        {/* 점수/내장지방/BMR */}
        <View style={styles.sec}>
          <View style={styles.field}>
            <Text style={styles.lab}>인바디 점수</Text>
            <TextInput
              style={styles.inp}
              value={v.score}
              onChangeText={(t) => handle("score", t)}
              keyboardType="decimal-pad"
              placeholderTextColor="#666"
              // ✅ 수정
              blurOnSubmit={false}
              inputAccessoryViewID={ACCESSORY_ID}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.lab}>내장지방 레벨</Text>
            <View style={styles.unitBox}>
              <TextInput
                style={styles.inpRight}
                value={v.vfa}
                onChangeText={(t) => handle("vfa", t)}
                keyboardType="number-pad"
                placeholderTextColor="#666"
                placeholder="예: 6"
                // ✅ 수정
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
              />
              {/* 단위 없음: 레벨(정수) */}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.lab}>BMR</Text>
            <View style={styles.unitBox}>
              <TextInput
                style={styles.inpRight}
                value={v.bmr}
                onChangeText={(t) => handle("bmr", t)}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
                // ✅ 수정
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
              />
              <Text style={styles.unit}>kcal</Text>
            </View>
          </View>
        </View>

        {/* 부위별 근육량 */}
        <View style={styles.sec}>
          <Text style={styles.h3}>부위별 근육량 (kg)</Text>

          {[
            { key: "rArm", label: "오른팔" },
            { key: "lArm", label: "왼팔" },
            { key: "trunk", label: "몸통" },
            { key: "rLeg", label: "오른다리" },
            { key: "lLeg", label: "왼다리" },
          ].map(({ key, label }) => (
            <View style={styles.field} key={key}>
              <Text style={styles.smallLab}>{label}</Text>
              <View style={styles.unitBox}>
                <TextInput
                  style={styles.inpRight}
                  value={(v as any)[key]}
                  onChangeText={(t) => handle(key, t)}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#666"
                  blurOnSubmit={false}
                  inputAccessoryViewID={ACCESSORY_ID}
                />
                <Text style={styles.unit}>kg</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 부위별 체지방 */}
        <View style={styles.sec}>
          <Text style={styles.h3}>부위별 체지방 (kg)</Text>

          {[
            { key: "rArmFat", label: "오른팔 체지방" },
            { key: "lArmFat", label: "왼팔 체지방" },
            { key: "trunkFat", label: "몸통 체지방" },
            { key: "rLegFat", label: "오른다리 체지방" },
            { key: "lLegFat", label: "왼다리 체지방" },
          ].map(({ key, label }) => (
            <View style={styles.field} key={key}>
              <Text style={styles.smallLab}>{label}</Text>
              <View style={styles.unitBox}>
                <TextInput
                  style={styles.inpRight}
                  value={(v as any)[key]}
                  onChangeText={(t) => handle(key, t)}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#666"
                  blurOnSubmit={false}
                  inputAccessoryViewID={ACCESSORY_ID}
                />
                <Text style={styles.unit}>kg</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 체성분 분석 */}
        <View style={styles.sec}>
          <Text style={styles.h3}>체성분 분석</Text>

          <View style={styles.field}>
            <Text style={styles.lab}>체수분(Total Body Water)</Text>
            <View style={styles.unitBox}>
              <TextInput
                style={styles.inpRight}
                value={v.tbw}
                onChangeText={(t) => handle("tbw", t)}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
              />
              <Text style={styles.unit}>L</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.lab}>단백질(Protein)</Text>
            <View style={styles.unitBox}>
              <TextInput
                style={styles.inpRight}
                value={v.protein}
                onChangeText={(t) => handle("protein", t)}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.lab}>무기질(Mineral)</Text>
            <View style={styles.unitBox}>
              <TextInput
                style={styles.inpRight}
                value={v.mineral}
                onChangeText={(t) => handle("mineral", t)}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          </View>
        </View>

        {/* 비만 분석 */}
        <View style={styles.sec}>
          <Text style={styles.h3}>비만 분석</Text>

          <View style={styles.field}>
            <Text style={styles.lab}>체지방률 표준(%)</Text>
            <View style={styles.unitBox}>
              <TextInput
                style={styles.inpRight}
                value={v.pbfStd}
                onChangeText={(t) => handle("pbfStd", t)}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
              />
              <Text style={styles.unit}>%</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.lab}>비만도(%)</Text>
            <View style={styles.unitBox}>
              <TextInput
                style={styles.inpRight}
                value={v.obesityDegree}
                onChangeText={(t) => handle("obesityDegree", t)}
                keyboardType="decimal-pad"
                placeholderTextColor="#666"
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
              />
              <Text style={styles.unit}>%</Text>
            </View>
          </View>
        </View>

        {/* 수분비/체중조절 */}
        <View style={styles.sec}>
          <View style={styles.field}>
            <Text style={styles.lab}>세포외수분비(ECW/TBW)</Text>
            <TextInput
              style={styles.inp}
              value={v.ecw}
              onChangeText={(t) => handle("ecw", t)}
              keyboardType="decimal-pad"
              placeholderTextColor="#666"
              // ✅ 수정
              blurOnSubmit={false}
              inputAccessoryViewID={ACCESSORY_ID}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.lab}>체중조절(±kg)</Text>
            <View style={styles.unitBox}>
              <TextInput
                ref={(ref) => {
                  inputRefs.current["wtCtrl"] = ref;
                }}
                style={styles.inpRight}
                value={v.wtCtrl}
                onChangeText={(t) => {
                  // ± 기호와 숫자만 허용
                  const filtered = t.replace(/[^+\-0-9.]/g, "");
                  handle("wtCtrl", filtered);
                }}
                keyboardType="default"
                placeholderTextColor="#666"
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
                placeholder="예: +2.5 또는 -3.0"
                onFocus={() => handleInputFocus("wtCtrl")}
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.lab}>지방조절(kg)</Text>
            <View style={styles.unitBox}>
              <TextInput
                ref={(ref) => {
                  inputRefs.current["fatCtrl"] = ref;
                }}
                style={styles.inpRight}
                value={v.fatCtrl}
                onChangeText={(t) => {
                  // ± 기호와 숫자만 허용
                  const filtered = t.replace(/[^+\-0-9.]/g, "");
                  handle("fatCtrl", filtered);
                }}
                keyboardType="default"
                placeholderTextColor="#666"
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
                placeholder="예: +1.5 또는 -2.0"
                onFocus={() => handleInputFocus("fatCtrl")}
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.lab}>근육조절(kg)</Text>
            <View style={styles.unitBox}>
              <TextInput
                ref={(ref) => {
                  inputRefs.current["musCtrl"] = ref;
                }}
                style={styles.inpRight}
                value={v.musCtrl}
                onChangeText={(t) => {
                  // ± 기호와 숫자만 허용
                  const filtered = t.replace(/[^+\-0-9.]/g, "");
                  handle("musCtrl", filtered);
                }}
                keyboardType="default"
                placeholderTextColor="#666"
                blurOnSubmit={false}
                inputAccessoryViewID={ACCESSORY_ID}
                placeholder="예: +0.5 또는 -1.0"
                onFocus={() => handleInputFocus("musCtrl")}
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          </View>
        </View>

        {/* 저장 버튼 */}
        <TouchableOpacity style={styles.submit} onPress={handleSubmit}>
          <Text style={styles.submitText}>저장</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ✅ InputAccessoryView는 ScrollView 밖에 렌더링되어야 합니다. */}
      {DoneBar}
      
      {/* 날짜 선택 달력 모달 */}
      <InBodyCalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        onSelectDate={handleDateSelect}
        selectedDate={v.date ? new Date(v.date) : new Date()}
        inBodyDates={(inBodyDates || []).map((date) =>
          date.includes(".") ? date : date.replace(/-/g, ".")
        )}
      />
    </>
  );
};

// ... (스타일 코드는 변경 없음)
const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: "100%",
    backgroundColor: "#1b1b1b",
    padding: 16,
  },
  h3: {
    marginVertical: 6,
    fontSize: 13,
    color: "#c9c9c9",
  },
  sec: {
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    paddingTop: 8,
    marginTop: 8,
  },
  field: {
    marginBottom: 8,
  },
  lab: {
    fontSize: 11,
    color: "#bdbdbd",
    marginBottom: 4,
  },
  smallLab: {
    fontSize: 11,
    color: "#bdbdbd",
    marginBottom: 4,
  },
  inp: {
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#242424",
    color: "#ffffff",
    fontSize: 14,
    textAlign: "right",
  },
  datePickerButton: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#242424",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datePickerText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  inpRight: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#343434",
    backgroundColor: "#242424",
    color: "#ffffff",
    fontSize: 14,
    textAlign: "right", // 숫자가 오른쪽으로 정렬되도록 추가
  },
  inpReadOnly: {
    backgroundColor: "#2b2b2b",
    textAlign: "right", // 읽기 전용도 정렬
  },
  unitBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unit: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: "#2b2b2b",
    color: "#d5d5d5",
    fontSize: 11,
    borderWidth: 1,
    borderColor: "#353535",
  },
  row: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#666",
  },
  radioSelected: {
    backgroundColor: "#d6ff4b",
    borderColor: "#d6ff4b",
  },
  radioText: {
    fontSize: 13,
    color: "#ffffff",
  },
  submit: {
    marginTop: 16,
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#d6ff4b",
    alignItems: "center",
  },
  submitText: {
    color: "#111111",
    fontWeight: "700",
    fontSize: 14,
  },
  // iOS 숫자패드 상단 액세서리 바
  bar: {
    backgroundColor: "#1f1f1f",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  barBtn: {
    color: "#d6ff4b",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default InBodyManualForm;
