import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import RootStackNavigator from "./navigation/RootStackNavigator";
import { initializeDatabase } from "./db/sqlite";
import { WordProvider } from "./context/WordContext";
import { WordStatProvider } from "./context/WordStatContext";
export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    const initDB = async () => {
      try {
        await initializeDatabase();
        setDbReady(true);
      } catch (error) {
        console.error("DB 연결 실패:", error);
        setDbError(true);
      }
    };

    initDB();
  }, []);

  if (!dbReady) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          {dbError ? (
            <Text style={styles.errorText}>
              단어장을 준비하지 못했습니다. 앱을 다시 실행해 주세요.
            </Text>
          ) : (
            <>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>단어장을 준비하고 있습니다.</Text>
            </>
          )}
        </View>
      </SafeAreaProvider>
    );
  }

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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
    backgroundColor: "#fff",
  },
  loadingText: {
    color: "#475569",
    fontSize: 16,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 16,
    textAlign: "center",
  },
});
