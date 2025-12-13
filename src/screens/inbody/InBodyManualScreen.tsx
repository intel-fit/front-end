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
import { postInBody, patchInBody, getInBodyList, getLatestInBody, getInBodyByDatePath, InBodyPayload } from "../../utils/inbodyApi";
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
    const segmentalMuscleAnalysis = inBodyData.segmentalMuscleAnalysis || {};
    const segmentalFatAnalysis = inBodyData.segmentalFatAnalysis || {};

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

    // 부위별 근육량: 직접 필드 우선, 없으면 segmentalMuscleAnalysis 객체에서 가져오기
    const rArmMuscle = inBodyData.rightArmMuscle?.toString() || 
                       segmentalMuscleAnalysis.rightArm?.toString() || "";
    const lArmMuscle = inBodyData.leftArmMuscle?.toString() || 
                       segmentalMuscleAnalysis.leftArm?.toString() || "";
    const trunkMuscle = inBodyData.trunkMuscle?.toString() || 
                        segmentalMuscleAnalysis.trunk?.toString() || "";
    const rLegMuscle = inBodyData.rightLegMuscle?.toString() || 
                       segmentalMuscleAnalysis.rightLeg?.toString() || "";
    const lLegMuscle = inBodyData.leftLegMuscle?.toString() || 
                       segmentalMuscleAnalysis.leftLeg?.toString() || "";

    // 부위별 체지방량: 직접 필드 우선, 없으면 segmentalFatAnalysis 객체에서 가져오기
    // null/undefined 체크 후 toString() 호출
    const getFatValue = (directValue: any, segmentalValue: any): string => {
      if (directValue !== null && directValue !== undefined) {
        return directValue.toString();
      }
      if (segmentalValue !== null && segmentalValue !== undefined) {
        return segmentalValue.toString();
      }
      return "";
    };
    
    const rArmFat = getFatValue(inBodyData.rightArmFat, segmentalFatAnalysis.rightArm);
    const lArmFat = getFatValue(inBodyData.leftArmFat, segmentalFatAnalysis.leftArm);
    const trunkFat = getFatValue(inBodyData.trunkFat, segmentalFatAnalysis.trunk);
    const rLegFat = getFatValue(inBodyData.rightLegFat, segmentalFatAnalysis.rightLeg);
    const lLegFat = getFatValue(inBodyData.leftLegFat, segmentalFatAnalysis.leftLeg);

    console.log("[INBODY MANUAL] 폼 값 변환:", {
      hasSegmentalMuscleAnalysis: !!segmentalMuscleAnalysis && Object.keys(segmentalMuscleAnalysis).length > 0,
      hasSegmentalFatAnalysis: !!segmentalFatAnalysis && Object.keys(segmentalFatAnalysis).length > 0,
      segmentalMuscleAnalysis,
      segmentalFatAnalysis,
      rArmMuscle,
      lArmMuscle,
      trunkMuscle,
      rLegMuscle,
      lLegMuscle,
      rArmFat,
      lArmFat,
      trunkFat,
      rLegFat,
      lLegFat,
    });

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
      rArm: rArmMuscle,
      lArm: lArmMuscle,
      trunk: trunkMuscle,
      rLeg: rLegMuscle,
      lLeg: lLegMuscle,
      rArmFat: rArmFat,
      lArmFat: lArmFat,
      trunkFat: trunkFat,
      rLegFat: rLegFat,
      lLegFat: lLegFat,
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
      console.log("[INBODY MANUAL] 날짜 변경, 해당 날짜 기록 확인 중:", date);
      
      // 날짜 형식 정규화 (YYYY-MM-DD)
      const normalizedDate = normalizeDateForComparison(date);
      
      // 날짜별 조회 API로 해당 날짜의 기록 확인
      let dateRecord = null;
      try {
        dateRecord = await getInBodyByDatePath(normalizedDate);
        console.log("[INBODY MANUAL] 날짜별 조회 결과:", {
          hasRecord: !!dateRecord,
          recordId: dateRecord?.id || dateRecord?.inBody?.id,
          success: dateRecord?.success,
        });
      } catch (error: any) {
        // 400/404는 데이터 없음으로 처리 (에러 아님)
        const status = error?.response?.status;
        if (status === 400 || status === 404) {
          console.log("[INBODY MANUAL] 해당 날짜에 기록 없음:", normalizedDate);
        } else {
          console.warn("[INBODY MANUAL] 날짜별 조회 중 에러:", error);
        }
      }
      
      // 날짜별 조회에서 기록을 찾은 경우
      if (dateRecord) {
        const recordData = dateRecord?.success ? dateRecord.inBody : dateRecord;
        const recordId = recordData?.id || dateRecord?.id;
        
        if (recordData && recordId) {
          console.log("[INBODY MANUAL] 기존 기록 발견, ID:", recordId);
          console.log("[INBODY MANUAL] 기록 데이터:", {
            hasSegmentalMuscleAnalysis: !!recordData.segmentalMuscleAnalysis,
            hasSegmentalFatAnalysis: !!recordData.segmentalFatAnalysis,
            segmentalMuscleAnalysis: recordData.segmentalMuscleAnalysis,
            segmentalFatAnalysis: recordData.segmentalFatAnalysis,
            rightArmFat: recordData.rightArmFat,
            leftArmFat: recordData.leftArmFat,
            trunkFat: recordData.trunkFat,
            rightLegFat: recordData.rightLegFat,
            leftLegFat: recordData.leftLegFat,
          });
          
          // 기존 기록 ID 저장
          setCurrentInBodyId(recordId);
          
          // API 응답을 폼 형식으로 변환
          const formValues = convertInBodyToFormValues(recordData);
          console.log("[INBODY MANUAL] 변환된 폼 값:", {
            rArmFat: formValues.rArmFat,
            lArmFat: formValues.lArmFat,
            trunkFat: formValues.trunkFat,
            rLegFat: formValues.rLegFat,
            lLegFat: formValues.lLegFat,
          });
          
          setCurrentDefaultValues(formValues);
          
          // 폼 리마운트하여 새 값 적용
          setFormKey((prev) => prev + 1);
          
          Alert.alert(
            "기존 기록 발견",
            "해당 날짜에 기존 인바디 기록이 있습니다.\n기록을 수정할 수 있습니다.",
            [{ text: "확인" }]
          );
          return;
        }
      }
      
      // 날짜별 조회에서 기록을 찾지 못한 경우, 최신 기록 확인 (fallback)
      console.log("[INBODY MANUAL] 날짜별 조회에서 기록 없음, 최신 기록 확인 중");
      const latestRecord = await getLatestInBody();
      
      if (latestRecord) {
        const latestData = latestRecord?.success ? latestRecord.inBody : latestRecord;
        const latestDate = latestData?.measurementDate;
        
        if (latestDate) {
          const normalizedLatestDate = normalizeDateForComparison(latestDate);
          
          if (normalizedLatestDate === normalizedDate) {
            // 최신 기록의 날짜가 선택한 날짜와 일치하는 경우
            const recordId = latestData.id;
            console.log("[INBODY MANUAL] 최신 기록의 날짜가 일치, ID:", recordId);
            
            setCurrentInBodyId(recordId);
            const formValues = convertInBodyToFormValues(latestData);
            setCurrentDefaultValues(formValues);
            setFormKey((prev) => prev + 1);
            
            Alert.alert(
              "기존 기록 발견",
              "해당 날짜에 기존 인바디 기록이 있습니다.\n기록을 수정할 수 있습니다.",
              [{ text: "확인" }]
            );
            return;
          }
        }
      }
      
      // 기록이 없으면 날짜만 변경하고 나머지 데이터는 유지
      console.log("[INBODY MANUAL] 기존 기록 없음, 날짜만 변경하고 입력 데이터 유지");
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
      console.warn("[INBODY MANUAL] 날짜 변경 시 기록 확인 중 에러:", error);
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

      // 날짜 검증 제거: 과거 날짜도 저장 가능하도록 변경

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
        // 날짜별 조회 API로 기존 기록을 찾아서 자동으로 PATCH로 재시도 (재저장 허용)
        if (!existingInBodyId && e?.response?.status === 409) {
          console.log("[INBODY] 409 에러 발생, 날짜별 조회로 기존 기록 찾아 자동 업데이트 시도");
          
          // 날짜 형식 정규화 (YYYY-MM-DD)
          const normalizedDate = normalizeDateForComparison(payload.measurementDate || "");
          
          try {
            // 날짜별 조회 API로 기존 기록 찾기
            const existingRecord = await getInBodyByDatePath(normalizedDate);
            
            if (existingRecord?.id || existingRecord?.inBody?.id) {
              const foundInBodyId = existingRecord.id || existingRecord.inBody?.id;
              console.log("[INBODY] 날짜별 조회로 기존 기록 ID 발견, 자동으로 PATCH로 업데이트:", foundInBodyId);
              try {
                response = await patchInBody(foundInBodyId, payload);
                existingInBodyId = foundInBodyId; // 성공 시 ID 저장
                console.log("[INBODY] 기존 기록 자동 업데이트 성공");
              } catch (patchError: any) {
                console.error("[INBODY] PATCH 재시도 실패:", patchError);
                throw patchError;
              }
            } else {
              // 날짜별 조회에서 기록을 찾지 못한 경우, 에러 응답에서 ID 추출 시도
              console.log("[INBODY] 날짜별 조회에서 기록을 찾지 못함, 에러 응답에서 ID 추출 시도");
              const errorData = e.response?.data;
              let foundInBodyId: number | string | undefined;
              
              // 여러 가능한 경로에서 ID 찾기
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
              }
              
              if (foundInBodyId) {
                console.log("[INBODY] 에러 응답에서 기존 기록 ID 발견, 자동으로 PATCH로 업데이트:", foundInBodyId);
                try {
                  response = await patchInBody(foundInBodyId, payload);
                  existingInBodyId = foundInBodyId;
                  console.log("[INBODY] 기존 기록 자동 업데이트 성공");
                } catch (patchError: any) {
                  console.error("[INBODY] PATCH 재시도 실패:", patchError);
                  throw patchError;
                }
              } else {
                // ID를 찾지 못한 경우, 원래 에러를 throw하여 상위에서 처리
                console.warn("[INBODY] 기존 기록 ID를 찾지 못함, 원래 에러 throw");
                throw e;
              }
            }
          } catch (dateError: any) {
            console.error("[INBODY] 날짜별 조회 실패:", dateError);
            // 날짜별 조회가 실패한 경우, 원래 409 에러를 throw하여 상위에서 처리
            throw e;
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
