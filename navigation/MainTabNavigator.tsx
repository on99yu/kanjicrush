import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons"; 
import {BookOpen, BarChart2, Home, BrainCircuit} from 'lucide-react-native';
import WordScreen from "../screens/WordScreen";
import HomeScreen from "../screens/HomeScreen";
import WordTestScreen from "../screens/WordTestScreen";
import { RootTabParamList } from "../types/screen";

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { elevation: 0, height: 70, paddingBottom:10, paddingTop: 8, },
        tabBarItemStyle:{
          paddingVertical:6,
        },
        tabBarActiveTintColor: "#4f46e5",   // 활성 탭 색상
        tabBarInactiveTintColor: "#a0aec0", // 비활성 탭 색상
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "홈", // 탭에 표시될 텍스트
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={size}/>
          ),
        }}
      />
      <Tab.Screen
        name="Word"
        component={WordScreen}
        options={{
          tabBarLabel: "단어 학습",
          tabBarIcon: ({ color, size }) => (
            <BookOpen color={color} size={size}/>
          ),
        }}
      />
      <Tab.Screen
        name="WordTest"
        component={WordTestScreen}
        options={{
          tabBarLabel: "단어 퀴즈",
          tabBarIcon: ({ color, size }) => (
            <BrainCircuit size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}