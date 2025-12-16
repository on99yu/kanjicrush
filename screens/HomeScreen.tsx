import React,{ useContext, useMemo}from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { HomeScreenProps } from "../types/screen";
import { WordContext } from "../context/WordContext";
import { WordStatContext } from "../context/WordStatContext";
import { isKnownWord } from "../utils/isKnownWord";
import { getAccuracy } from "../utils/CalAccuracy";

export default function HomeScreen({ navigation }: HomeScreenProps) {

  const { words, loading: wordLoading} = useContext(WordContext);
  const {statsMap, loading: statLoading } = useContext(WordStatContext)
  const summary = useMemo(() => {
    const totalWords = words.length;

    // statsMap은 "학습 기록이 있는 단어"만 들어있음
    const studiedStats = Object.values(statsMap);
    const studiedCount = studiedStats.length;

    const knownCount = studiedStats.filter((s) => isKnownWord(s)).length;

    // 평균 정확도: "학습 기록이 있는 단어" 기준 평균
    const accuracy =
      studiedCount === 0
        ? 0
        : Math.round(
            studiedStats.reduce((sum, s) => sum + getAccuracy(s), 0) /
              studiedCount
          );

    return { totalWords, studiedCount, knownCount, accuracy };
  }, [words, statsMap]);

  const loading = wordLoading || statLoading;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kanji Crush</Text>
      <View>
        <View>
          <Text>
            학습한 단어 수
          </Text>
          <Text>

          </Text>
        </View>
        <View>
            
        </View>
      </View>
      <TouchableOpacity
        style={styles.WordStudybutton}
        onPress={() => navigation.navigate("Word")}
      >
        <Text style={styles.buttonText}>📚 단어 공부하러 가기</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.WordManagerbutton}
        onPress={() => navigation.navigate("WordManager")}
      >
        <Text style={styles.buttonText}>단어장 관리</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
  },
  WordStudybutton: {
    backgroundColor: "#4f46e5", // indigo-600
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  WordManagerbutton: {
    backgroundColor: "#4f46e5", // indigo-600
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
