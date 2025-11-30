export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  FindId: undefined;
  ResetPassword: undefined;
  Main: undefined;
  Chatbot: undefined;
  Diet: undefined;
  MealAdd: { selectedFood?: any } | undefined;
  FoodSearch: undefined;
  MealDetail: { mealId?: string } | undefined;
  ExerciseDetail: { exerciseId?: string } | undefined;
  Calendar: undefined;
  Goal: undefined;
  Exercise: undefined;
  Analysis: undefined;
  Graph: undefined;
  MealRecommend: undefined;
  MealRecommendHistory: undefined;
  RoutineRecommend: undefined;
  RoutineRecommendNew: undefined;
  TempMealRecommend: undefined;
  InBody: undefined;
  FoodAddOptions: undefined;
  InBodyManual: undefined;
  HealthScoreTrend: undefined;
  // Payment
  PaymentSuccess: undefined;
  PaymentFail: undefined;
  PaymentCancel: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Stats: undefined;
  Chatbot: undefined;
  Analysis: undefined;
  MyPage: undefined;
};
