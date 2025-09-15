import { BottomTabScreenProps, BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CompositeNavigationProp } from "@react-navigation/native";

export type RootStackParamList = {
  MainTabs: {screen?: keyof RootTabParamList} | undefined;
  WordManager: undefined;
  WholeWordList: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Word: undefined;
  WordTest: undefined;
};

export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

export type HomeScreenProps ={
  navigation: HomeScreenNavigationProp;
}

export type WordManagerProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "WordManager">;
}


export type WordScreenProps = BottomTabScreenProps<RootTabParamList, "Word">;