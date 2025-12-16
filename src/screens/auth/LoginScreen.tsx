import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../../theme/colors";
import { authAPI } from "../../services";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "../../services/apiConfig";

// @react-native-seoul/kakao-login (네이티브 빌드에서만 작동)
// Expo Go에서는 WebBrowser.openAuthSessionAsync 사용
let KakaoLogin: any = null;
try {
  KakaoLogin = require("@react-native-seoul/kakao-login");
} catch (e) {
  console.log(
    "카카오 로그인 네이티브 모듈을 사용할 수 없습니다 (Expo Go 환경일 수 있음)"
  );
}

const LoginScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [showKakaoWebView, setShowKakaoWebView] = useState(false);
  const [kakaoLoginUrl, setKakaoLoginUrl] = useState("");

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = "아이디를 입력해주세요";
    }

    if (!formData.password.trim()) {
      newErrors.password = "비밀번호를 입력해주세요";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(
        formData.username,
        formData.password
      );

      if (response.success && response.accessToken) {
        navigation.replace("Main");
      } else {
        const errorMessage = response.message || "로그인에 실패했습니다";
        if (typeof window !== "undefined" && (window as any).alert) {
          (window as any).alert(`로그인 실패\n${errorMessage}`);
        } else {
          Alert.alert("로그인 실패", errorMessage);
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || "로그인에 실패했습니다";
      if (typeof window !== "undefined" && (window as any).alert) {
        (window as any).alert(`로그인 실패\n${errorMessage}`);
      } else {
        Alert.alert("로그인 실패", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // 딥링크 처리 함수 (공통 로직)
  const handleKakaoDeepLink = useCallback(async (url: string) => {
    console.log("🔗 [카카오 로그인] 딥링크 처리 시작:", url);
    console.log("🔗 [카카오 로그인] 플랫폼:", Platform.OS);

    // 카카오 네이티브 스킴(kakaob46c5ece88946636902899138451ac5e://oauth)을 intelfit://auth/kakao로 변환
    let processedUrl = url;
    if (url.includes("kakaob46c5ece88946636902899138451ac5e://oauth")) {
      // 카카오 스킴에서 쿼리 파라미터 추출
      const urlObj = new URL(url.replace("kakaob46c5ece88946636902899138451ac5e", "http"));
      const params = urlObj.searchParams;
      const code = params.get("code");
      if (code) {
        processedUrl = `intelfit://auth/kakao?code=${code}`;
        console.log("🔗 [카카오 로그인] 카카오 스킴을 intelfit 스킴으로 변환:", processedUrl);
      }
    }

    const parsed = Linking.parse(processedUrl);
    const code = parsed.queryParams?.code as string | undefined;
    const accessToken = parsed.queryParams?.accessToken as string | undefined;
    const refreshToken = parsed.queryParams?.refreshToken as
      | string
      | undefined;

    // 백엔드가 이미 처리해서 토큰을 딥링크에 포함한 경우
    if (accessToken) {
        console.log("✅ [카카오 로그인] 토큰이 딥링크에 포함됨");
        try {
          setLoading(true);

          // 토큰 저장
          await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
          if (refreshToken) {
            await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          }

          // userId가 있으면 저장
          const userId = parsed.queryParams?.userId as string | undefined;
          if (userId) {
            await AsyncStorage.setItem("userId", userId);
          }

          // membershipType 저장 (기본값 FREE)
          const membershipType =
            (parsed.queryParams?.membershipType as string | undefined) ||
            "FREE";
          await AsyncStorage.setItem("membershipType", membershipType);

          // 온보딩 여부 확인 (isOnboarded 우선 확인)
          const isOnboarded = parsed.queryParams?.isOnboarded;
          const onboarded = parsed.queryParams?.onboarded;
          const shouldOnboard =
            isOnboarded === "false" || onboarded === "false";

          // 신규 유저 확인 (온보딩이 완료된 경우에만)
          const newUser = parsed.queryParams?.newUser;
          const isNewUser = newUser === "true";

          console.log("✅ [카카오 로그인] 토큰 저장 완료");
          if (shouldOnboard || isNewUser) {
            navigation.replace("KakaoOnboarding");
          } else {
            navigation.replace("Main");
          }
        } catch (error: any) {
          console.error("❌ [카카오 로그인] 토큰 저장 실패:", error);
          Alert.alert(
            "로그인 실패",
            error.message || "토큰 저장 중 오류가 발생했습니다."
          );
        } finally {
          setLoading(false);
        }
        return;
      }

    // 인증 코드가 있는 경우 (백엔드 API 호출 필요)
    if (!code) {
      console.log("⚠️ [카카오 로그인] 딥링크에 code 또는 accessToken이 없음");
      return;
    }

    console.log("🔵 [카카오 로그인] 인증 코드 받음, 백엔드 API 호출 시작");
    try {
      setLoading(true);

        // 👉 여기서 서버 API 호출
        const res = await fetch(
          "https://www.intelfits.com/api/auth/kakao/login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          }
        );

        console.log("🔵 [카카오 로그인] 백엔드 응답 상태:", res.status);
        const data = await res.json();
        console.log("🔵 [카카오 로그인] 백엔드 응답 데이터:", data);

        if (!res.ok) {
          throw new Error(data.message || "카카오 로그인에 실패했습니다");
        }

        // 토큰 저장
        if (data.accessToken) {
          await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        }
        if (data.refreshToken) {
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
        if (data.userId) {
          await AsyncStorage.setItem("userId", String(data.userId));
        }
        if (data.membershipType) {
          await AsyncStorage.setItem("membershipType", data.membershipType);
        } else {
          await AsyncStorage.setItem("membershipType", "FREE");
        }

        // 온보딩 여부 확인 (isOnboarded 우선 확인)
        // isOnboarded === false: 온보딩 미완료 → 카카오 온보딩
        const isOnboarded =
          data.isOnboarded !== undefined ? data.isOnboarded : data.onboarded;
        const shouldOnboard = isOnboarded === false;

        // 신규 유저 확인 (온보딩이 완료된 경우에만)
        const isNewUser = data.newUser === true;

        console.log("🔵 [카카오 로그인] 네비게이션 처리:", {
          shouldOnboard,
          isNewUser,
          isOnboarded,
          newUser: data.newUser,
        });
        
        if (shouldOnboard || isNewUser) {
          console.log("🔵 [카카오 로그인] 온보딩 화면으로 이동");
          navigation.replace("KakaoOnboarding");
        } else {
          console.log("🔵 [카카오 로그인] 홈 화면으로 이동");
          navigation.replace("Main");
        }
      } catch (error: any) {
        console.error("카카오 로그인 처리 실패:", error);
        const errorMessage = error.message || "카카오 로그인에 실패했습니다";
        if (Platform.OS === "web") {
          window.alert(`로그인 실패\n${errorMessage}`);
        } else {
          Alert.alert("로그인 실패", errorMessage);
        }
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    // 🔹 ① 앱 시작 시 딥링크 확인 (안드로이드에서 중요)
    const checkInitialUrl = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          // intelfit://auth/kakao 또는 kakaob46c5ece88946636902899138451ac5e://oauth 스킴 처리
          if (
            initialUrl.includes("intelfit://auth/kakao") ||
            initialUrl.includes("kakaob46c5ece88946636902899138451ac5e://oauth")
          ) {
            console.log("🔗 [카카오 로그인] 초기 딥링크 발견:", initialUrl);
            handleKakaoDeepLink(initialUrl);
          }
        }
      } catch (error) {
        console.error("❌ [카카오 로그인] 초기 URL 확인 실패:", error);
      }
    };
    
    checkInitialUrl();

    // 🔹 ② redirect_uri 가로채기 (가장 중요)
    const subscription = Linking.addEventListener("url", async ({ url }) => {
      console.log("🔗 [카카오 로그인] 딥링크 수신:", url);
      // intelfit://auth/kakao 또는 kakaob46c5ece88946636902899138451ac5e://oauth 스킴 처리
      if (
        url.includes("intelfit://auth/kakao") ||
        url.includes("kakaob46c5ece88946636902899138451ac5e://oauth")
      ) {
        handleKakaoDeepLink(url);
      }
    });

    // 앱이 이미 열려있을 때 딥링크 처리
    Linking.getInitialURL().then(async (url) => {
      if (url) {
        const parsed = Linking.parse(url);
        const code = parsed.queryParams?.code as string | undefined;
        if (code) {
          // 초기 URL에 코드가 있으면 처리
          try {
            setLoading(true);

            const res = await fetch(
              "https://www.intelfits.com/api/auth/kakao/login",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
              }
            );

            const data = await res.json();

            if (!res.ok) {
              throw new Error(data.message || "카카오 로그인에 실패했습니다");
            }

            // 토큰 저장
            if (data.accessToken) {
              await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
            }
            if (data.refreshToken) {
              await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
            }
            if (data.membershipType) {
              await AsyncStorage.setItem("membershipType", data.membershipType);
            } else {
              await AsyncStorage.setItem("membershipType", "FREE");
            }

            // 온보딩 여부 확인 (isOnboarded 우선 확인)
            const isOnboarded =
              data.isOnboarded !== undefined
                ? data.isOnboarded
                : data.onboarded;
            const shouldOnboard = isOnboarded === false;

            // 신규 유저 확인 (온보딩이 완료된 경우에만)
            const isNewUser = data.newUser === true;

            if (shouldOnboard || isNewUser) {
              navigation.replace("KakaoOnboarding");
            } else {
              navigation.replace("Main");
            }
          } catch (error: any) {
            console.error("카카오 로그인 처리 실패:", error);
          } finally {
            setLoading(false);
          }
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleKakaoDeepLink]);

  const handleKakaoLogin = async () => {
    try {
      setLoading(true);
      console.log("🔵 [카카오 로그인] 시작");

      // 웹 환경 체크 (Platform.OS가 'web'인 경우)
      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        window.open
      ) {
        const KAKAO_CLIENT_ID = "99baee411cc547822f138712b19b032c";
        const REDIRECT_URI =
          "https://www.intelfits.com/api/auth/kakao/callback";
        const loginUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(
          REDIRECT_URI
        )}&response_type=code&scope=profile_nickname,profile_image`;
        // 웹에서는 새 창으로 열기
        window.open(loginUrl, "_blank");
        setLoading(false);
        return;
      }

      // ✅ APK에서도 Web OAuth 방식만 사용하도록 네이티브 SDK 로그인은 비활성화

      // ✅ 방법 2: openAuthSessionAsync 사용 (Expo Go에서도 작동, 딥링크 리다이렉트 감지 가능)
      const KAKAO_CLIENT_ID = "99baee411cc547822f138712b19b032c";
      // 백엔드 콜백 URL 사용 (백엔드에서 딥링크로 리다이렉트해야 함)
      const REDIRECT_URI = "https://www.intelfits.com/api/auth/kakao/callback";
      const loginUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&response_type=code&scope=profile_nickname,profile_image`;

      console.log("🔵 [카카오 로그인] WebBrowser 방식 사용");
      console.log("🔵 [카카오 로그인] Platform:", Platform.OS);
      console.log("🔵 [카카오 로그인] REDIRECT_URI:", REDIRECT_URI);
      console.log("🔵 [카카오 로그인] URL:", loginUrl);

      // 딥링크 스킴 설정 (앱 내부 브라우저에서 열리도록)
      // 백엔드 콜백에서 이 딥링크로 리다이렉트해야 함
      const deepLinkScheme = "intelfit://auth/kakao";
      console.log("🔵 [카카오 로그인] 딥링크 스킴:", deepLinkScheme);

      // iOS와 안드로이드 플랫폼별 처리
      if (Platform.OS === "ios") {
        // iOS는 openAuthSessionAsync 사용 (결과를 직접 받음)
        let result;
        try {
          console.log("🔵 [카카오 로그인] iOS - openAuthSessionAsync 사용");
          result = await WebBrowser.openAuthSessionAsync(
            loginUrl,
            deepLinkScheme,
            {
              preferEphemeralSession: false,
            }
          );
          console.log("🔵 [카카오 로그인] openAuthSessionAsync 결과:", result);
        } catch (browserError: any) {
          console.error("❌ [카카오 로그인] WebBrowser 에러:", browserError);
          Alert.alert("오류", "카카오 로그인 페이지를 열 수 없습니다.");
          setLoading(false);
          return;
        }

        // iOS는 result를 직접 처리
        if (result) {
          console.log("🔵 [카카오 로그인] 결과:", result);

          if (result.type === "success" && result.url) {
            console.log("🔵 [카카오 로그인] 딥링크 URL 받음:", result.url);
            // iOS는 result.url을 직접 처리
            await handleKakaoDeepLink(result.url);
          } else if (result.type === "cancel") {
            console.log("⚠️ [카카오 로그인] 사용자가 취소함");
            Alert.alert("알림", "카카오 로그인이 취소되었습니다.");
            setLoading(false);
          } else if (result.type === "dismiss") {
            console.log("⚠️ [카카오 로그인] 브라우저가 닫힘");
            setLoading(false);
          } else {
            console.log("⚠️ [카카오 로그인] 예상치 못한 결과:", result);
            Alert.alert("오류", "카카오 로그인에 실패했습니다. 다시 시도해주세요.");
            setLoading(false);
          }
        }
      } else {
        // 안드로이드는 WebView를 사용하여 앱 내부에서 브라우저 열기
        try {
          console.log("🔵 [카카오 로그인] Android - WebView 사용 (앱 내부 브라우저)");
          console.log("🔵 [카카오 로그인] Login URL:", loginUrl);
          
          // WebView 모달 열기
          setKakaoLoginUrl(loginUrl);
          setShowKakaoWebView(true);
          setLoading(false);
        } catch (browserError: any) {
          console.error("❌ [카카오 로그인] WebBrowser 에러:", browserError);
          console.error("❌ [카카오 로그인] 에러 상세:", JSON.stringify(browserError, null, 2));
          Alert.alert("오류", "카카오 로그인 페이지를 열 수 없습니다.");
          setLoading(false);
          return;
        }
      }
    } catch (error: any) {
      console.error("❌ [카카오 로그인] 에러:", error);
      const errorMessage =
        error.message || "카카오 로그인 페이지를 열 수 없습니다.";
      Alert.alert("오류", errorMessage);
      setLoading(false);
    }
    // 안드로이드는 Linking 이벤트 리스너가 처리하므로 finally에서 setLoading(false)를 호출하지 않음
    // iOS는 위의 각 분기에서 이미 setLoading(false)를 호출함
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.loginContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>INTEL FIT</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="아이디"
                value={formData.username}
                onChangeText={(text) => handleChange("username", text)}
                autoCapitalize="none"
                placeholderTextColor={colors.textLight}
              />
              {errors.username && (
                <Text style={styles.errorMessage}>{errors.username}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="비밀번호"
                value={formData.password}
                onChangeText={(text) => handleChange("password", text)}
                secureTextEntry
                placeholderTextColor={colors.textLight}
              />
              {errors.password && (
                <Text style={styles.errorMessage}>{errors.password}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.loginBtnText}>로그인</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.links}>
            <TouchableOpacity onPress={() => navigation.navigate("FindId")}>
              <Text style={styles.linkText}>아이디 찾기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("ResetPassword")}
            >
              <Text style={styles.linkText}>비밀번호 재설정</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.linkText}>회원가입</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.kakaoBtn} onPress={handleKakaoLogin}>
            <Text style={styles.kakaoBtnText}>카카오로 계속하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 안드로이드용 카카오 로그인 WebView 모달 */}
      {Platform.OS === "android" && (
        <Modal
          visible={showKakaoWebView}
          animationType="slide"
          onRequestClose={() => {
            setShowKakaoWebView(false);
            setLoading(false);
          }}
        >
          <SafeAreaView style={styles.webViewContainer}>
            <View style={styles.webViewHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowKakaoWebView(false);
                  setLoading(false);
                }}
                style={styles.webViewCloseBtn}
              >
                <Text style={styles.webViewCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.webViewTitle}>카카오 로그인</Text>
              <View style={{ width: 40 }} />
            </View>

            <WebView
              source={{ uri: kakaoLoginUrl }}
              onNavigationStateChange={(navState) => {
                console.log("🌐 [카카오 로그인] WebView URL:", navState.url);
                
                // 딥링크 감지
                if (
                  navState.url.includes("intelfit://auth/kakao") ||
                  navState.url.includes("kakaob46c5ece88946636902899138451ac5e://oauth")
                ) {
                  console.log("🔗 [카카오 로그인] 딥링크 감지, WebView 닫기");
                  setShowKakaoWebView(false);
                  // Linking 이벤트 리스너가 처리하도록 딥링크 트리거
                  handleKakaoDeepLink(navState.url);
                }
              }}
              onShouldStartLoadWithRequest={(request) => {
                console.log("🔍 [카카오 로그인] 로드 요청:", request.url);
                
                // 딥링크 감지
                if (
                  request.url.includes("intelfit://auth/kakao") ||
                  request.url.includes("kakaob46c5ece88946636902899138451ac5e://oauth")
                ) {
                  console.log("🔗 [카카오 로그인] 딥링크 감지, WebView 닫기");
                  setShowKakaoWebView(false);
                  // Linking 이벤트 리스너가 처리하도록 딥링크 트리거
                  handleKakaoDeepLink(request.url);
                  return false; // 페이지 로드 차단
                }
                return true;
              }}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error("❌ [카카오 로그인] WebView 에러:", nativeEvent);
                Alert.alert("오류", "카카오 로그인 페이지를 불러올 수 없습니다.");
                setShowKakaoWebView(false);
                setLoading(false);
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error("❌ [카카오 로그인] HTTP 에러:", nativeEvent.statusCode, nativeEvent.url);
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              style={{ flex: 1 }}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.webViewLoadingText}>로딩 중...</Text>
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#252525",
  },
  scrollContent: {
    flexGrow: 1,
  },
  loginContainer: {
    flex: 1,
    width: "100%",
    paddingTop: 120,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    fontSize: 40,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#e3ff7c",
    letterSpacing: 0,
  },
  form: {
    width: "100%",
    maxWidth: 360,
    marginBottom: 30,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  input: {
    width: "100%",
    height: 60,
    backgroundColor: "#434343",
    borderWidth: 0,
    borderRadius: 20,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: "400",
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorMessage: {
    color: "#ff6b6b",
    fontSize: 14,
    marginLeft: 5,
  },
  loginBtn: {
    width: "100%",
    height: 60,
    backgroundColor: "#434343",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
  },
  loginBtnDisabled: {
    opacity: 0.4,
  },
  loginBtnText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "400",
  },
  links: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    width: "100%",
    maxWidth: 360,
    marginBottom: 30,
  },
  linkText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "400",
  },
  kakaoBtn: {
    width: "100%",
    maxWidth: 360,
    height: 50,
    backgroundColor: "#ffe617",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  kakaoBtnText: {
    color: "#47292b",
    fontSize: 16,
    fontWeight: "400",
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#252525",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  webViewCloseBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  webViewCloseText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "300",
  },
  webViewTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  webViewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#252525",
  },
  webViewLoadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
  },
});

export default LoginScreen;
