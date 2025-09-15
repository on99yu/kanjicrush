import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "./MainTabNavigator";
import WordManagerScreen from "../screens/WordManagerScreen";
import WholeWordListScreen from "../screens/WholeWordListScreen";
import { RootStackParamList } from "../types/screen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="WordManager" component={WordManagerScreen} />
      <Stack.Screen name="WholeWordList" component={WholeWordListScreen} />
    </Stack.Navigator>
  );
}
