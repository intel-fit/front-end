import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons as Icon } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { RootStackParamList, MainTabParamList } from "./types";
import { ROUTES } from "../constants/routes";
import { TAB_BAR_THEME, ICONS } from "../constants/theme";
import { DateProvider } from "../contexts/DateContext";

// Auth Screens
import OnboardingScreen from "../screens/auth/OnboardingScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import FindIdScreen from "../screens/auth/FindIdScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import KakaoOnboardingScreen from "../screens/auth/KakaoOnboardingScreen";

// Main Screens
import HomeScreen from "../screens/main/HomeScreen";
import MyPageScreen from "../screens/main/MyPageScreen";
import StatsScreen from "../screens/main/StatsScreen";

// Diet Screens
import DietScreen from "../screens/diet/DietScreen";
import MealAddScreen from "../screens/diet/MealAddScreen";
import FoodSearchScreen from "../screens/diet/FoodSearchScreen";
import MealDetailScreen from "../screens/diet/MealDetailScreen";
import MealRecommendScreen from "../screens/diet/MealRecommendScreen";
import MealRecommendHistoryScreen from "../screens/diet/MealRecommendHistoryScreen";
import FoodAddOptionsScreen from "../screens/diet/FoodAddOptionsScreen";
import TempMealRecommendScreen from "../screens/diet/TempMealRecommendScreen";

// Exercise Screens
import ExerciseScreen from "../screens/exercise/ExerciseScreen";
import ExerciseDetailScreen from "../screens/exercise/ExerciseDetailScreen";
import RoutineRecommendScreen from "../screens/exercise/RoutineRecommendScreen";
import RoutineRecommendNewScreen from "../screens/exercise/RoutineRecommendNewScreen";
import TempRoutineRecommendScreen from "../screens/exercise/TempRoutineRecommendScreen";

// Analysis Screens
import AnalysisScreen from "../screens/analysis/AnalysisScreen";
import CalendarScreen from "../screens/analysis/CalendarScreen";
import GoalScreen from "../screens/analysis/GoalScreen";
import HealthScoreTrendScreen from "../screens/analysis/HealthScoreTrendScreen";

// InBody Screens
import InBodyScreen from "../screens/inbody/InBodyScreen";
import InBodyManualScreen from "../screens/inbody/InBodyManualScreen";

// Chatbot Screens
import ChatbotScreen from "../screens/chatbot/ChatbotScreen";

// PaymentSucess Screens
import PaymentSuccessScreen from "../screens/pay/PaymentSuccessScreen";
import PaymentFailScreen from "../screens/pay/PaymentFailScreen";
import PaymentCancelScreen from "../screens/pay/PaymentCancelScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

