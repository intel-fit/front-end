import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import { Ionicons as Icon } from '@expo/vector-icons';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import FindIdScreen from './src/screens/FindIdScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import MyPageScreen from './src/screens/MyPageScreen';
import StatsScreen from './src/screens/StatsScreen';
import GoalScreen from './src/screens/GoalScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';
import DietScreen from './src/screens/DietScreen';
import MealAddScreen from './src/screens/MealAddScreen';
import FoodSearchScreen from './src/screens/FoodSearchScreen';
import MealDetailScreen from './src/screens/MealDetailScreen';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';
import CalendarScreen from './src/screens/CalendarScreen';
// 새로 추가된 화면들
import ExerciseScreen from './src/screens/ExerciseScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import GraphScreen from './src/screens/GraphScreen';
import MealRecommendScreen from './src/screens/MealRecommendScreen';
import RoutineRecommendScreen from './src/screens/RoutineRecommendScreen';
import RoutineRecommendNewScreen from './src/screens/RoutineRecommendNewScreen';
import MealRecommendHistoryScreen from './src/screens/MealRecommendHistoryScreen';
import InBodyScreen from './src/screens/InBodyScreen';
import FoodAddOptionsScreen from './src/screens/FoodAddOptionsScreen';
import InBodyManualScreen from './src/screens/InBodyManualScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Stats':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Chatbot':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Analysis':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'MyPage':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6C5CE7',
        tabBarInactiveTintColor: '#999999',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333333',
        },
        tabBarLabelStyle: {
          color: '#FFFFFF',
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{title: '홈'}} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{title: '기록하기'}} />
      <Tab.Screen name="Chatbot" component={ChatbotScreen} options={{title: '챗봇'}} />
      <Tab.Screen name="Analysis" component={AnalysisScreen} options={{title: '분석하기'}} />
      <Tab.Screen name="MyPage" component={MyPageScreen} options={{title: '마이페이지'}} />
    </Tab.Navigator>
  );
}

function App(): JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="FindId" component={FindIdScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Chatbot" component={ChatbotScreen} />
        <Stack.Screen name="Diet" component={DietScreen} />
        <Stack.Screen name="MealAdd" component={MealAddScreen} />
        <Stack.Screen name="FoodSearch" component={FoodSearchScreen} />
        <Stack.Screen name="MealDetail" component={MealDetailScreen} />
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Goal" component={GoalScreen} />
        {/* 새로 추가된 화면들 */}
        <Stack.Screen name="Exercise" component={ExerciseScreen} />
        <Stack.Screen name="Analysis" component={AnalysisScreen} />
        <Stack.Screen name="Graph" component={GraphScreen} />
        <Stack.Screen name="MealRecommend" component={MealRecommendScreen} />
        <Stack.Screen name="MealRecommendHistory" component={MealRecommendHistoryScreen} />
        <Stack.Screen name="RoutineRecommend" component={RoutineRecommendScreen} />
        <Stack.Screen name="RoutineRecommendNew" component={RoutineRecommendNewScreen} />
        <Stack.Screen name="InBody" component={InBodyScreen} />
        <Stack.Screen name="FoodAddOptions" component={FoodAddOptionsScreen} />
        <Stack.Screen name="InBodyManual" component={InBodyManualScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;

