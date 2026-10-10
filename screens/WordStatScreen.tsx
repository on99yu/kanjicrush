import React, { useCallback, useContext, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { WordStatContext } from "../context/WordStatContext";
import { WordContext } from "../context/WordContext";
import { AuthContext } from "../context/AuthContext";
import { fetchStudyHistory } from "../api/progressApi";
import { StudyHistory } from "../types/studyStats";
import { getAccuracy } from "../utils/CalAccuracy";
import { isKnownWord } from "../utils/isKnownWord";
import { DAILY_STUDY_TARGET } from "../utils/buildDailyStudyPlan";

type Filter = "weak" | "known" | "all";

export default function WordStatScreen() {
  const navigation = useNavigation();
  const { statsMap, refreshStats } = useContext(WordStatContext);
  const { words } = useContext(WordContext);
  const { session } = useContext(AuthContext);
  const [history, setHistory] = useState<StudyHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState<7 | 30>(7);
  const [filter, setFilter] = useState<Filter>("weak");

  const loadHistory = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(false);
    try {
      await refreshStats();
      setHistory(await fetchStudyHistory(session.token));
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [session, refreshStats]);

  useFocusEffect(useCallback(() => { void loadHistory(); }, [loadHistory]));

  const wordMap = useMemo(() => new Map(words.map((word) => [word.id, word])), [words]);
  const studied = Object.values(statsMap).filter((stat) => wordMap.has(stat.wordId));
  const knownCount = studied.filter(isKnownWord).length;
  const rows = studied.filter((stat) => filter === "all" || (filter === "known" ? isKnownWord(stat) : !isKnownWord(stat)));
  rows.sort((a, b) => filter === "known"
    ? getAccuracy(b) - getAccuracy(a) || b.correctCount - a.correctCount
    : getAccuracy(a) - getAccuracy(b) || b.wrongCount - a.wrongCount);
  const days = history?.days.slice(-period) ?? [];
  const totalAnswers = days.reduce((sum, day) => sum + day.answers, 0);
  const totalCorrect = days.reduce((sum, day) => sum + day.correct, 0);
  const totalWords = days.reduce((sum, day) => sum + day.wordCount, 0);
  const achievedDays = days.filter((day) => day.wordCount >= DAILY_STUDY_TARGET).length;
  const chartDays = history?.days.slice(-7) ?? [];
  const maxWords = Math.max(DAILY_STUDY_TARGET, ...chartDays.map((day) => day.wordCount));

  return (
    <FlatList style={styles.screen} contentContainerStyle={styles.content}
      data={rows} keyExtractor={(item) => String(item.wordId)}
      refreshing={loading} onRefresh={loadHistory}
      ListHeaderComponent={
        <View style={styles.headerContent}>
          <View style={styles.header}>
            <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()}><Text style={styles.link}>‹ 뒤로</Text></TouchableOpacity>
            <Text style={styles.title}>학습 분석</Text>
            <TouchableOpacity accessibilityRole="button" disabled={loading} onPress={loadHistory}><Text style={styles.link}>새로고침</Text></TouchableOpacity>
          </View>
          <View style={styles.switchRow}>
            {([7, 30] as const).map((value) => (
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: period === value }} key={value} onPress={() => setPeriod(value)} style={[styles.chip, period === value && styles.activeChip]}>
                <Text style={period === value ? styles.activeText : styles.muted}>최근 {value}일</Text>
              </TouchableOpacity>
            ))}
          </View>
          {loading && !history && <ActivityIndicator color="#4f46e5" />}
          {error && <Text style={styles.error}>최근 기록을 불러오지 못했습니다. 연결을 확인하고 새로고침해 주세요. {history ? "마지막으로 불러온 기록을 표시합니다." : "단어별 기록은 기기에 저장된 내용을 표시합니다."}</Text>}
          {history && <>
            <View style={styles.metrics}>
              <View style={styles.metric}><Text style={styles.muted}>누적 학습량</Text><Text style={styles.metricValue}>{totalWords}개</Text><Text style={styles.caption}>일별 단어 수 합계</Text></View>
              <View style={styles.metric}><Text style={styles.muted}>정답률</Text><Text style={styles.metricValue}>{totalAnswers ? `${Math.round(totalCorrect / totalAnswers * 100)}%` : "—"}</Text><Text style={styles.caption}>{totalAnswers}회 평가 기준</Text></View>
              <View style={styles.metric}><Text style={styles.muted}>목표 달성</Text><Text style={styles.metricValue}>{achievedDays}일</Text><Text style={styles.caption}>{period}일 중 · 하루 {DAILY_STUDY_TARGET}개</Text></View>
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>최근 7일 학습량</Text>
              <View style={styles.chart}>
                {chartDays.map((day) => <View key={day.date} style={styles.column} accessibilityLabel={`${day.date}: ${day.wordCount}개 학습`}>
                  <Text style={styles.caption}>{day.wordCount}</Text>
                  <View style={styles.barTrack}><View style={[styles.bar, { height: `${day.wordCount / maxWords * 100}%`, backgroundColor: day.wordCount >= DAILY_STUDY_TARGET ? "#16a34a" : "#6366f1" }]} /></View>
                  <Text style={styles.caption}>{day.date.slice(5).replace("-", "/")}</Text>
                </View>)}
              </View>
              <Text style={styles.caption}>같은 날 같은 단어는 한 개로 계산합니다. 초록색은 목표 달성일입니다.</Text>
            </View>
          </>}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>내 단어 현황</Text>
            <Text style={styles.overview}>숙지 {knownCount}개 · 학습 중 {studied.length - knownCount}개 · 미학습 {Math.max(0, words.length - studied.length)}개</Text>
            <Text style={styles.caption}>숙지: 5회 이상 정답, 누적 정답률 85% 이상</Text>
          </View>
          <Text style={styles.sectionTitle}>단어별 기록</Text>
          <View style={styles.switchRow}>
            {([{ key: "weak", label: "학습 중·취약" }, { key: "known", label: "숙지" }, { key: "all", label: "전체 기록" }] as const).map(({ key, label }) => (
              <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: filter === key }} key={key} onPress={() => setFilter(key)} style={[styles.chip, filter === key && styles.activeChip]}>
                <Text style={filter === key ? styles.activeText : styles.muted}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.caption}>{filter === "known" ? "정답률이 높은 순" : "정답률이 낮고 오답이 많은 순"} · 전체 기록 기준</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{studied.length ? "해당하는 단어가 없습니다." : "아직 학습 기록이 없습니다. 오늘 학습을 시작해 보세요."}</Text>}
      renderItem={({ item }) => {
        const word = wordMap.get(item.wordId);
        return <View style={styles.wordRow}>
          <View style={styles.wordInfo}><Text style={styles.word}>{word?.word}</Text><Text style={styles.muted}>{word?.reading} · {word?.meaning}</Text></View>
          <View style={styles.result}><Text style={styles.accuracy}>{getAccuracy(item)}%</Text><Text style={styles.caption}>안다 {item.correctCount} · 모른다 {item.wrongCount}</Text></View>
        </View>;
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 20, gap: 10, width: "100%", maxWidth: 720, alignSelf: "center", paddingBottom: 40 },
  headerContent: { gap: 16, marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { flex: 1, fontSize: 24, fontWeight: "800", color: "#0f172a" },
  link: { color: "#4f46e5", fontWeight: "600", paddingVertical: 12 },
  switchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: "#e2e8f0" },
  activeChip: { backgroundColor: "#4f46e5" },
  activeText: { color: "#fff", fontWeight: "600" },
  muted: { color: "#475569", fontSize: 14 },
  caption: { color: "#64748b", fontSize: 12, lineHeight: 18 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: { flexGrow: 1, flexBasis: 130, backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 6 },
  metricValue: { fontSize: 26, fontWeight: "800", color: "#312e81" },
  card: { backgroundColor: "#fff", padding: 18, borderRadius: 16, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  overview: { color: "#334155", lineHeight: 24 },
  chart: { flexDirection: "row", gap: 6, height: 150 },
  column: { flex: 1, alignItems: "center", gap: 4 },
  barTrack: { flex: 1, width: "65%", backgroundColor: "#f1f5f9", borderRadius: 6, justifyContent: "flex-end", overflow: "hidden" },
  bar: { width: "100%", borderRadius: 6 },
  wordRow: { backgroundColor: "#fff", borderRadius: 14, padding: 16, gap: 12, flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  wordInfo: { flex: 1, minWidth: 130, gap: 4 },
  word: { fontSize: 21, fontWeight: "700", color: "#0f172a" },
  result: { gap: 4, alignItems: "flex-end" },
  accuracy: { color: "#4f46e5", fontSize: 18, fontWeight: "700" },
  empty: { paddingVertical: 32, textAlign: "center", color: "#64748b" },
  error: { color: "#b91c1c", lineHeight: 22 },
});
