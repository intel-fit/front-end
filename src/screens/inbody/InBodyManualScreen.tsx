import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import InBodyManualForm from "../../components/common/InBodyManualForm";
import { postInBody, patchInBody, getInBodyList, getLatestInBody, InBodyPayload } from "../../utils/inbodyApi";
import { eventBus } from "../../utils/eventBus";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const InBodyManualScreen = ({ navigation, route }: any) => {
  const [loading, setLoading] = useState(false);
  const inBodyId: number | string | undefined = route?.params?.inBodyId;
  const defaultValues = route?.params?.defaultValues;
  const [inBodyDates, setInBodyDates] = useState<string[]>([]);
  const [formKey, setFormKey] = useState(0); // 폼 리마운트를 위한 key
  const [currentDefaultValues, setCurrentDefaultValues] = useState(defaultValues);
  const [currentInBodyId, setCurrentInBodyId] = useState<number | string | undefined>(inBodyId);

  // defaultValues가 변경되면 currentDefaultValues 업데이트
  useEffect(() => {
    if (defaultValues) {
      console.log("[INBODY MANUAL] defaultValues 업데이트:", defaultValues);
      setCurrentDefaultValues(defaultValues);
    }
  }, [defaultValues]);

  const normalizeDate = useCallback(
    (date: string) => (date.includes(".") ? date : date.replace(/-/g, ".")),
    []
  );

  const getManualBaseKey = useCallback(
    async () => {
      const storedUserId = await AsyncStorage.getItem("userId");
      return `manualInBody:${storedUserId || "guest"}`;
    },
    []
  );

  const loadInBodyDates = useCallback(async () => {
    const dateSet = new Set<string>();

    // 원격 API는 호출하지 않고, 로컬 저장된 수기 기록만 사용
    const manualBaseKey = await getManualBaseKey();
    const manualDatesKey = `${manualBaseKey}:dates`;
    const manualDatesRaw = await AsyncStorage.getItem(manualDatesKey);
    if (manualDatesRaw) {
      try {
        const manualDates: string[] = JSON.parse(manualDatesRaw);
        manualDates
          .map((date) => normalizeDate(date))
          .forEach((date) => dateSet.add(date));
      } catch (error) {
        console.error(
          "[INBODY MANUAL] 수기 날짜 목록 파싱 실패:",
          manualDatesRaw,
          error
        );
      }
    }

    setInBodyDates(Array.from(dateSet).sort());
  }, [getManualBaseKey, normalizeDate]);

  const storeManualPayload = useCallback(
    async (measurementDate: string, payload: InBodyPayload) => {
      const normalizedDate = normalizeDate(measurementDate);
      const manualBaseKey = await getManualBaseKey();
      const manualEntryKey = `${manualBaseKey}:${normalizedDate}`;
      const manualDatesKey = `${manualBaseKey}:dates`;

      const storedPayload = {
        ...payload,
        measurementDate: normalizedDate,
        savedAt: new Date().toISOString(),
        source: "manual",
      };

      try {
        await AsyncStorage.setItem(
          manualEntryKey,
          JSON.stringify(storedPayload)
        );

        const manualDatesRaw = await AsyncStorage.getItem(manualDatesKey);
        let manualDates: string[] = [];
        if (manualDatesRaw) {
          try {
            manualDates = JSON.parse(manualDatesRaw);
          } catch (error) {
            console.error(
              "[INBODY MANUAL] 수기 날짜 목록 파싱 실패:",
              manualDatesRaw,
              error
            );
            manualDates = [];
          }
        }

        if (!manualDates.includes(normalizedDate)) {
          manualDates.push(normalizedDate);
          manualDates.sort();
          await AsyncStorage.setItem(
            manualDatesKey,
            JSON.stringify(manualDates)
          );
        }
      } catch (error) {
        console.error("[INBODY MANUAL] 수기 데이터 저장 실패:", error);
      }
    },
    [getManualBaseKey, normalizeDate]
  );

  useFocusEffect(
    useCallback(() => {
      loadInBodyDates();
    }, [loadInBodyDates])
  );

  // 검증 가이드 생성 함수
  const getValidationGuide = (_payload?: InBodyPayload) => "";

  // API 응답을 폼 defaultValues 형식으로 변환
  const convertInBodyToFormValues = useCallback((inBodyData: any) => {
    if (!inBodyData) return {};

    const bodyComposition = inBodyData.bodyComposition || {};
    const muscleFatAnalysis = inBodyData.muscleFatAnalysis || {};
    const obesityAnalysis = inBodyData.obesityAnalysis || {};

    // 날짜 변환 (YYYY.MM.DD -> YYYY-MM-DD)
    const measurementDate = inBodyData.measurementDate
      ? inBodyData.measurementDate.replace(/\./g, "-")
      : "";

    // 나이에서 숫자만 추출
    const age = inBodyData.age
      ? inBodyData.age.replace(/[^0-9]/g, "")
      : "";

    // 신장에서 숫자만 추출
    const height = inBodyData.height
      ? inBodyData.height.replace(/[^0-9.]/g, "")
      : "";

    // 성별 변환
    const gender = inBodyData.gender === "남성" ? "male" : "female";

    return {
      date: measurementDate,
      gender,
      age,
      height,
      weight: inBodyData.weight?.toString() || bodyComposition.weight?.toString()?.split(" ")[0] || muscleFatAnalysis.weight?.toString() || "",
      smm: inBodyData.skeletalMuscleMass?.toString() || muscleFatAnalysis.skeletalMuscleMass?.toString() || "",
      muscleMass: inBodyData.muscleMass?.toString() || "",
      bfm: inBodyData.bodyFatMass?.toString() || bodyComposition.bodyFatMass?.toString()?.split(" ")[0] || muscleFatAnalysis.bodyFatMass?.toString() || "",
      pbf: inBodyData.bodyFatPercentage?.toString() || obesityAnalysis.bodyFatPercentage?.toString() || "",
      vfa: inBodyData.visceralFatLevel?.toString()?.split(" ")[0] || "",
      bmr: inBodyData.basalMetabolicRate?.toString() || "",
      rArm: inBodyData.rightArmMuscle?.toString() || "",
      lArm: inBodyData.leftArmMuscle?.toString() || "",
      trunk: inBodyData.trunkMuscle?.toString() || "",
      rLeg: inBodyData.rightLegMuscle?.toString() || "",
      lLeg: inBodyData.leftLegMuscle?.toString() || "",
      rArmFat: inBodyData.rightArmFat?.toString() || "",
      lArmFat: inBodyData.leftArmFat?.toString() || "",
      trunkFat: inBodyData.trunkFat?.toString() || "",
      rLegFat: inBodyData.rightLegFat?.toString() || "",
      lLegFat: inBodyData.leftLegFat?.toString() || "",
      tbw: inBodyData.totalBodyWater?.toString() || bodyComposition.totalBodyWater?.toString()?.split(" ")[0] || "",
      protein: inBodyData.protein?.toString() || bodyComposition.protein?.toString()?.split(" ")[0] || "",
      mineral: inBodyData.mineral?.toString() || bodyComposition.mineral?.toString()?.split(" ")[0] || "",
      pbfStd: inBodyData.bodyFatPercentageStandard?.toString() || "",
      obesityDegree: inBodyData.obesityDegree?.toString() || "",
    };
  }, []);

  // 날짜 정규화 헬퍼 함수 (YYYY-MM-DD 형식으로 통일)
  const normalizeDateForComparison = useCallback((date: string): string => {
    if (!date) return "";
    // 점(.)을 하이픈(-)으로 변경
    return date.replace(/\./g, "-");
  }, []);

  // 날짜 변경 핸들러
  const handleDateChange = useCallback(async (date: string, currentFormData?: any) => {
    try {
      console.log("[INBODY] 날짜 변경, 최신 기록 확인 중:", date);
      const latestRecord = await getLatestInBody();
      
      // 최신 기록이 있고 날짜가 일치하는지 확인
      if (latestRecord) {
        const latestData = latestRecord?.success ? latestRecord.inBody : latestRecord;
        const latestDate = latestData?.measurementDate;
        
        if (latestDate) {
          // 날짜 형식 정규화 (YYYY-MM-DD)
          const normalizedLatestDate = normalizeDateForComparison(latestDate);
          const normalizedSelectedDate = normalizeDateForComparison(date);
          
          if (normalizedLatestDate === normalizedSelectedDate) {
            // 날짜가 일치하면 기존 기록으로 처리
            const recordId = latestData.id;
            console.log("[INBODY] 최신 기록의 날짜가 일치, ID:", recordId);
            
            // 기존 기록 ID 저장
            setCurrentInBodyId(recordId);
            
            // API 응답을 폼 형식으로 변환
            const formValues = convertInBodyToFormValues(latestData);
            setCurrentDefaultValues(formValues);
            
            // 폼 리마운트하여 새 값 적용
            setFormKey((prev) => prev + 1);
            
            Alert.alert(
              "기존 기록 발견",
              "해당 날짜에 기존 인바디 기록이 있습니다.\n기록을 수정할 수 있습니다.",
              [{ text: "확인" }]
            );
            return;
          } else {
            console.log("[INBODY] 최신 기록의 날짜가 일치하지 않음:", {
              latestDate: normalizedLatestDate,
              selectedDate: normalizedSelectedDate,
            });
          }
        }
      }
      
      // 날짜가 일치하지 않거나 최신 기록이 없으면 날짜만 변경하고 나머지 데이터는 유지
      console.log("[INBODY] 기존 기록 없음, 날짜만 변경하고 입력 데이터 유지");
      setCurrentInBodyId(undefined);
      
      // 현재 폼 데이터가 있으면 날짜만 업데이트, 없으면 날짜만 설정
      if (currentFormData) {
        setCurrentDefaultValues({
          ...currentFormData,
          date,
        });
      } else {
        setCurrentDefaultValues({ date });
      }
      setFormKey((prev) => prev + 1);
    } catch (error: any) {
      console.warn("[INBODY] 날짜 변경 시 최신 기록 확인 중 에러:", error);
      // 에러 발생 시에도 현재 폼 데이터 유지하고 날짜만 변경
      setCurrentInBodyId(undefined);
      if (currentFormData) {
        setCurrentDefaultValues({
          ...currentFormData,
          date,
        });
      } else {
        setCurrentDefaultValues({ date });
      }
      setFormKey((prev) => prev + 1);
    }
  }, [convertInBodyToFormValues, normalizeDateForComparison]);

  const handleSubmit = async (data: any) => {
    // 에러 처리에서 사용할 수 있도록 변수 선언
    let finalPayload: InBodyPayload | undefined;

    try {
      setLoading(true);
      console.log("인바디 수기 입력 저장:", data);

      // 폼 데이터를 API 요청 형식으로 변환
      // 테스트 결과 하이픈 형식(YYYY-MM-DD)이 성공하므로 기본값으로 사용
      const measurementDateRaw =
        data.date || new Date().toISOString().slice(0, 10);
      const measurementDate = measurementDateRaw; // 하이픈 형식 그대로 사용 (YYYY-MM-DD)

      // 숫자 파싱 헬퍼 함수 (입력하지 않은 필드는 null로 반환)
      const parseNumber = (value: string | undefined): number | null => {
        if (!value || value.trim() === "") return null;
        const num = parseFloat(value);
        if (isNaN(num) || !isFinite(num)) return null;
        // 소수점 2자리로 반올림하여 부동소수점 오차 제거
        return Math.round(num * 100) / 100;
      };

      // bodyFatPercentage는 퍼센트 값(0~100)으로 전송
      const normalizePercent = (
        num: number | null
      ): number | null => {
        if (num === null) return null;
        // 사용자가 0~1 소수로 입력한 경우(예: 0.23) → 퍼센트로 환산
        if (num <= 1) return +(num * 100).toFixed(2);
        return +num.toFixed(2);
      };
      
      const smmValue = parseNumber(data.smm);
      const muscleMassValue = parseNumber(data.muscleMass) ?? smmValue;
      
      console.log("[INBODY] 파싱된 값:", {
        smm: smmValue,
        muscleMass: parseNumber(data.muscleMass),
        muscleMassValue: muscleMassValue,
      });
      
      const payload: InBodyPayload = {
        measurementDate,
        weight: parseNumber(data.weight),
        muscleMass: muscleMassValue,
        skeletalMuscleMass: smmValue,
        bodyFatMass: parseNumber(data.bfm),
        bodyFatPercentage: normalizePercent(parseNumber(data.pbf)),
        leftArmMuscle: parseNumber(data.lArm),
        rightArmMuscle: parseNumber(data.rArm),
        trunkMuscle: parseNumber(data.trunk),
        leftLegMuscle: parseNumber(data.lLeg),
        rightLegMuscle: parseNumber(data.rLeg),
        leftArmFat: parseNumber(data.lArmFat),
        rightArmFat: parseNumber(data.rArmFat),
        trunkFat: parseNumber(data.trunkFat),
        leftLegFat: parseNumber(data.lLegFat),
        rightLegFat: parseNumber(data.rLegFat),
        totalBodyWater: parseNumber(data.tbw),
        protein: parseNumber(data.protein),
        mineral: parseNumber(data.mineral),
        bodyFatPercentageStandard: parseNumber(data.pbfStd),
        obesityDegree: parseNumber(data.obesityDegree),
        visceralFatLevel: parseNumber(data.vfa),
        basalMetabolicRate: parseNumber(data.bmr),
        bmi: parseNumber(data.bmi),
      };

      // muscleMass가 null이면 skeletalMuscleMass와 동일한 값으로 설정
      if (payload.muscleMass === null && payload.skeletalMuscleMass !== null) {
        payload.muscleMass = payload.skeletalMuscleMass;
      }

      // 에러 처리에서 사용할 수 있도록 변수 저장
      finalPayload = payload;

      console.log(
        "[INBODY] 최종 페이로드:",
        JSON.stringify(payload, null, 2)
      );

      // 날짜 검증: 최신 기록보다 과거 날짜로 저장하려는 경우 안내
      if (payload.measurementDate) {
        try {
          console.log("[INBODY] 날짜 검증 중:", payload.measurementDate);
          const latestRecord = await getLatestInBody();
          
          if (latestRecord) {
            const latestData = latestRecord?.success ? latestRecord.inBody : latestRecord;
            const latestDate = latestData?.measurementDate || latestData?.date;
            
            if (latestDate) {
              // 날짜 형식 정규화 (YYYY-MM-DD)
              const normalizedLatestDate = normalizeDateForComparison(latestDate);
              const normalizedPayloadDate = normalizeDateForComparison(payload.measurementDate);
              
              // 날짜 비교 (문자열 비교로 날짜 순서 확인)
              if (normalizedPayloadDate < normalizedLatestDate) {
                // 저장하려는 날짜가 최신 기록보다 과거인 경우
                console.log("[INBODY] 과거 날짜 저장 시도:", {
                  latestDate: normalizedLatestDate,
                  payloadDate: normalizedPayloadDate,
                });
                
                Alert.alert(
                  "과거 날짜 저장 불가",
                  `이미 ${latestDate}에 인바디 기록이 있습니다.\n\n과거 날짜로는 인바디를 등록할 수 없습니다.\n\n${payload.measurementDate} 이후의 날짜로 등록해주세요.`,
                  [{ text: "확인" }]
                );
                setLoading(false);
                return;
              } else if (normalizedPayloadDate > normalizedLatestDate) {
                // 미래 날짜는 저장 허용
                console.log("[INBODY] 미래 날짜 저장 허용:", {
                  latestDate: normalizedLatestDate,
                  payloadDate: normalizedPayloadDate,
                });
              }
            }
          }
        } catch (error: any) {
          console.warn("[INBODY] 날짜 검증 중 에러:", error);
          // 날짜 검증 실패 시에도 저장은 진행 (에러가 발생해도 저장은 허용)
        }
      }

      // 같은 날짜에 기존 기록이 있는지 확인
      // 날짜 변경 시 이미 확인한 ID가 있으면 사용, 없으면 최신 기록으로 확인
      let existingInBodyId: number | string | undefined = currentInBodyId || inBodyId;
      if (!existingInBodyId && payload.measurementDate) {
        try {
          console.log("[INBODY] 최신 기록으로 기존 기록 확인 중:", payload.measurementDate);
          const latestRecord = await getLatestInBody();
          
          if (latestRecord) {
            const latestData = latestRecord?.success ? latestRecord.inBody : latestRecord;
            const latestDate = latestData?.measurementDate || latestData?.date;
            
            if (latestDate && latestData?.id) {
              // 날짜 형식 정규화 (YYYY-MM-DD)
              const normalizedLatestDate = normalizeDateForComparison(latestDate);
              const normalizedPayloadDate = normalizeDateForComparison(payload.measurementDate);
              
              console.log("[INBODY] 날짜 비교:", {
                latestDate: normalizedLatestDate,
                payloadDate: normalizedPayloadDate,
                match: normalizedLatestDate === normalizedPayloadDate,
              });
              
              if (normalizedLatestDate === normalizedPayloadDate) {
                // 날짜가 일치하면 기존 기록으로 처리
                existingInBodyId = latestData.id;
                console.log("[INBODY] 최신 기록의 날짜가 일치, 기존 기록 ID:", existingInBodyId);
              } else {
                console.log("[INBODY] 최신 기록의 날짜가 일치하지 않음:", {
                  latestDate: normalizedLatestDate,
                  payloadDate: normalizedPayloadDate,
                });
              }
            } else {
              console.log("[INBODY] 최신 기록에 날짜 또는 ID 정보 없음:", {
                hasDate: !!latestDate,
                hasId: !!latestData?.id,
              });
            }
          }
        } catch (error: any) {
          console.warn("[INBODY] 최신 기록 확인 중 에러:", error);
        }
      }

      let response: any;
      try {
        response = existingInBodyId
          ? await patchInBody(existingInBodyId, payload)
          : await postInBody(payload);
      } catch (e: any) {
        // POST 요청에서 409 에러가 발생하면 기존 기록이 있다는 의미
        // 에러 응답에서 기존 기록 ID를 추출하여 PATCH로 재시도
        if (!existingInBodyId && e?.response?.status === 409) {
          console.log("[INBODY] 409 에러 발생, 기존 기록 ID 찾기 시도");
          console.log("[INBODY] 409 에러 응답 전체:", JSON.stringify(e.response?.data, null, 2));
          
          // 에러 응답에서 기존 기록 ID 추출 시도
          const errorData = e.response?.data;
          let foundInBodyId: number | string | undefined;
          
          // 여러 가능한 경로에서 ID 찾기 (더 많은 경로 확인)
          if (errorData?.inBodyId) {
            foundInBodyId = errorData.inBodyId;
          } else if (errorData?.inBody?.id) {
            foundInBodyId = errorData.inBody.id;
          } else if (errorData?.id) {
            foundInBodyId = errorData.id;
          } else if (errorData?.data?.inBodyId) {
            foundInBodyId = errorData.data.inBodyId;
          } else if (errorData?.data?.inBody?.id) {
            foundInBodyId = errorData.data.inBody.id;
          } else if (errorData?.data?.id) {
            foundInBodyId = errorData.data.id;
          } else if (errorData?.details?.inBodyId) {
            foundInBodyId = errorData.details.inBodyId;
          } else if (errorData?.details?.id) {
            foundInBodyId = errorData.details.id;
          }
          
          // ID를 찾았으면 PATCH로 재시도
          if (foundInBodyId) {
            console.log("[INBODY] 기존 기록 ID 발견, PATCH로 재시도:", foundInBodyId);
            try {
              response = await patchInBody(foundInBodyId, payload);
              existingInBodyId = foundInBodyId; // 성공 시 ID 저장
            } catch (patchError: any) {
              // PATCH도 실패하면 원래 에러를 다시 throw
              console.error("[INBODY] PATCH 재시도 실패:", patchError);
              throw patchError;
            }
          } else {
            // ID를 찾지 못했으면 getLatestInBody로 최신 기록 확인
            console.log("[INBODY] getLatestInBody로 최신 기록 확인 시도");
            try {
              const latestInBody = await getLatestInBody();
              const latestData = latestInBody?.success ? latestInBody.inBody : latestInBody;
              
              if (latestData?.id) {
                // 최신 기록의 날짜와 현재 날짜 비교
                const latestDate = latestData.measurementDate || latestData.date;
                if (latestDate) {
                  // 날짜 형식 정규화 (YYYY-MM-DD)
                  const normalizedLatestDate = normalizeDateForComparison(latestDate);
                  const normalizedPayloadDate = normalizeDateForComparison(payload.measurementDate || "");
                  
                  console.log("[INBODY][409] 날짜 비교:", {
                    latestDate: normalizedLatestDate,
                    payloadDate: normalizedPayloadDate,
                    match: normalizedLatestDate === normalizedPayloadDate,
                  });
                  
                  if (normalizedLatestDate === normalizedPayloadDate) {
                    foundInBodyId = latestData.id;
                    console.log("[INBODY] getLatestInBody에서 기존 기록 ID 발견, PATCH로 재시도:", foundInBodyId);
                    response = await patchInBody(foundInBodyId, payload);
                    existingInBodyId = foundInBodyId;
                  } else {
                    console.log("[INBODY] 최신 기록의 날짜가 일치하지 않음, getInBodyList로 시도");
                    // 날짜가 일치하지 않으면 getInBodyList로 시도
                    throw new Error("날짜 불일치");
                  }
                } else {
                  console.log("[INBODY] 최신 기록에 날짜 정보 없음, getInBodyList로 시도");
                  throw new Error("날짜 정보 없음");
                }
              } else {
                console.log("[INBODY] 최신 기록 없음, getInBodyList로 시도");
                throw new Error("최신 기록 없음");
              }
            } catch (latestError: any) {
              // getLatestInBody 실패 또는 날짜 불일치 시 getInBodyList로 시도
              if (latestError.message === "날짜 불일치" || latestError.message === "날짜 정보 없음" || latestError.message === "최신 기록 없음" || !latestError.response) {
                console.log("[INBODY] getInBodyList로 기존 기록 찾기 시도");
                try {
                  const inBodyList = await getInBodyList();
                  if (inBodyList?.success && Array.isArray(inBodyList.data)) {
                    // 날짜로 필터링하여 기존 기록 찾기
                    const existingRecord = inBodyList.data.find((record: any) => {
                      const recordDate = record.measurementDate || record.date;
                      if (!recordDate) return false;
                      // 날짜 형식 정규화 (YYYY-MM-DD)
                      const normalizedRecordDate = normalizeDateForComparison(recordDate);
                      const normalizedPayloadDate = normalizeDateForComparison(payload.measurementDate || "");
                      return normalizedRecordDate === normalizedPayloadDate;
                    });
                    
                    if (existingRecord?.id) {
                      foundInBodyId = existingRecord.id;
                      console.log("[INBODY] getInBodyList에서 기존 기록 ID 발견, PATCH로 재시도:", foundInBodyId);
                      response = await patchInBody(foundInBodyId, payload);
                      existingInBodyId = foundInBodyId;
                    } else {
                      console.warn("[INBODY] getInBodyList에서도 기존 기록을 찾지 못함");
                      // getInBodyList에서 찾지 못했지만 409 에러가 발생했다는 것은 기록이 존재한다는 의미
                      // 사용자에게 알림을 표시하고 에러를 throw
                      Alert.alert(
                        "저장 실패",
                        `해당 날짜(${payload.measurementDate})에 이미 인바디 기록이 있습니다.\n\n날짜를 변경하거나, 해당 날짜로 이동하여 기존 기록을 수정해주세요.`,
                        [
                          { text: "취소", style: "cancel" },
                          {
                            text: "날짜 변경",
                            onPress: () => {
                              // 날짜 선택 화면으로 이동하거나 날짜 입력 필드에 포커스
                              // 여기서는 단순히 에러만 throw
                            },
                          },
                        ]
                      );
                      throw e;
                    }
                  } else {
                    console.warn("[INBODY] getInBodyList 응답 형식 오류");
                    // getInBodyList가 실패했지만 409 에러가 발생했다는 것은 기록이 존재한다는 의미
                    Alert.alert(
                      "저장 실패",
                      `해당 날짜(${payload.measurementDate})에 이미 인바디 기록이 있습니다.\n\n날짜를 변경하거나, 해당 날짜로 이동하여 기존 기록을 수정해주세요.`,
                      [{ text: "확인" }]
                    );
                    throw e;
                  }
                } catch (listError: any) {
                  console.error("[INBODY] getInBodyList로 기존 기록 찾기 실패:", listError);
                  // getInBodyList가 실패했지만 409 에러가 발생했다는 것은 기록이 존재한다는 의미
                  // 500 에러인 경우 서버 문제이므로 사용자에게 안내
                  if (listError?.response?.status === 500) {
                    Alert.alert(
                      "저장 실패",
                      `해당 날짜(${payload.measurementDate})에 이미 인바디 기록이 있습니다.\n\n기존 기록을 수정하려면:\n1. 날짜를 해당 날짜로 변경하세요\n2. 기존 기록이 자동으로 로드됩니다\n3. 수정 후 저장하세요`,
                      [{ text: "확인" }]
                    );
                  } else {
                    Alert.alert(
                      "저장 실패",
                      `해당 날짜(${payload.measurementDate})에 이미 인바디 기록이 있습니다.\n\n날짜를 변경하거나, 해당 날짜로 이동하여 기존 기록을 수정해주세요.`,
                      [{ text: "확인" }]
                    );
                  }
                  throw e;
                }
              } else {
                // getLatestInBody 자체가 실패한 경우 (네트워크 에러 등)
                console.error("[INBODY] getLatestInBody 실패:", latestError);
                throw e;
              }
            }
          }
        } else {
          // 409가 아니거나 이미 existingInBodyId가 있으면 원래 에러를 throw
          throw e;
        }
      }

      if (response.success) {
        eventBus.emit("inbodyUpdated", { measurementDate: payload.measurementDate });
        const savedInBodyId = response.inBody?.id ?? existingInBodyId ?? "N/A";
        await storeManualPayload(
          payload.measurementDate || measurementDate,
          payload
        );
        await loadInBodyDates();
        console.log("[INBODY] 등록된 인바디 ID:", savedInBodyId);
        Alert.alert(
          existingInBodyId ? "수정 완료" : "저장 완료",
          `${
            response.message ||
            (existingInBodyId
              ? "인바디 정보가 수정되었습니다."
              : "인바디 정보가 저장되었습니다.")
          }\n\n인바디 ID: ${savedInBodyId}`,
          [
            {
              text: "확인",
              onPress: () => navigation.navigate("InBody", { fromPhotoUpload: true }),
            },
          ]
        );
      } else {
        Alert.alert(
          "저장 실패",
          response.message || "인바디 정보 저장에 실패했습니다."
        );
      }
    } catch (error: any) {
      console.error("인바디 저장 에러:", error);
      console.error("인바디 저장 에러 상세:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config,
      });

      let errorMessage = "";
      let errorTitle = "저장 실패";
      let errorType = ""; // "입력 오류" 또는 "서버 오류" 또는 "네트워크 오류"

      // 클라이언트 측 검증 결과
      let clientValidation = "";
      if (finalPayload) {
        clientValidation = "";
      }

      if (error.response?.status === 409) {
        errorType = "입력 오류";
        errorTitle = "중복 오류";
        errorMessage =
          "해당 날짜에 이미 인바디 기록이 존재합니다.\n\n다른 날짜를 선택하거나 기존 기록을 수정해주세요.";
      } else if (error.response?.status === 400) {
        errorType = "입력 오류";
        errorTitle = "입력 오류";
        const serverData = error.response?.data;
        const serverMessage =
          serverData?.message || "입력한 데이터가 올바르지 않습니다.";

        // 서버에서 상세 에러 정보를 제공하는 경우
        if (serverData?.errors) {
          // 필드별 에러 메시지가 있는 경우
          const fieldErrors = Object.entries(serverData.errors)
            .map(([field, message]) => `  • ${field}: ${message}`)
            .join("\n");
          errorMessage = `${serverMessage}\n\n서버 검증 실패 필드:\n${fieldErrors}`;
        } else if (serverData?.field) {
          // 특정 필드가 문제인 경우
          errorMessage = `${serverMessage}\n\n문제 필드: ${serverData.field}`;
        } else {
          // 전송한 페이로드 정보와 검증 가이드 포함
          try {
            const payloadInfo = finalPayload
              ? `\n\n📤 전송한 값:\n${Object.entries(finalPayload)
                  .map(([key, value]) => `  ${key}: ${value}`)
                  .join("\n")}`
              : "";

            // 검증 가이드 추가
            const validationGuide = finalPayload
              ? getValidationGuide(finalPayload)
              : "";

            // 서버 응답의 상세 정보
            const serverDetails = serverData?.code
              ? `\n\n서버 에러 코드: ${serverData.code}`
              : "";

            // 클라이언트 검증 통과했는데도 서버가 거부하는 경우
            const analysis =
              clientValidation.includes("✓") && !clientValidation.includes("❌")
                ? `\n\n⚠ 분석: 클라이언트 검증은 통과했지만 서버가 거부했습니다.\n이는 서버 측 검증 규칙이 더 엄격하거나 다른 필드에 문제가 있을 수 있습니다.`
                : "";

            errorMessage = `${serverMessage}${serverDetails}${analysis}\n\n원인: 서버가 입력값을 거부했습니다.${clientValidation}${payloadInfo}${validationGuide}`;
          } catch (e) {
            // payloadInfo 생성 실패 시 기본 메시지만 표시
            errorMessage = `${serverMessage}${clientValidation}`;
          }
        }
      } else if (error.response?.status === 401) {
        errorType = "인증 오류";
        errorTitle = "인증 오류";
        errorMessage = "인증이 필요합니다.\n\n다시 로그인해주세요.";
      } else if (error.response?.status === 500) {
        errorType = "서버 오류";
        errorTitle = "서버 오류";
        const serverMessage =
          error.response?.data?.message || "서버 내부 오류가 발생했습니다.";
        errorMessage = `${serverMessage}\n\n원인: 서버 측 문제입니다.\n\n관리자에게 문의해주세요.\n\n에러 코드: COMMON_002${clientValidation}`;
      } else if (error.message?.includes("Network") || !error.response) {
        errorType = "네트워크 오류";
        errorTitle = "네트워크 오류";
        errorMessage =
          "네트워크 연결에 실패했습니다.\n\n원인: 인터넷 연결 문제 또는 서버 접속 불가\n\n인터넷 연결을 확인해주세요.";
      } else {
        errorType = "알 수 없는 오류";
        errorMessage = `알 수 없는 오류가 발생했습니다.\n\n상태 코드: ${
          error.response?.status || "N/A"
        }\n에러 메시지: ${error.message}${clientValidation}`;
      }

      // 최종 에러 메시지에 타입 표시
      const finalMessage = `[${errorType}]\n\n${errorMessage}`;

      Alert.alert(errorTitle, finalMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>인바디 수기 입력</Text>
        <View style={{ width: 28 }} />
      </View>
      {loading && (
        <View style={styles.loadingContainer} pointerEvents="none">
          <ActivityIndicator size="large" color="#d6ff4b" />
          <Text style={styles.loadingText}>저장 중...</Text>
        </View>
      )}
      <InBodyManualForm
        key={formKey}
        onSubmit={handleSubmit}
        defaultValues={currentDefaultValues || defaultValues}
        inBodyDates={inBodyDates}
        onDateChange={handleDateChange}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1c",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#ffffff",
  },
});

export default InBodyManualScreen;
