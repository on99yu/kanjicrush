import React, { useContext, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { HomeScreenProps } from "../types/screen";
import { WordContext } from "../context/WordContext";
import { WordStatContext } from "../context/WordStatContext";
import { isKnownWord } from "../utils/isKnownWord";
import { getAccuracy } from "../utils/CalAccuracy";
import { Settings } from "lucide-react-native";


export default function HomeScreen({ navigation }: HomeScreenProps) {

  const { words, loading: wordLoading } = useContext(WordContext);
  const { statsMap, loading: statLoading } = useContext(WordStatContext)
  const summary = useMemo(() => {
    const totalWords = words.length;

    // statsMap은 "학습 기록이 있는 단어"만 들어있음
    const studiedStats = Object.values(statsMap);
    const studiedCount = studiedStats.length;

    const knownCount = studiedStats.filter((s) => isKnownWord(s)).length
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
      <View style={styles.progressCard}>
        <View style={{ alignItems: "flex-start", paddingHorizontal: 16, }}>
          <Text style={{ fontSize: 20, color: "#fff" }}>학습 진척도</Text>
        </View>
        <View style={styles.progressBlock}>
          <View style={styles.DetailBlock}>
            <Text style={{ color: "#fff", fontSize: 12 }}>학습한 단어 수</Text>
            <Text style={{ color: "#fff", fontSize: 24 }} >
              {summary.knownCount}{""}
              <Text style={{ fontSize: 16 }}> / {summary.totalWords}</Text>
            </Text>
          </View>
          <View style={styles.DetailBlock}>
            <Text style={{ color: "#fff", fontSize: 12 }} >평균 학습 정확도</Text>
            <Text style={{ color: "#fff", fontSize: 24 }}>{summary.accuracy}
              <Text style={{ color: "#fff", fontSize: 12 }}> %</Text>
            </Text>
          </View>
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
        <Settings size={24} color={"#9CA3AF"}></Settings>
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
    gap: 30,

    backgroundColor: "#fff",

  },
  title: {
    marginBottom: 40,

    fontSize: 32,
    fontWeight: "bold",
  },
  progressCard: {
    justifyContent: "center",
    gap: 15,

    width: "80%",
    height: "25%",

    backgroundColor: "#6366f1",
    borderRadius: 12,
  },
  progressBlock: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 25,

  },
  DetailBlock: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    alignItems: "flex-start",

    width: "45%",

    backgroundColor: "#FFFFFF1A"
  },
  WordStudybutton: {

    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,

    backgroundColor: "fff",
    borderColor: "#15803d",
    borderWidth: 1

  },
  WordManagerbutton: {
    alignContent: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,

    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,

    backgroundColor: "#fff",
    borderColor: "#15803d",
    borderWidth: 1
  },
  buttonText: {
    color: "black",
    fontSize: 16,
  },
});