//딥링크 설정
// Expo Go에서는 exp:// 스킴 사용, 스탠드얼론 빌드에서는 intelfit:// 스킴 사용
const linking = {
  prefixes: ["intelfit://", "exp://"],
  config: {
    screens: {
      PaymentSuccess: "pay/success",
      PaymentFail: "pay/fail",
      PaymentCancel: "pay/cancel",
      Login: "auth/kakao",
    },
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          switch (route.name) {
            case "Home":
              iconName = focused ? ICONS.HOME.active : ICONS.HOME.inactive;
              break;
            case "Stats":
              iconName = focused ? ICONS.STATS.active : ICONS.STATS.inactive;
              break;
            case "Chatbot":
              iconName = focused
                ? ICONS.CHATBOT.active
                : ICONS.CHATBOT.inactive;
              break;
            case "Analysis":
              iconName = focused
                ? ICONS.ANALYSIS.active
                : ICONS.ANALYSIS.inactive;
              break;
            case "MyPage":
              iconName = focused
                ? ICONS.MY_PAGE.active
                : ICONS.MY_PAGE.inactive;
              break;
            default:
              iconName = ICONS.HOME.inactive;
          }

          return <Icon name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: TAB_BAR_THEME.activeTintColor,
        tabBarInactiveTintColor: TAB_BAR_THEME.inactiveTintColor,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: TAB_BAR_THEME.backgroundColor,
          borderTopColor: TAB_BAR_THEME.borderTopColor,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "홈" }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ title: "기록하기" }}
      />
      <Tab.Screen
        name="Chatbot"
        component={ChatbotScreen}
        options={{ title: "챗봇" }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{ title: "분석하기" }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{ title: "마이페이지" }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <DateProvider>
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          initialRouteName={ROUTES.ONBOARDING}
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Auth Stack */}
          <Stack.Screen name={ROUTES.ONBOARDING} component={OnboardingScreen} />
          <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
          <Stack.Screen name={ROUTES.SIGNUP} component={SignupScreen} />
          <Stack.Screen name={ROUTES.FIND_ID} component={FindIdScreen} />
          <Stack.Screen
            name={ROUTES.RESET_PASSWORD}
            component={ResetPasswordScreen}
          />
          <Stack.Screen name="KakaoOnboarding" component={KakaoOnboardingScreen} />
          {/* Main Tabs */}
          <Stack.Screen name={ROUTES.MAIN} component={MainTabs} />
          {/* Payment Stack*/}
          <Stack.Screen
            name="PaymentSuccess"
            component={PaymentSuccessScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PaymentFail"
            component={PaymentFailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PaymentCancel"
            component={PaymentCancelScreen}
            options={{ headerShown: false }}
          />

          {/* Diet Stack */}
          <Stack.Screen name={ROUTES.DIET} component={DietScreen} />
          <Stack.Screen name={ROUTES.MEAL_ADD} component={MealAddScreen} />
          <Stack.Screen
            name={ROUTES.FOOD_SEARCH}
            component={FoodSearchScreen}
          />
          <Stack.Screen
            name={ROUTES.MEAL_DETAIL}
            component={MealDetailScreen}
          />
          <Stack.Screen
            name={ROUTES.MEAL_RECOMMEND}
            component={MealRecommendScreen}
          />
          <Stack.Screen
            name={ROUTES.MEAL_RECOMMEND_HISTORY}
            component={MealRecommendHistoryScreen}
          />
          <Stack.Screen
            name={ROUTES.FOOD_ADD_OPTIONS}
            component={FoodAddOptionsScreen}
          />
          <Stack.Screen
            name={ROUTES.TEMP_MEAL_RECOMMEND}
            component={TempMealRecommendScreen}
          />
          {/* Exercise Stack */}
          <Stack.Screen
            name={ROUTES.EXERCISE}
            component={ExerciseScreen}
            options={{
              headerLeft: () => null,
            }}
          />
          <Stack.Screen
            name={ROUTES.EXERCISE_DETAIL}
            component={ExerciseDetailScreen}
          />
          <Stack.Screen
            name={ROUTES.ROUTINE_RECOMMEND}
            component={RoutineRecommendScreen}
          />
          <Stack.Screen
            name={ROUTES.ROUTINE_RECOMMEND_NEW}
            component={RoutineRecommendNewScreen}
          />
          <Stack.Screen
            name="TempRoutineRecommendScreen"
            component={TempRoutineRecommendScreen}
          />
          {/* Analysis Stack */}
          <Stack.Screen name={ROUTES.ANALYSIS} component={AnalysisScreen} />
          <Stack.Screen name={ROUTES.CALENDAR} component={CalendarScreen} />
          <Stack.Screen name={ROUTES.GOAL} component={GoalScreen} />
          <Stack.Screen
            name="HealthScoreTrend"
            component={HealthScoreTrendScreen}
          />
          {/* InBody Stack */}
          <Stack.Screen name={ROUTES.IN_BODY} component={InBodyScreen} />
          <Stack.Screen
            name={ROUTES.IN_BODY_MANUAL}
            component={InBodyManualScreen}
          />
          {/* Chatbot Stack */}
          <Stack.Screen name={ROUTES.CHATBOT} component={ChatbotScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </DateProvider>
  );
}
