import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";
import { LineChart, BarChart } from "react-native-chart-kit";
import {
  getLatestInBody,
  getInBodyByDatePath,
  getInBodyComment,
  getInBodyList,
  getInBodyHistory,
  InBodyHistoryItem,
} from "../../utils/inbodyApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eventBus } from "../../utils/eventBus";
import InBodyCalendarModal from "../../components/common/InBodyCalendarModal";
import { ROUTES } from "../../constants/routes";
import { ACCESS_TOKEN_KEY } from "../../services/apiConfig";

const InBodyScreen = ({ navigation, route }: any) => {
  const [inBodyData, setInBodyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "analysis">("info");
  const [aiComment, setAiComment] = useState<string>("");
  const [aiCommentLoading, setAiCommentLoading] = useState(false);
  const [historyData, setHistoryData] = useState<InBodyHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const fromPhotoUpload = route?.params?.fromPhotoUpload;

  const parseNumericValue = useCallback((value: any): number | undefined => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "number" && isFinite(value)) {
      return Math.round(value * 100) / 100;
    }
    if (typeof value === "string") {
      const match = value.match(/-?\d+(\.\d+)?/);
      if (!match) return undefined;
      const parsed = parseFloat(match[0]);
      return isFinite(parsed) ? Math.round(parsed * 100) / 100 : undefined;
    }
    return undefined;
  }, []);

  const parseRangeRatio = useCallback(
    (rawValue: any): number | null => {
      if (typeof rawValue !== "string") {
        return null;
      }

      const value = parseNumericValue(rawValue);
      if (value === undefined) {
        return null;
      }

      const rangeMatch = rawValue.match(/\(([^)]+)\)/);
      if (!rangeMatch) {
        return null;
      }

      const [minRaw, maxRaw] = rangeMatch[1]
        .split("~")
        .map((part) => parseNumericValue(part));

      if (
        minRaw === undefined ||
        maxRaw === undefined ||
        !isFinite(minRaw) ||
        !isFinite(maxRaw) ||
        maxRaw <= minRaw
      ) {
        return null;
      }

      const ratio = (value - minRaw) / (maxRaw - minRaw);
      return Math.max(0, Math.min(1, ratio));
    },
    [parseNumericValue]
  );

  const resolveBarPercentage = useCallback(
    (rawValue: any, status?: string) => {
      const clamp = (percent: number) =>
        Math.min(95, Math.max(10, Math.round(percent)));

      const ratio = parseRangeRatio(rawValue);
      if (ratio !== null) {
        return clamp(45 + ratio * 45);
      }

      const normalizedStatus = (status ?? "")
        .toString()
        .replace(/\s+/g, "")
        .toLowerCase();

      if (normalizedStatus.length > 0) {
        if (
          normalizedStatus.includes("이상") ||
          normalizedStatus.includes("높음") ||
          normalizedStatus.includes("증가") ||
          normalizedStatus.includes("above") ||
          normalizedStatus.includes("high")
        ) {
          return clamp(85);
        }
        if (
          normalizedStatus.includes("이하") ||
          normalizedStatus.includes("낮음") ||
          normalizedStatus.includes("감소") ||
          normalizedStatus.includes("below") ||
          normalizedStatus.includes("low")
        ) {
          return clamp(30);
        }
        if (
          normalizedStatus.includes("표준") ||
          normalizedStatus.includes("정상") ||
          normalizedStatus.includes("normal")
        ) {
          return clamp(55);
        }
      }

      return clamp(55);
    },
    [parseRangeRatio]
  );

  // 날짜별 인바디 정보 조회
  const fetchInBodyDataByDate = useCallback(async (date: Date) => {
    // 날짜를 YYYY-MM-DD 형식으로 변환 (에러 처리에서도 사용하기 위해 밖으로 이동)
    const dateStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    try {
      setLoading(true);

      console.log("[INBODY SCREEN] 날짜별 인바디 데이터 조회 시작:", dateStr);
      const response = await getInBodyByDatePath(dateStr);

      console.log("[INBODY SCREEN] 날짜별 API 응답:", {
        hasResponse: !!response,
        responseType: typeof response,
        hasInBody: !!response?.inBody,
        responseKeys: response ? Object.keys(response) : [],
      });

      // 응답 구조 처리: { success: true, inBody: {...} } 또는 직접 inBody 객체
      const data = response?.success ? response.inBody : response;

      // segmentalFatAnalysis를 여러 위치에서 찾기 (API 수정 대응)
      const segmentalFatAnalysis =
        data?.segmentalFatAnalysis ||
        response?.segmentalFatAnalysis ||
        response?.inBody?.segmentalFatAnalysis ||
        null;

      // data에 segmentalFatAnalysis가 없으면 추가
      const finalData =
        segmentalFatAnalysis && !data?.segmentalFatAnalysis
          ? { ...data, segmentalFatAnalysis }
          : data;

      console.log("[INBODY SCREEN] 처리된 날짜별 데이터:", {
        hasData: !!finalData,
        hasMeasurementDate: !!finalData?.measurementDate,
        measurementDate: finalData?.measurementDate,
        dataKeys: finalData ? Object.keys(finalData) : [],
      });

      // 전체 응답 구조 확인 (segmentalFatAnalysis 찾기)
      console.log("[INBODY SCREEN] 날짜별 전체 응답 구조 확인:", {
        responseSuccess: response?.success,
        responseInBody: response?.inBody ? Object.keys(response.inBody) : null,
        responseKeys: response ? Object.keys(response) : [],
        hasSegmentalFatAnalysisInResponse: !!response?.segmentalFatAnalysis,
        hasSegmentalFatAnalysisInInBody:
          !!response?.inBody?.segmentalFatAnalysis,
        hasSegmentalFatAnalysisInData: !!finalData?.segmentalFatAnalysis,
        segmentalFatAnalysisInResponse: response?.segmentalFatAnalysis,
        segmentalFatAnalysisInInBody: response?.inBody?.segmentalFatAnalysis,
        segmentalFatAnalysisInData: finalData?.segmentalFatAnalysis,
        segmentalFatAnalysisFound: segmentalFatAnalysis,
      });

      if (finalData && finalData.measurementDate) {
        const normalizedDate = finalData.measurementDate.includes(".")
          ? finalData.measurementDate
          : finalData.measurementDate.replace(/-/g, ".");

        setInBodyData({
          ...finalData,
          measurementDate: normalizedDate,
        });
        console.log("[INBODY SCREEN] 날짜별 인바디 데이터 설정 완료");
        console.log("[INBODY SCREEN] 날짜별 segmentalFatAnalysis 확인:", {
          segmentalFatAnalysis: finalData.segmentalFatAnalysis,
          hasSegmentalFatAnalysis: !!finalData.segmentalFatAnalysis,
          rightArm: finalData.segmentalFatAnalysis?.rightArm,
          leftArm: finalData.segmentalFatAnalysis?.leftArm,
          trunk: finalData.segmentalFatAnalysis?.trunk,
          rightLeg: finalData.segmentalFatAnalysis?.rightLeg,
          leftLeg: finalData.segmentalFatAnalysis?.leftLeg,
        });
      } else {
        // 데이터 없음은 정상적인 케이스 (에러 아님)
        console.log("[INBODY SCREEN] 해당 날짜에 인바디 기록 없음:", dateStr);
        setInBodyData(null);
      }
    } catch (error: any) {
      // 400/404는 데이터 없음으로 처리 (에러 아님)
      const status = error?.response?.status;
      if (status === 400 || status === 404) {
        console.log("[INBODY SCREEN] 해당 날짜에 인바디 기록 없음:", {
          date: dateStr,
          status,
        });
        setInBodyData(null);
      } else {
        // 그 외 에러만 로그 (에러 메시지는 표시하지 않음)
        console.warn("[INBODY SCREEN] 날짜별 API 데이터 로드 실패:", {
          message: error?.message,
          status,
          statusText: error?.response?.statusText,
        });
        setInBodyData(null);
      }
    } finally {
      setLoading(false);
      console.log("[INBODY SCREEN] 날짜별 로딩 완료");
    }
  }, []);

  // API로 최신 인바디 정보 조회 (항상 가장 최신 저장 이력 표시)
  const fetchInBodyData = useCallback(async () => {
    try {
      setLoading(true);

      console.log("[INBODY SCREEN] 최신 인바디 데이터 조회 시작");
      const response = await getLatestInBody();

      console.log("[INBODY SCREEN] API 응답:", {
        hasResponse: !!response,
        responseType: typeof response,
        isSuccess: response?.success,
        hasInBody: !!response?.inBody,
        responseKeys: response ? Object.keys(response) : [],
      });

      // 응답 구조 처리: { success: true, inBody: {...} } 또는 직접 inBody 객체
      const latest = response?.success ? response.inBody : response;

      // segmentalFatAnalysis를 여러 위치에서 찾기 (API 수정 대응)
      const segmentalFatAnalysis =
        latest?.segmentalFatAnalysis ||
        response?.segmentalFatAnalysis ||
        response?.inBody?.segmentalFatAnalysis ||
        null;

      // latest에 segmentalFatAnalysis가 없으면 추가
      const finalLatest =
        segmentalFatAnalysis && !latest?.segmentalFatAnalysis
          ? { ...latest, segmentalFatAnalysis }
          : latest;

      console.log("[INBODY SCREEN] 처리된 latest 데이터:", {
        hasLatest: !!finalLatest,
        hasMeasurementDate: !!finalLatest?.measurementDate,
        measurementDate: finalLatest?.measurementDate,
        latestKeys: finalLatest ? Object.keys(finalLatest) : [],
      });

      // 전체 응답 구조 확인 (segmentalFatAnalysis 찾기)
      console.log("[INBODY SCREEN] 최신 전체 응답 구조 확인:", {
        responseSuccess: response?.success,
        responseInBody: response?.inBody ? Object.keys(response.inBody) : null,
        responseKeys: response ? Object.keys(response) : [],
        hasSegmentalFatAnalysisInResponse: !!response?.segmentalFatAnalysis,
        hasSegmentalFatAnalysisInInBody:
          !!response?.inBody?.segmentalFatAnalysis,
        hasSegmentalFatAnalysisInLatest: !!finalLatest?.segmentalFatAnalysis,
        segmentalFatAnalysisInResponse: response?.segmentalFatAnalysis,
        segmentalFatAnalysisInInBody: response?.inBody?.segmentalFatAnalysis,
        segmentalFatAnalysisInLatest: finalLatest?.segmentalFatAnalysis,
        segmentalFatAnalysisFound: segmentalFatAnalysis,
      });

      if (finalLatest && finalLatest.measurementDate) {
        const normalizedDate = finalLatest.measurementDate.includes(".")
          ? finalLatest.measurementDate
          : finalLatest.measurementDate.replace(/-/g, ".");

        console.log("[INBODY][FETCH][LATEST]", {
          normalizedDate,
          source: finalLatest?.source || "api",
          segmental: {
            segmentalMuscleAnalysis: finalLatest?.segmentalMuscleAnalysis,
            segmentalMuscleMass: finalLatest?.segmentalMuscleMass,
            rightArmMuscle: finalLatest?.rightArmMuscle,
            leftArmMuscle: finalLatest?.leftArmMuscle,
            trunkMuscle: finalLatest?.trunkMuscle,
            rightLegMuscle: finalLatest?.rightLegMuscle,
            leftLegMuscle: finalLatest?.leftLegMuscle,
          },
        });
        if (__DEV__) {
          try {
            console.log(
              "[INBODY][FETCH][LATEST][RAW]",
              JSON.stringify(finalLatest, null, 2)
            );
          } catch (error) {
            console.log("[INBODY][FETCH][LATEST][RAW] stringify 실패", error);
          }
        }

        const data = {
          ...finalLatest,
          measurementDate: normalizedDate,
        };
        setInBodyData(data);

        // 디버깅: segmentalFatAnalysis 확인
        console.log("[INBODY SCREEN] 최신 데이터 segmentalFatAnalysis 확인:", {
          segmentalFatAnalysis: data.segmentalFatAnalysis,
          hasSegmentalFatAnalysis: !!data.segmentalFatAnalysis,
          rightArm: data.segmentalFatAnalysis?.rightArm,
          leftArm: data.segmentalFatAnalysis?.leftArm,
          trunk: data.segmentalFatAnalysis?.trunk,
          rightLeg: data.segmentalFatAnalysis?.rightLeg,
          leftLeg: data.segmentalFatAnalysis?.leftLeg,
        });

        // 선택된 날짜가 없으면 최신 데이터의 날짜로 설정
        if (!selectedDate) {
          const dateStr = normalizedDate.replace(/\./g, "-");
          const [year, month, day] = dateStr.split("-");
          if (year && month && day) {
            setSelectedDate(
              new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
            );
          }
        }

        console.log("[INBODY SCREEN] 인바디 데이터 설정 완료");
        console.log("[INBODY SCREEN] 부위별 근육 데이터:", {
          rightArmMuscle: latest?.rightArmMuscle,
          leftArmMuscle: latest?.leftArmMuscle,
          trunkMuscle: latest?.trunkMuscle,
          rightLegMuscle: latest?.rightLegMuscle,
          leftLegMuscle: latest?.leftLegMuscle,
        });
        console.log("[INBODY SCREEN] 부위별 체지방 데이터:", {
          rightArmFat: latest?.rightArmFat,
          leftArmFat: latest?.leftArmFat,
          trunkFat: latest?.trunkFat,
          rightLegFat: latest?.rightLegFat,
          leftLegFat: latest?.leftLegFat,
          segmentalFatAnalysis: latest?.segmentalFatAnalysis,
          hasSegmentalFatAnalysis: !!latest?.segmentalFatAnalysis,
        });
      } else {
        // 데이터 없음은 정상적인 케이스 (에러 아님)
        console.log("[INBODY SCREEN] 인바디 기록 없음");
        setInBodyData(null);
      }
    } catch (error: any) {
      // 400/404는 데이터 없음으로 처리 (에러 아님)
      const status = error?.response?.status;
      if (status === 400 || status === 404) {
        console.log("[INBODY SCREEN] 인바디 기록 없음:", {
          status,
        });
        setInBodyData(null);
      } else {
        // 그 외 에러만 경고 로그 (에러 메시지는 표시하지 않음)
        console.warn("[INBODY SCREEN] API 데이터 로드 실패:", {
          message: error?.message,
          status,
          statusText: error?.response?.statusText,
        });
        setInBodyData(null);
      }
    } finally {
      setLoading(false);
      console.log("[INBODY SCREEN] 로딩 완료");
    }
  }, []);

  // 화면이 포커스될 때마다 최신 데이터 조회 (날짜가 선택되지 않은 경우만)
  useFocusEffect(
    useCallback(() => {
      if (!selectedDate) {
        fetchInBodyData();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate])
  );

  // 날짜 변경 핸들러
  const handleDateChange = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      fetchInBodyDataByDate(date);
    },
    [fetchInBodyDataByDate]
  );

  // 날짜 네비게이터에서 날짜 변경 시
  const handleDateNavigatorChange = useCallback(
    (date: Date) => {
      handleDateChange(date);
    },
    [handleDateChange]
  );

  // 캘린더 모달에서 날짜 선택 시
  const handleCalendarDateSelect = useCallback(
    (date: Date) => {
      const dateStr = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      console.log("[INBODY SCREEN] 캘린더에서 날짜 선택:", {
        date: dateStr,
      });
      handleDateChange(date);
      setShowCalendarModal(false);
    },
    [handleDateChange] // availableDates 제거하여 무한 루프 방지
  );

  // 날짜 정규화 헬퍼 함수 (YYYY-MM-DD 형식으로 통일)
  const normalizeDateForComparison = useCallback((date: string): string => {
    if (!date) return "";
    // 점(.)을 하이픈(-)으로 변경
    return date.replace(/\./g, "-");
  }, []);

  // 사용 가능한 날짜 목록 로드 (모든 인바디 기록 날짜)
  const loadAvailableDates = useCallback(async () => {
    try {
      const inBodyList = await getInBodyList();
      const records = Array.isArray(inBodyList)
        ? inBodyList
        : inBodyList?.data || inBodyList?.inBodyList || [];

      const dateSet = new Set<string>();
      records.forEach((r: any) => {
        const dateStr = r.measurementDate || r.date || r.measurement_date;
        if (!dateStr) return;

        // 날짜 형식 정규화 (YYYY-MM-DD 또는 YYYY.MM.DD → YYYY.MM.DD)
        let normalizedDate = dateStr.replace(/\./g, "-").split("T")[0];
        // YYYY-MM-DD를 YYYY.MM.DD로 변환 (캘린더에서 사용하는 형식)
        normalizedDate = normalizedDate.replace(/-/g, ".");
        dateSet.add(normalizedDate);
      });

      const sortedDates = Array.from(dateSet).sort();
      console.log("[INBODY SCREEN] 사용 가능한 날짜 목록:", sortedDates);
      setAvailableDates(sortedDates);
    } catch (error) {
      console.error("[INBODY SCREEN] 날짜 목록 로드 실패:", error);
      setAvailableDates([]);
    }
  }, []);

  // 인바디 업데이트 이벤트 구독
  useEffect(() => {
    const unsubscribe = eventBus.on("inbodyUpdated", async (payload) => {
      console.log(
        "[INBODY SCREEN] 인바디 업데이트 이벤트 수신, 데이터 새로고침",
        payload
      );

      // 날짜 목록도 새로고침
      loadAvailableDates();

      try {
        setLoading(true);

        // 저장된 날짜가 있으면 날짜별 조회 사용 (더 정확함)
        if (payload.measurementDate) {
          // 날짜 형식 정규화 (YYYY-MM-DD)
          const normalizedDate = normalizeDateForComparison(
            payload.measurementDate
          );

          // 약간의 딜레이를 주어 저장이 완료되도록 함
          await new Promise((resolve) => setTimeout(resolve, 500));

          console.log(
            "[INBODY SCREEN] 저장된 날짜로 데이터 조회:",
            normalizedDate
          );
          const dateRecord = await getInBodyByDatePath(normalizedDate);

          if (dateRecord) {
            const dateData = dateRecord?.success
              ? dateRecord.inBody
              : dateRecord;

            if (dateData && dateData.measurementDate) {
              const normalizedDateStr = dateData.measurementDate.includes(".")
                ? dateData.measurementDate
                : dateData.measurementDate.replace(/-/g, ".");

              // 선택된 날짜도 업데이트
              const dateStr = normalizedDate.replace(/-/g, ".");
              const [year, month, day] = dateStr.split(".");
              if (year && month && day) {
                setSelectedDate(
                  new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                );
              }

              setInBodyData({
                ...dateData,
                measurementDate: normalizedDateStr,
              });
              console.log("[INBODY SCREEN] 저장된 날짜의 데이터 로드 완료");

              return;
            }
          }
        }

        // 날짜가 없거나 날짜별 조회 실패 시 최신 기록 조회
        console.log("[INBODY SCREEN] 최신 기록 조회 시도");
        const latestRecord = await getLatestInBody();

        if (latestRecord) {
          const latestData = latestRecord?.success
            ? latestRecord.inBody
            : latestRecord;

          if (latestData && latestData.measurementDate) {
            const normalizedDate = latestData.measurementDate.includes(".")
              ? latestData.measurementDate
              : latestData.measurementDate.replace(/-/g, ".");

            setInBodyData({
              ...latestData,
              measurementDate: normalizedDate,
            });
            console.log("[INBODY SCREEN] 최신 데이터 로드 완료");
          } else {
            setInBodyData(null);
          }
        } else {
          setInBodyData(null);
        }
      } catch (error: any) {
        // 400/404는 데이터 없음으로 처리 (에러 아님)
        const status = error?.response?.status;
        if (status === 400 || status === 404) {
          console.log("[INBODY SCREEN] 인바디 기록 없음:", {
            status,
          });
          setInBodyData(null);
        } else {
          // 그 외 에러만 경고 로그 (에러 메시지는 표시하지 않음)
          console.warn("[INBODY SCREEN] 데이터 조회 실패:", {
            message: error?.message,
            status,
            statusText: error?.response?.statusText,
          });
          // 에러 발생 시에도 기존 데이터는 유지 (사용자가 볼 수 있도록)
          // setInBodyData(null); // 주석 처리하여 기존 데이터 유지
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizeDateForComparison, loadAvailableDates]);

  // API 데이터에서 값 추출 헬퍼 함수
  const extractValue = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return "N/A";
    if (typeof value === "number") {
      if (!isFinite(value)) return "N/A";
      return `${Math.round(value * 10) / 10}`;
    }
    const valueStr = String(value);
    const match = valueStr.match(/^([\d.]+)/);
    return match ? match[1] : valueStr;
  };

  const extractRange = (value: string | number | undefined): string => {
    if (value === undefined || value === null) return "";
    if (typeof value === "number") return "";
    const match = value.match(/\(([^)]+)\)/);
    return match ? `(${match[1]})` : "";
  };

  useEffect(() => {
    (async () => {
      try {
        const storedUserName = await AsyncStorage.getItem("userName");
        if (storedUserName) {
          setUserName(storedUserName);
        }
      } catch (error) {
        console.error("[INBODY] 사용자 정보 로드 실패:", error);
      }
    })();
  }, []);

  // AI 코멘트 로드
  const loadAiComment = useCallback(async () => {
    // 인바디 데이터가 없어도 API 호출 시도

    try {
      setAiCommentLoading(true);

      // user_id 가져오기 (JWT에서)
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      let userId: string | null = null;
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(jsonPayload);
          userId = payload.sub || payload.userPk?.toString() || null;
          console.log("[INBODY][COMMENT] JWT에서 추출한 userId:", {
            userId,
            userIdType: typeof userId,
            payloadSub: payload.sub,
            payloadUserPk: payload.userPk,
          });
        } catch (e) {
          console.error("[INBODY][COMMENT] JWT 디코딩 실패:", e);
        }
      }

      if (!userId || typeof userId !== "string") {
        console.log("[INBODY][COMMENT] user_id 없음 또는 유효하지 않음:", {
          userId,
          userIdType: typeof userId,
        });
        setAiComment("");
        return;
      }

      // 인바디 목록 가져오기 (period 계산용)
      let period = "";
      try {
        const inBodyList = await getInBodyList();
        const records = Array.isArray(inBodyList)
          ? inBodyList
          : inBodyList?.data || inBodyList?.inBodyList || [];

        if (records.length > 0) {
          const dates = records
            .map((r: any) => {
              const dateStr = r.measurementDate || r.date || r.measurement_date;
              if (!dateStr) return null;
              return dateStr.replace(/\./g, "-").split("T")[0];
            })
            .filter((d: string | null) => d !== null)
            .sort();

          if (dates.length > 0) {
            const firstDate = dates[0];
            const lastDate = dates[dates.length - 1];
            period = `${firstDate} ~ ${lastDate}`;
          }
        }
      } catch (e) {
        console.warn("[INBODY][COMMENT] 인바디 목록 조회 실패:", e);
        // period 없어도 계속 진행
      }

      // 현재 인바디 데이터에서 latest 정보 추출 (데이터가 없으면 오늘 날짜와 기본값 사용)
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      const measurementDate =
        inBodyData?.measurementDate ||
        inBodyData?.date ||
        inBodyData?.measurement_date ||
        todayStr;
      const dateStr = measurementDate
        ? measurementDate.replace(/\./g, "-").split("T")[0]
        : todayStr;

      const weight = parseNumericValue(
        inBodyData?.weight ||
          inBodyData?.bodyComposition?.weight ||
          inBodyData?.muscleFatAnalysis?.weight ||
          0
      );
      const bodyFatPercentage = parseNumericValue(
        inBodyData?.bodyFatPercentage ||
          inBodyData?.obesityAnalysis?.bodyFatPercentage ||
          inBodyData?.bodyComposition?.bodyFatPercentage ||
          inBodyData?.muscleFatAnalysis?.bodyFatPercentage ||
          inBodyData?.pbf ||
          0
      );
      const skeletalMuscleMass = parseNumericValue(
        inBodyData?.skeletalMuscleMass ||
          inBodyData?.bodyComposition?.skeletalMuscleMass ||
          inBodyData?.muscleFatAnalysis?.skeletalMuscleMass ||
          inBodyData?.smm ||
          0
      );

      // 숫자 타입 검증 및 유효성 확인
      const finalWeight =
        weight !== undefined && !isNaN(weight) && isFinite(weight) ? weight : 0;
      const finalBodyFatPercentage =
        bodyFatPercentage !== undefined &&
        !isNaN(bodyFatPercentage) &&
        isFinite(bodyFatPercentage)
          ? bodyFatPercentage
          : 0;
      const finalSkeletalMuscleMass =
        skeletalMuscleMass !== undefined &&
        !isNaN(skeletalMuscleMass) &&
        isFinite(skeletalMuscleMass)
          ? skeletalMuscleMass
          : 0;
      const finalDateStr = dateStr || todayStr;

      // ✅ 인바디 입력값이 전혀 없으면 API 호출하지 않고 코멘트도 비움
      if (
        !inBodyData ||
        (!finalWeight && !finalBodyFatPercentage && !finalSkeletalMuscleMass)
      ) {
        console.log(
          "[INBODY][COMMENT] 인바디 입력값이 없어 코멘트 API 호출 생략"
        );
        setAiComment("");
        setAiCommentLoading(false);
        return;
      }

      console.log(
        "[INBODY][COMMENT] API 호출 데이터 (인바디 데이터 없을 수 있음):",
        {
          hasInBodyData: !!inBodyData,
          weight: finalWeight,
          bodyFatPercentage: finalBodyFatPercentage,
          skeletalMuscleMass: finalSkeletalMuscleMass,
          dateStr: finalDateStr,
        }
      );

      // trend 계산 (일단 기본값으로 처리, 나중에 이전 데이터와 비교하여 계산 가능)
      const trend = {
        weight: "SAME" as const,
        body_fat_percentage: "SAME" as const,
        skeletal_muscle_mass: "SAME" as const,
      };

      // period가 없으면 현재 날짜만 사용
      if (!period) {
        period = `${finalDateStr} ~ ${finalDateStr}`;
      }

      // 숫자 타입 보장 (Number로 명시적 변환)
      const request = {
        user_id: userId,
        period: period,
        latest: {
          date: finalDateStr,
          weight: Number(finalWeight),
          body_fat_percentage: Number(finalBodyFatPercentage),
          skeletal_muscle_mass: Number(finalSkeletalMuscleMass),
        },
        trend: trend,
      };

      console.log("[INBODY][COMMENT] AI 코멘트 요청:", {
        user_id: request.user_id,
        period: request.period,
        latest: {
          date: request.latest.date,
          weight: request.latest.weight,
          body_fat_percentage: request.latest.body_fat_percentage,
          skeletal_muscle_mass: request.latest.skeletal_muscle_mass,
        },
        trend: request.trend,
        // 디버깅 정보는 별도로 출력
        debug: {
          weightType: typeof request.latest.weight,
          bodyFatPercentageType: typeof request.latest.body_fat_percentage,
          skeletalMuscleMassType: typeof request.latest.skeletal_muscle_mass,
        },
      });
      const response = await getInBodyComment(request);

      if (response?.comment) {
        setAiComment(response.comment);
      } else {
        setAiComment("");
      }
    } catch (error: any) {
      console.error("[INBODY][COMMENT] AI 코멘트 로드 실패:", error);
      setAiComment("");
    } finally {
      setAiCommentLoading(false);
    }
  }, [inBodyData, parseNumericValue]);

  // 인바디 데이터가 변경될 때마다 AI 코멘트 로드 (데이터가 없어도 호출)
  useEffect(() => {
    if (activeTab === "info") {
      loadAiComment();
    }
  }, [inBodyData, activeTab, loadAiComment]);

  // 히스토리 데이터 로드
  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const data = await getInBodyHistory();
      // 날짜순으로 정렬 (오래된 것부터)
      const sorted = [...data].sort((a, b) => {
        const dateA = new Date(a.measurementDate).getTime();
        const dateB = new Date(b.measurementDate).getTime();
        return dateA - dateB;
      });
      setHistoryData(sorted);
      console.log(
        "[INBODY][HISTORY] 히스토리 데이터 로드 완료:",
        sorted.length
      );
    } catch (error: any) {
      console.error("[INBODY][HISTORY] 히스토리 로드 실패:", error);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // 분석 탭 활성화 시 히스토리 로드
  useEffect(() => {
    if (activeTab === "analysis") {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  // 화면 포커스 시 날짜 목록 새로고침
  useFocusEffect(
    useCallback(() => {
      loadAvailableDates();
    }, [loadAvailableDates])
  );

  const segmentalMuscleItems = useMemo(() => {
    if (!inBodyData) {
      return [
        { label: "오른팔", value: undefined, status: undefined },
        { label: "왼팔", value: undefined, status: undefined },
        { label: "몸통", value: undefined, status: undefined },
        { label: "오른다리", value: undefined, status: undefined },
        { label: "왼다리", value: undefined, status: undefined },
      ];
    }

    const analysis: any = inBodyData.segmentalMuscleAnalysis || {};
    const mass: any =
      inBodyData.segmentalMuscleMass ||
      inBodyData.segmentalMuscle ||
      inBodyData.segmentalLeanBodyMass ||
      {};

    const collectCandidateValues = (input: any): any[] => {
      if (input === null || input === undefined) return [];
      if (typeof input === "number" || typeof input === "string") {
        return [input];
      }
      if (Array.isArray(input)) {
        return input.flatMap((item) => collectCandidateValues(item));
      }
      if (typeof input === "object") {
        const priorityKeys = [
          "value",
          "current",
          "currentValue",
          "currentWeight",
          "currentKg",
          "weight",
          "kg",
          "mass",
          "amount",
          "score",
          "data",
        ];
        const collected: any[] = [];
        priorityKeys.forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(input, key)) {
            collected.push((input as any)[key]);
          }
        });
        Object.values(input).forEach((val) => {
          if (typeof val !== "object") {
            collected.push(val);
          }
        });
        return collected.flatMap((val) => collectCandidateValues(val));
      }
      return [];
    };

    const resolveStatusLabel = (raw: any): string | undefined => {
      if (!raw) return undefined;
      if (typeof raw === "string") return raw;
      const candidates = collectCandidateValues(raw);
      const firstString = candidates.find((candidate) => {
        if (typeof candidate !== "string") return false;
        return candidate.length > 0;
      });
      if (typeof raw.status === "string") {
        return raw.status;
      }
      return typeof firstString === "string" ? firstString : undefined;
    };

    const candidates = [
      {
        label: "오른팔",
        keys: [
          inBodyData.rightArmMuscle,
          inBodyData.muscleFatAnalysis?.rightArmMuscle,
          inBodyData.segmentalMuscleMass?.rightArm,
          inBodyData.segmentalMuscle?.rightArm,
          inBodyData.segmentalLeanBodyMass?.rightArm,
          mass.rightArm,
          analysis.rightArm,
          analysis.rightArmValue,
          ...collectCandidateValues([
            inBodyData.rightArmMuscle,
            mass.rightArm,
            analysis.rightArm,
            analysis.rightArmValue,
          ]),
        ],
        status: resolveStatusLabel(analysis.rightArm),
      },
      {
        label: "왼팔",
        keys: [
          inBodyData.leftArmMuscle,
          inBodyData.muscleFatAnalysis?.leftArmMuscle,
          inBodyData.segmentalMuscleMass?.leftArm,
          inBodyData.segmentalMuscle?.leftArm,
          inBodyData.segmentalLeanBodyMass?.leftArm,
          mass.leftArm,
          analysis.leftArm,
          analysis.leftArmValue,
          ...collectCandidateValues([
            inBodyData.leftArmMuscle,
            mass.leftArm,
            analysis.leftArm,
            analysis.leftArmValue,
          ]),
        ],
        status: resolveStatusLabel(analysis.leftArm),
      },
      {
        label: "몸통",
        keys: [
          inBodyData.trunkMuscle,
          inBodyData.muscleFatAnalysis?.trunkMuscle,
          inBodyData.segmentalMuscleMass?.trunk,
          inBodyData.segmentalMuscle?.trunk,
          inBodyData.segmentalLeanBodyMass?.trunk,
          mass.trunk,
          analysis.trunk,
          analysis.trunkValue,
          ...collectCandidateValues([
            inBodyData.trunkMuscle,
            mass.trunk,
            analysis.trunk,
            analysis.trunkValue,
          ]),
        ],
        status: resolveStatusLabel(analysis.trunk),
      },
      {
        label: "오른다리",
        keys: [
          inBodyData.rightLegMuscle,
          inBodyData.muscleFatAnalysis?.rightLegMuscle,
          inBodyData.segmentalMuscleMass?.rightLeg,
          inBodyData.segmentalMuscle?.rightLeg,
          inBodyData.segmentalLeanBodyMass?.rightLeg,
          mass.rightLeg,
          analysis.rightLeg,
          analysis.rightLegValue,
          ...collectCandidateValues([
            inBodyData.rightLegMuscle,
            mass.rightLeg,
            analysis.rightLeg,
            analysis.rightLegValue,
          ]),
        ],
        status: resolveStatusLabel(analysis.rightLeg),
      },
      {
        label: "왼다리",
        keys: [
          inBodyData.leftLegMuscle,
          inBodyData.muscleFatAnalysis?.leftLegMuscle,
          inBodyData.segmentalMuscleMass?.leftLeg,
          inBodyData.segmentalMuscle?.leftLeg,
          inBodyData.segmentalLeanBodyMass?.leftLeg,
          mass.leftLeg,
          analysis.leftLeg,
          analysis.leftLegValue,
          ...collectCandidateValues([
            inBodyData.leftLegMuscle,
            mass.leftLeg,
            analysis.leftLeg,
            analysis.leftLegValue,
          ]),
        ],
        status: resolveStatusLabel(analysis.leftLeg),
      },
    ];

    const resolved = candidates.map((item) => {
      const numericValue = item.keys
        .map((candidate) => parseNumericValue(candidate))
        .find((value) => value !== undefined);

      return {
        label: item.label,
        numericValue,
        status: item.status || "표준",
      };
    });

    return resolved.map((item) => {
      const hasNumericValue =
        item.numericValue !== undefined && !Number.isNaN(item.numericValue);
      const percentage = resolveBarPercentage(
        hasNumericValue ? item.numericValue : undefined,
        "표준"
      );

      return {
        label: item.label,
        value: hasNumericValue ? `${item.numericValue.toFixed(1)}kg` : "-",
        percentage,
        status: "표준",
      };
    });
  }, [inBodyData, parseNumericValue, resolveBarPercentage]);

  useEffect(() => {
    if (!inBodyData) {
      console.log("[INBODY][SEGMENTAL] inBodyData 없음", {
        measurementDate: null,
      });
      return;
    }

    console.log("[INBODY][SEGMENTAL] 원본 데이터", {
      measurementDate:
        inBodyData.measurementDate ||
        inBodyData.date ||
        inBodyData.measurement_date ||
        null,
      directValues: {
        rightArmMuscle: inBodyData.rightArmMuscle,
        leftArmMuscle: inBodyData.leftArmMuscle,
        trunkMuscle: inBodyData.trunkMuscle,
        rightLegMuscle: inBodyData.rightLegMuscle,
        leftLegMuscle: inBodyData.leftLegMuscle,
      },
      segmentalMuscleAnalysis: inBodyData.segmentalMuscleAnalysis,
      segmentalMuscleMass: inBodyData.segmentalMuscleMass,
      segmentalMuscle: inBodyData.segmentalMuscle,
      segmentalLeanBodyMass: inBodyData.segmentalLeanBodyMass,
      source: inBodyData.source || "unknown",
    });

    // 부위별 체지방 데이터 확인
    console.log("[INBODY][FAT] 부위별 체지방 데이터 확인:", {
      directFatValues: {
        rightArmFat: inBodyData.rightArmFat,
        leftArmFat: inBodyData.leftArmFat,
        trunkFat: inBodyData.trunkFat,
        rightLegFat: inBodyData.rightLegFat,
        leftLegFat: inBodyData.leftLegFat,
      },
      manualFatValues: {
        rArmFat: inBodyData.rArmFat,
        lArmFat: inBodyData.lArmFat,
        rLegFat: inBodyData.rLegFat,
        lLegFat: inBodyData.lLegFat,
      },
      segmentalFatAnalysis: inBodyData.segmentalFatAnalysis,
      segmentalFatAnalysisKeys: inBodyData.segmentalFatAnalysis
        ? Object.keys(inBodyData.segmentalFatAnalysis)
        : [],
      allKeys: Object.keys(inBodyData).filter(
        (k) =>
          k.toLowerCase().includes("fat") ||
          k.toLowerCase().includes("arm") ||
          k.toLowerCase().includes("leg") ||
          k.toLowerCase().includes("segmental")
      ),
    });
  }, [inBodyData]);

  useEffect(() => {
    console.log("[INBODY][SEGMENTAL] 계산된 항목", segmentalMuscleItems);
  }, [segmentalMuscleItems]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (fromPhotoUpload) {
              // 사진 입력 후 저장한 경우: 메인 탭의 분석하기 탭으로 이동 (하단 바 함께 표시)
              navigation.navigate(
                ROUTES.MAIN as never,
                {
                  screen: "Analysis",
                } as never
              );
            } else {
              // 일반적인 경우 이전 화면으로 돌아가기
              navigation.goBack();
            }
          }}
        >
          <Icon name="chevron-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>인바디 정보</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* 탭 버튼 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "info" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("info")}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "info" && styles.tabButtonTextActive,
            ]}
          >
            정보 열람
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "analysis" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("analysis")}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === "analysis" && styles.tabButtonTextActive,
            ]}
          >
            분석
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "info" ? (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* AI 코멘트 */}
          {inBodyData && (
            <View style={styles.aiCommentContainer}>
              {aiCommentLoading ? (
                <View style={styles.aiCommentLoading}>
                  <ActivityIndicator size="small" color="#E3FF7C" />
                  <Text style={styles.aiCommentLoadingText}>AI 분석 중...</Text>
                </View>
              ) : aiComment ? (
                <View style={styles.aiCommentBox}>
                  <View style={styles.aiCommentHeader}>
                    <Icon name="sparkles" size={16} color="#E3FF7C" />
                    <Text style={styles.aiCommentTitle}>AI 분석</Text>
                  </View>
                  <Text style={styles.aiCommentText}>{aiComment}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* 날짜 선택 바 (캘린더 버튼만) */}
          {inBodyData && selectedDate && (
            <View style={styles.dateNavigatorContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowCalendarModal(true)}
              >
                <Icon name="calendar-outline" size={20} color="#E3FF7C" />
                <Text style={styles.dateButtonText}>
                  {selectedDate.getFullYear()}.
                  {String(selectedDate.getMonth() + 1).padStart(2, "0")}.
                  {String(selectedDate.getDate()).padStart(2, "0")}
                </Text>
                <Icon name="chevron-down" size={16} color="#E3FF7C" />
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E3FF7C" />
              <Text style={styles.loadingText}>데이터 로딩 중...</Text>
            </View>
          ) : inBodyData ? (
            <>
              {/* 기본 정보 */}
              <View style={styles.analysisSection}>
                <Text style={styles.sectionTitle}>기본 정보</Text>
                <View style={styles.metricList}>
                  {inBodyData.measurementDate && (
                    <View style={styles.metricItem}>
                      <Text style={styles.metricName}>검사일</Text>
                      <Text style={styles.metricValue}>
                        {inBodyData.measurementDate}
                      </Text>
                      <Text style={styles.metricRange}></Text>
                    </View>
                  )}
                  {inBodyData.gender && (
                    <View style={styles.metricItem}>
                      <Text style={styles.metricName}>성별</Text>
                      <Text style={styles.metricValue}>
                        {inBodyData.gender}
                      </Text>
                      <Text style={styles.metricRange}></Text>
                    </View>
                  )}
                  {inBodyData.age && (
                    <View style={styles.metricItem}>
                      <Text style={styles.metricName}>나이</Text>
                      <Text style={styles.metricValue}>
                        {extractValue(inBodyData.age)}
                      </Text>
                      <Text style={styles.metricRange}>세</Text>
                    </View>
                  )}
                  {inBodyData.height && (
                    <View style={styles.metricItem}>
                      <Text style={styles.metricName}>신장</Text>
                      <Text style={styles.metricValue}>
                        {extractValue(inBodyData.height)}
                      </Text>
                      <Text style={styles.metricRange}>cm</Text>
                    </View>
                  )}
                  {inBodyData.weight && (
                    <View style={[styles.metricItem, styles.metricItemLast]}>
                      <Text style={styles.metricName}>체중</Text>
                      <Text style={styles.metricValue}>
                        {extractValue(
                          inBodyData.weight ||
                            inBodyData.bodyComposition?.weight ||
                            inBodyData.muscleFatAnalysis?.weight
                        )}
                      </Text>
                      <Text style={styles.metricRange}>kg</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 핵심 수치 */}
              <View style={styles.analysisSection}>
                <Text style={styles.sectionTitle}>핵심 수치</Text>
                <View style={styles.metricList}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricName}>골격근량</Text>
                    <Text style={styles.metricValue}>
                      {extractValue(
                        inBodyData.skeletalMuscleMass ||
                          inBodyData.muscleFatAnalysis?.skeletalMuscleMass
                      )}
                    </Text>
                    <Text style={styles.metricRange}>kg</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricName}>체지방량</Text>
                    <Text style={styles.metricValue}>
                      {extractValue(
                        inBodyData.bodyFatMass ||
                          inBodyData.muscleFatAnalysis?.bodyFatMass ||
                          inBodyData.bodyComposition?.bodyFatMass
                      )}
                    </Text>
                    <Text style={styles.metricRange}>kg</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricName}>체지방률</Text>
                    <Text style={styles.metricValue}>
                      {extractValue(
                        inBodyData.bodyFatPercentage ||
                          inBodyData.obesityAnalysis?.bodyFatPercentage
                      )}
                    </Text>
                    <Text style={styles.metricRange}>%</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricName}>BMI</Text>
                    <Text style={styles.metricValue}>
                      {extractValue(
                        inBodyData.bmi || inBodyData.obesityAnalysis?.bmi
                      )}
                    </Text>
                    <Text style={styles.metricRange}>kg/m²</Text>
                  </View>
                  {inBodyData.visceralFatLevel && (
                    <View style={[styles.metricItem, styles.metricItemLast]}>
                      <Text style={styles.metricName}>내장지방 레벨</Text>
                      <Text style={styles.metricValue}>
                        {extractValue(inBodyData.visceralFatLevel)}
                      </Text>
                      <Text style={styles.metricRange}></Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 체성분 분석 */}
              <View style={styles.analysisSection}>
                <Text style={styles.sectionTitle}>체성분 분석</Text>
                <View style={styles.metricList}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricName}>체수분</Text>
                    <Text style={styles.metricValue}>
                      {extractValue(inBodyData.bodyComposition?.totalBodyWater)}
                    </Text>
                    <Text style={styles.metricRange}>
                      {extractRange(inBodyData.bodyComposition?.totalBodyWater)}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricName}>단백질</Text>
                    <Text style={styles.metricValue}>
                      {extractValue(inBodyData.bodyComposition?.protein)}
                    </Text>
                    <Text style={styles.metricRange}>
                      {extractRange(inBodyData.bodyComposition?.protein)}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricName}>무기질</Text>
                    <Text style={styles.metricValue}>
                      {extractValue(inBodyData.bodyComposition?.mineral)}
                    </Text>
                    <Text style={styles.metricRange}>
                      {extractRange(inBodyData.bodyComposition?.mineral)}
                    </Text>
                  </View>
                  <View style={[styles.metricItem, styles.metricItemLast]}>
                    <Text style={styles.metricName}>체지방</Text>
                    <Text style={styles.metricValue}>
                      {extractValue(inBodyData.bodyComposition?.bodyFatMass)}
                    </Text>
                    <Text style={styles.metricRange}>
                      {extractRange(inBodyData.bodyComposition?.bodyFatMass)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 골격근 지방 분석 */}
              <View style={styles.analysisSection}>
                <Text style={styles.sectionTitle}>골격근 지방 분석</Text>
                <View style={styles.barChartList}>
                  <View style={styles.barLabelsHeader}>
                    <Text style={styles.barRangeLabel}>표준이하</Text>
                    <Text style={styles.barRangeLabel}>표준</Text>
                    <Text style={styles.barRangeLabel}>표준이상</Text>
                  </View>
                  <BarChartItem
                    label="체수분"
                    value={extractValue(
                      inBodyData.bodyComposition?.totalBodyWater
                    )}
                    percentage={resolveBarPercentage(
                      inBodyData.bodyComposition?.totalBodyWater,
                      "표준"
                    )}
                    status="표준"
                  />
                  <BarChartItem
                    label="골격근량"
                    value={
                      inBodyData.muscleFatAnalysis?.skeletalMuscleMass?.toFixed(
                        1
                      ) || "N/A"
                    }
                    percentage={resolveBarPercentage(
                      inBodyData.muscleFatAnalysis?.skeletalMuscleMass,
                      inBodyData.muscleFatAnalysis?.skeletalMuscleStatus
                    )}
                    status={
                      inBodyData.muscleFatAnalysis?.skeletalMuscleStatus ||
                      "표준"
                    }
                  />
                  <BarChartItem
                    label="체지방량"
                    value={
                      inBodyData.muscleFatAnalysis?.bodyFatMass?.toFixed(1) ||
                      "N/A"
                    }
                    percentage={resolveBarPercentage(
                      inBodyData.muscleFatAnalysis?.bodyFatMass,
                      inBodyData.muscleFatAnalysis?.bodyFatStatus
                    )}
                    status={
                      inBodyData.muscleFatAnalysis?.bodyFatStatus || "표준"
                    }
                    isLast
                  />
                </View>
              </View>

              {/* 비만 분석 */}
              <View style={styles.analysisSection}>
                <Text style={styles.sectionTitle}>비만 분석</Text>
                <View style={styles.barChartList}>
                  <View style={styles.barLabelsHeader}>
                    <Text style={styles.barRangeLabel}>표준이하</Text>
                    <Text style={styles.barRangeLabel}>표준</Text>
                    <Text style={styles.barRangeLabel}>표준이상</Text>
                  </View>
                  <BarChartItem
                    label="BMI"
                    value={inBodyData.obesityAnalysis?.bmi?.toFixed(1) || "N/A"}
                    percentage={resolveBarPercentage(
                      inBodyData.obesityAnalysis?.bmi,
                      inBodyData.obesityAnalysis?.bmiStatus
                    )}
                    status={inBodyData.obesityAnalysis?.bmiStatus || "표준"}
                  />
                  <BarChartItem
                    label="체지방률"
                    value={
                      inBodyData.obesityAnalysis?.bodyFatPercentage?.toFixed(
                        1
                      ) || "N/A"
                    }
                    percentage={resolveBarPercentage(
                      inBodyData.obesityAnalysis?.bodyFatPercentage,
                      inBodyData.obesityAnalysis?.bodyFatPercentageStatus
                    )}
                    status={
                      inBodyData.obesityAnalysis?.bodyFatPercentageStatus ||
                      "표준"
                    }
                    isLast
                  />
                </View>
              </View>

              {/* 부위별 근육 분석 */}
              <View style={styles.analysisSection}>
                <Text style={styles.sectionTitle}>부위별 근육 분석</Text>
                <View style={styles.metricList}>
                  {segmentalMuscleItems.map((item, index) => (
                    <View
                      key={item.label}
                      style={[
                        styles.metricItem,
                        index === segmentalMuscleItems.length - 1 &&
                          styles.metricItemLast,
                      ]}
                    >
                      <Text style={styles.metricName}>{item.label}</Text>
                      <Text style={styles.metricValue}>{item.value}</Text>
                      <Text style={styles.metricRange}></Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 부위별 체지방 분석 */}
              <View style={styles.analysisSection}>
                <Text style={styles.sectionTitle}>부위별 체지방 분석</Text>
                <View style={styles.metricList}>
                  {[
                    {
                      label: "오른팔 체지방",
                      keys: ["rightArmFat"],
                      segmentalKey: "rightArm",
                    },
                    {
                      label: "왼팔 체지방",
                      keys: ["leftArmFat"],
                      segmentalKey: "leftArm",
                    },
                    {
                      label: "몸통 체지방",
                      keys: ["trunkFat"],
                      segmentalKey: "trunk",
                    },
                    {
                      label: "오른다리 체지방",
                      keys: ["rightLegFat"],
                      segmentalKey: "rightLeg",
                    },
                    {
                      label: "왼다리 체지방",
                      keys: ["leftLegFat"],
                      segmentalKey: "leftLeg",
                    },
                  ].map((item, index, array) => {
                    // 수기 입력 필드명 매핑 (rArmFat -> rightArmFat 등)
                    const manualFieldMap: { [key: string]: string } = {
                      rightArmFat: "rArmFat",
                      leftArmFat: "lArmFat",
                      trunkFat: "trunkFat",
                      rightLegFat: "rLegFat",
                      leftLegFat: "lLegFat",
                    };
                    const manualFieldKey = manualFieldMap[item.keys[0]];

                    // 디버깅: 각 필드별 값 확인 (모든 항목에 대해)
                    if (__DEV__) {
                      console.log(
                        `[INBODY] 부위별 체지방 값 추출 [${item.label}]:`,
                        {
                          label: item.label,
                          segmentalKey: item.segmentalKey,
                          directValue: inBodyData[item.keys[0]],
                          manualFieldValue: manualFieldKey
                            ? inBodyData[manualFieldKey]
                            : null,
                          segmentalFatAnalysisValue:
                            inBodyData.segmentalFatAnalysis?.[
                              item.segmentalKey
                            ],
                          segmentalFatAnalysis: inBodyData.segmentalFatAnalysis,
                          hasSegmentalFatAnalysis:
                            !!inBodyData.segmentalFatAnalysis,
                          allKeys: inBodyData
                            ? Object.keys(inBodyData).filter(
                                (k) =>
                                  k.includes("Fat") ||
                                  k.includes("Arm") ||
                                  k.includes("Leg") ||
                                  k.includes("segmental")
                              )
                            : [],
                          inBodyDataKeys: inBodyData
                            ? Object.keys(inBodyData)
                            : [],
                        }
                      );
                    }

                    const value =
                      inBodyData[item.keys[0]] ?? // 1순위: 직접 필드 (rightArmFat 등)
                      (manualFieldKey ? inBodyData[manualFieldKey] : null) ?? // 1-1순위: 수기 입력 필드명 (rArmFat 등)
                      inBodyData.segmentalFatAnalysis?.[item.segmentalKey] ?? // 2순위: segmentalFatAnalysis 객체
                      inBodyData.muscleFatAnalysis?.[item.keys[0]] ?? // 3순위: muscleFatAnalysis 객체
                      (manualFieldKey
                        ? inBodyData.muscleFatAnalysis?.[manualFieldKey]
                        : null) ?? // 3-1순위: muscleFatAnalysis (수기 입력 필드명)
                      inBodyData.segmentalBodyFat?.[item.keys[0]] ?? // 4순위: segmentalBodyFat 객체
                      inBodyData.segmentalBodyFat?.[item.segmentalKey] ?? // 5순위: segmentalBodyFat (변환된 키)
                      inBodyData.segmentalFatRatio?.[item.segmentalKey] ?? // 6순위: segmentalFatRatio
                      null;

                    // 디버깅: 최종 값 확인 (모든 항목에 대해)
                    if (__DEV__) {
                      console.log(
                        `[INBODY] 부위별 체지방 최종 값 [${item.label}]:`,
                        {
                          label: item.label,
                          value,
                          numValue: parseNumericValue(value),
                          valueType: typeof value,
                          isNull: value === null,
                          isUndefined: value === undefined,
                        }
                      );
                    }

                    const numValue = parseNumericValue(value);
                    return (
                      <View
                        key={item.keys[0]}
                        style={[
                          styles.metricItem,
                          index === array.length - 1 && styles.metricItemLast,
                        ]}
                      >
                        <Text style={styles.metricName}>{item.label}</Text>
                        <Text style={styles.metricValue}>
                          {numValue !== undefined
                            ? `${numValue.toFixed(1)}kg`
                            : "-"}
                        </Text>
                        <Text style={styles.metricRange}></Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>인바디 데이터가 없습니다.</Text>
              <Text style={styles.emptySubText}>
                수기로 입력하거나 사진으로 입력해주세요.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {historyLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E3FF7C" />
              <Text style={styles.loadingText}>데이터 로딩 중...</Text>
            </View>
          ) : historyData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>분석 데이터가 없습니다</Text>
              <Text style={styles.emptySubText}>
                인바디 기록을 추가하면 분석 그래프를 확인할 수 있습니다.
              </Text>
            </View>
          ) : (
            <>
              {/* 체중 변화 선 그래프 */}
              <View style={styles.chartSection}>
                <Text style={styles.chartTitle}>체중 변화</Text>
                <LineChart
                  data={{
                    labels: historyData.map((item) => {
                      const date = new Date(item.measurementDate);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }),
                    datasets: [
                      {
                        data: historyData.map((item) => item.weight),
                        color: (opacity = 1) =>
                          `rgba(227, 255, 124, ${opacity})`,
                        strokeWidth: 2,
                      },
                    ],
                  }}
                  width={Math.min(Dimensions.get("window").width - 80, 360)}
                  height={220}
                  chartConfig={{
                    backgroundColor: "#2a2a2a",
                    backgroundGradientFrom: "#2a2a2a",
                    backgroundGradientTo: "#2a2a2a",
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(227, 255, 124, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      `rgba(255, 255, 255, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: "4",
                      strokeWidth: "2",
                      stroke: "#E3FF7C",
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>

              {/* 골격근량 vs 체중 비교 그래프 (이중 선 그래프) */}
              <View style={styles.chartSection}>
                <Text style={styles.chartTitle}>골격근량 vs 체중</Text>
                <LineChart
                  data={{
                    labels: historyData.map((item) => {
                      const date = new Date(item.measurementDate);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }),
                    datasets: [
                      {
                        data: historyData.map((item) => item.weight),
                        color: (opacity = 1) =>
                          `rgba(227, 255, 124, ${opacity})`,
                        strokeWidth: 2,
                      },
                      {
                        data: historyData.map(
                          (item) => item.skeletalMuscleMass
                        ),
                        color: (opacity = 1) =>
                          `rgba(116, 185, 255, ${opacity})`,
                        strokeWidth: 2,
                      },
                    ],
                  }}
                  width={Math.min(Dimensions.get("window").width - 80, 360)}
                  height={220}
                  chartConfig={{
                    backgroundColor: "#2a2a2a",
                    backgroundGradientFrom: "#2a2a2a",
                    backgroundGradientTo: "#2a2a2a",
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(227, 255, 124, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      `rgba(255, 255, 255, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: "4",
                      strokeWidth: "2",
                      stroke: "#E3FF7C",
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#E3FF7C" }]}
                    />
                    <Text style={styles.legendText}>체중</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: "#74B9FF" }]}
                    />
                    <Text style={styles.legendText}>골격근량</Text>
                  </View>
                </View>
              </View>

              {/* 체지방률 변화 선 그래프 */}
              <View style={styles.chartSection}>
                <Text style={styles.chartTitle}>체지방률 변화</Text>
                <LineChart
                  data={{
                    labels: historyData.map((item) => {
                      const date = new Date(item.measurementDate);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }),
                    datasets: [
                      {
                        data: historyData.map((item) => item.bodyFatPercentage),
                        color: (opacity = 1) =>
                          `rgba(227, 255, 124, ${opacity})`,
                        strokeWidth: 2,
                      },
                    ],
                  }}
                  width={Math.min(Dimensions.get("window").width - 80, 360)}
                  height={220}
                  chartConfig={{
                    backgroundColor: "#2a2a2a",
                    backgroundGradientFrom: "#2a2a2a",
                    backgroundGradientTo: "#2a2a2a",
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(227, 255, 124, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      `rgba(255, 255, 255, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: "4",
                      strokeWidth: "2",
                      stroke: "#E3FF7C",
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>

              {/* BMI 그래프와 점수를 함께 나타내는 막대 그래프 */}
              <View style={styles.chartSection}>
                <Text style={styles.chartTitle}>BMI & 건강 점수</Text>
                <BarChart
                  data={{
                    labels: historyData.map((item) => {
                      const date = new Date(item.measurementDate);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }),
                    datasets: [
                      {
                        data: historyData.map((item) => item.bmi),
                      },
                    ],
                  }}
                  width={Math.min(Dimensions.get("window").width - 80, 360)}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: "#2a2a2a",
                    backgroundGradientFrom: "#2a2a2a",
                    backgroundGradientTo: "#2a2a2a",
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(227, 255, 124, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      `rgba(255, 255, 255, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars
                />
                {/* 점수 표시 */}
                <View style={styles.scoreList}>
                  {historyData.map((item, index) => {
                    const date = new Date(item.measurementDate);
                    return (
                      <View key={item.id} style={styles.scoreItem}>
                        <Text style={styles.scoreDate}>
                          {`${date.getMonth() + 1}/${date.getDate()}`}
                        </Text>
                        <Text style={styles.scoreValue}>{item.score}점</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* 캘린더 모달 */}
      {selectedDate && (
        <InBodyCalendarModal
          visible={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          onSelectDate={handleCalendarDateSelect}
          selectedDate={selectedDate}
          inBodyDates={availableDates} // 사용 가능한 날짜 목록
          onlySelectableDates={true} // 기록이 있는 날짜만 선택 가능
        />
      )}
    </SafeAreaView>
  );
};

interface BarChartItemProps {
  label: string;
  value: string;
  percentage: number;
  status: string;
  isLast?: boolean;
}

const BarChartItem: React.FC<BarChartItemProps> = ({
  label,
  value,
  percentage,
  status,
  isLast = false,
}) => (
  <View style={[styles.barItem, isLast && styles.barItemLast]}>
    <Text style={styles.barLabel}>{label}</Text>
    <View style={styles.barChartContainer}>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.max(0, Math.min(100, percentage))}%` },
          ]}
        />
      </View>
    </View>
    <Text style={styles.barValue}>{value}</Text>
    <Text style={styles.barStatus}>{status}</Text>
  </View>
);

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
    fontWeight: "600",
    color: "#ffffff",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  analysisSection: {
    marginBottom: 24,
  },
  measurementInfo: {
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
  },
  measurementInfoText: {
    fontSize: 14.4,
    color: "#ffffff",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  metricList: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
  },
  metricItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  metricItemLast: {
    borderBottomWidth: 0,
  },
  metricName: {
    fontSize: 14.4,
    color: "#ffffff",
    flex: 1,
  },
  metricValue: {
    fontSize: 14.4,
    color: "#E3FF7C",
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  metricRange: {
    fontSize: 12.8,
    color: "#aaaaaa",
    textAlign: "right",
    flex: 1,
  },
  barChartList: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 16,
  },
  barLabelsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 11.2,
    color: "#aaaaaa",
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  barRangeLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11.2,
    color: "#aaaaaa",
  },
  barItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  barItemLast: {
    borderBottomWidth: 0,
  },
  barLabel: {
    fontSize: 14.4,
    color: "#ffffff",
    minWidth: 60,
  },
  barChartContainer: {
    flex: 1,
    marginRight: -79,
  },
  barContainer: {
    height: 20,
    backgroundColor: "#333333",
    borderRadius: 10,
    overflow: "hidden",
    width: "100%",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#e3ff7c",
    borderRadius: 10,
  },
  barValue: {
    minWidth: 50,
    textAlign: "right",
    fontSize: 12.8,
    color: "#ffffff",
    fontWeight: "500",
  },
  barStatus: {
    fontSize: 12.8,
    color: "#E3FF7C",
    minWidth: 40,
    textAlign: "right",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#aaaaaa",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#aaaaaa",
  },
  dateNavigatorContainer: {
    marginBottom: 20,
    marginTop: 16,
    gap: 12,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E3FF7C",
  },
  dateNavigatorWrapper: {
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#E3FF7C",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#aaaaaa",
  },
  tabButtonTextActive: {
    color: "#1c1c1c",
    fontWeight: "600",
  },
  aiCommentContainer: {
    marginBottom: 20,
    marginTop: 8,
  },
  aiCommentBox: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#E3FF7C",
  },
  aiCommentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  aiCommentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E3FF7C",
  },
  aiCommentText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#ffffff",
  },
  aiCommentLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  aiCommentLoadingText: {
    fontSize: 14,
    color: "#aaaaaa",
  },
  chartSection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: "#ffffff",
  },
  scoreList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333333",
  },
  scoreItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  scoreDate: {
    fontSize: 14,
    color: "#aaaaaa",
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E3FF7C",
  },
});

export default InBodyScreen;
