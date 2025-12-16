import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import RootStackNavigator from "./navigation/RootStackNavigator";
import { backfillWordStats, createTable, getDBConnection } from "./db/sqlite";
import { WordProvider } from "./context/WordContext";
import { WordStatProvider } from "./context/WordStatContext";
export default function App() {

  useEffect(() => {
    const initDB = async () => {
      try {
        const db = await getDBConnection();
        console.log("DB 연결 성공");
        await createTable(db);
        console.log("테이블 생성 성공");
        await backfillWordStats(db);

      } catch (error) {
        console.error("DB 연결 실패:", error);
      }
    }

    initDB();
  }, [])
  return (
    <SafeAreaProvider>
      <WordProvider>
        <WordStatProvider>
          <NavigationContainer>
            <SafeAreaView style={{ flex: 1 }}>
              <RootStackNavigator />
            </SafeAreaView>
          </NavigationContainer>
        </WordStatProvider>
      </WordProvider>
    </SafeAreaProvider>
  );
}
