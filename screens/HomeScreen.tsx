import React, { useContext, useMemo } from "react";
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { HomeScreenProps } from "../types/screen";
import { WordContext } from "../context/WordContext";
import { WordStatContext } from "../context/WordStatContext";
import { isKnownWord } from "../utils/isKnownWord";
import { getAccuracy } from "../utils/CalAccuracy";
import { LogOut, Settings } from "lucide-react-native";
import { AuthContext } from "../context/AuthContext";
import { countStudiedToday, DAILY_STUDY_TARGET } from "../utils/buildDailyStudyPlan";


export default function HomeScreen({ navigation }: HomeScreenProps) {

  const { words, loading: wordLoading } = useContext(WordContext);
  const { statsMap, loading: statLoading } = useContext(WordStatContext)
  const { session, logout } = useContext(AuthContext);
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

    const studiedToday = countStudiedToday(statsMap);

    return { totalWords, studiedCount, knownCount, accuracy, studiedToday };
  }, [words, statsMap]);

  const loading = wordLoading || statLoading;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text>학습 현황을 불러오고 있습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityLabel="로그아웃"
        onPress={logout}
        style={styles.logoutButton}
      >
        <LogOut size={20} color="#64748b" />
        <Text style={styles.logoutText}>{session?.user.name} · 로그아웃</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Kanji Crush</Text>
      <View style={styles.progressCard}>
        <View style={{ alignItems: "flex-start", paddingHorizontal: 16, }}>
          <Text style={{ fontSize: 20, color: "#fff" }}>학습 진척도</Text>
        </View>
        <View style={styles.todayProgress}>
          <Text style={styles.todayProgressLabel}>오늘의 학습</Text>
          <Text style={styles.todayProgressValue}>
            {Math.min(summary.studiedToday, DAILY_STUDY_TARGET)} / {DAILY_STUDY_TARGET}
          </Text>
        </View>
        <View style={styles.progressBlock}>
          <View style={styles.DetailBlock}>
            <Text style={{ color: "#fff", fontSize: 12 }}>외운 단어 수</Text>
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
        style={styles.TodayStudyButton}
        onPress={() => navigation.navigate("WordTest")}
      >
        <Text style={styles.TodayStudyButtonText}>
          {summary.studiedToday >= DAILY_STUDY_TARGET
            ? "오늘 학습 완료 ✓"
            : "오늘 학습 시작"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.WordStudybutton}
        onPress={() => navigation.navigate("Word")}
      >
        <Text style={styles.buttonText}>📚 단어 공부하러 가기</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.WordManagerbutton}
        onPress={() => navigation.navigate("WholeWordStat")}
      >
        <Text style={styles.buttonText}>학습 분석 보기</Text>
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
    gap: 24,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  progressCard: {
    justifyContent: "center",
    gap: 15,
    width: "100%",
    maxWidth: 640,
    minHeight: 160,
    paddingVertical: 22,
    backgroundColor: "#6366f1",
    borderRadius: 12,
  },
  progressBlock: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 25,

  },
  todayProgress: {
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  todayProgressLabel: {
    color: "#e0e7ff",
    fontSize: 14,
  },
  todayProgressValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
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
    minWidth: 210,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,

    backgroundColor: "#fff",
    borderColor: "#15803d",
    borderWidth: 1

  },
  TodayStudyButton: {
    minWidth: 210,
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: "#4f46e5",
    alignItems: "center",
  },
  TodayStudyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  WordManagerbutton: {
    alignContent: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,

    minWidth: 210,
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
  logoutButton: {
    position: "absolute",
    top: 16,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
  },
  logoutText: {
    color: "#64748b",
    fontSize: 13,
  },
});
