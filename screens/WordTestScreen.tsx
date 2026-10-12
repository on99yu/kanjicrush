import React, { useState, useContext, useCallback, useRef } from "react";
import { ActivityIndicator, ScrollView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { RootTabParamList } from "../types/screen";
import { WordContext } from "../context/WordContext";
import WordTestCard from "../components/WordTestCard";
import { WordStatContext } from "../context/WordStatContext";
import { KanjiTableRow } from "../types/word";
import { buildDailyStudyPlan, DailyStudyPlan, STUDY_BATCH_SIZE, studyDayKey } from "../utils/buildDailyStudyPlan";

export default function WordTestScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const { words, loading } = useContext(WordContext);
  const { statsMap, loading: statLoading, updateProgress, resetVersion } = useContext(WordStatContext);
  const latest = useRef({ words, statsMap });
  latest.current = { words, statsMap };
  const sessionDay = useRef(studyDayKey());
  const saving = useRef(false);
  const [testWords, setTestWords] = useState<KanjiTableRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<DailyStudyPlan | null>(null);

  const startQuiz = useCallback(() => {
    if (saving.current) return;
    const nextPlan = buildDailyStudyPlan(latest.current.words, latest.current.statsMap);
    sessionDay.current = studyDayKey();
    setPlan(nextPlan);
    setTestWords(nextPlan.words.slice(0, STUDY_BATCH_SIZE));
    setCurrentIndex(0);
    setShowAnswer(false);
    setResults([]);
    setError("");
  }, []);

  useFocusEffect(useCallback(() => {
    if (loading || statLoading) return;
    startQuiz();
    const timer = setInterval(() => {
      if (sessionDay.current !== studyDayKey()) startQuiz();
    }, 60_000);
    return () => clearInterval(timer);
  }, [loading, statLoading, resetVersion, startQuiz]));

  const handleResult = async (isCorrect: boolean) => {
    if (saving.current || !showAnswer || results.length === testWords.length) return;
    if (sessionDay.current !== studyDayKey()) { startQuiz(); return; }
    const word = testWords[currentIndex];
    if (!word) return;
    saving.current = true;
    setSubmitting(true);
    setError("");
    try {
      await updateProgress(word.id, isCorrect);
      setResults((previous) => [...previous, isCorrect]);
      if (currentIndex < testWords.length - 1) {
        setCurrentIndex((index) => index + 1);
        setShowAnswer(false);
      }
    } catch {
      setError("기록을 저장하지 못했습니다. 같은 버튼을 다시 눌러 주세요.");
    } finally {
      saving.current = false;
      setSubmitting(false);
    }
  };

  const homeButton = <TouchableOpacity style={styles.secondary} onPress={() => navigation.navigate("Home")}><Text style={styles.secondaryText}>홈으로</Text></TouchableOpacity>;
  if (loading || statLoading || !plan) return <View style={styles.empty}><ActivityIndicator size="large" color="#6366f1" /><Text>학습을 준비하고 있습니다.</Text></View>;
  if (!testWords.length) return (
    <View style={styles.empty}>
      <Text style={styles.title}>{words.length ? "오늘 예정 학습 완료 ✓" : "저장된 단어가 없습니다"}</Text>
      <Text style={styles.description}>{words.length ? `오늘 ${plan.completedToday}개를 공부했습니다.\n새 단어는 하루 최대 10개, 복습 포함 최대 50개입니다.\n오늘 모른다고 한 단어는 내일부터 다시 만납니다.` : "단어장 관리에서 단어를 업데이트해 주세요."}</Text>
      {homeButton}
    </View>
  );
  const complete = results.length === testWords.length;
  const remaining = complete ? buildDailyStudyPlan(words, statsMap).remainingToday : 0;
  if (complete) return (
    <View style={styles.empty}>
      <Text style={styles.title}>{testWords.length}개 학습 완료</Text>
      <Text style={styles.result}>{results.filter(Boolean).length}개 안다 · {results.filter((result) => !result).length}개 모른다</Text>
      <Text style={styles.description}>{remaining ? `오늘 예정 학습 ${remaining}개가 남았습니다.\n잠깐 쉬었다가 이어가도 괜찮습니다.` : "오늘 예정된 학습을 끝냈습니다.\n내일 간격에 맞춰 다시 복습하세요."}</Text>
      {remaining > 0 && <TouchableOpacity style={styles.primary} onPress={startQuiz}><Text style={styles.primaryText}>다음 {Math.min(remaining, STUDY_BATCH_SIZE)}개 이어하기</Text></TouchableOpacity>}
      {homeButton}
    </View>
  );
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>뜻 떠올리기</Text>
          <Text style={styles.description}>이번 묶음 {results.length} / {testWords.length} · 오늘 {plan.completedToday + results.length}개 학습</Text>
          <View style={styles.track}><View style={[styles.fill, { width: `${results.length / testWords.length * 100}%` }]} /></View>
        </View>
        <ScrollView style={styles.cardScroll} contentContainerStyle={styles.cardArea}>
          <Text style={styles.badge}>{statsMap[testWords[currentIndex].id] ? "복습 단어" : "새 단어"}</Text>
          <WordTestCard word={testWords[currentIndex]} showAnswer={showAnswer} />
        </ScrollView>
        <View style={styles.footer}>
          <Text style={styles.hint}>확인 전에 뜻을 떠올렸으면 ‘안다’ · 읽기는 평가하지 않습니다</Text>
          {showAnswer ? <View style={styles.buttons}>
            <TouchableOpacity accessibilityRole="button" disabled={submitting} style={[styles.rating, styles.wrong, submitting && styles.disabled]} onPress={() => handleResult(false)}><Text style={styles.wrongText}>모른다</Text></TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" disabled={submitting} style={[styles.rating, styles.correct, submitting && styles.disabled]} onPress={() => handleResult(true)}><Text style={styles.correctText}>안다</Text></TouchableOpacity>
          </View> : <TouchableOpacity accessibilityRole="button" style={styles.primary} onPress={() => setShowAnswer(true)}><Text style={styles.primaryText}>뜻 확인하기</Text></TouchableOpacity>}
          <Text accessibilityLiveRegion="polite" style={styles.error}>{submitting ? "저장 중…" : error || " "}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  content: { flex: 1, width: "100%", maxWidth: 640, alignSelf: "center" },
  empty: { flex: 1, backgroundColor: "#f8fafc", padding: 24, gap: 20, alignItems: "center", justifyContent: "center" },
  header: { gap: 12, paddingVertical: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", textAlign: "center" },
  description: { fontSize: 14, lineHeight: 23, color: "#64748b", textAlign: "center" },
  track: { height: 6, backgroundColor: "#e2e8f0", borderRadius: 8, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: "#6366f1" },
  cardScroll: { flex: 1 },
  cardArea: { flexGrow: 1, justifyContent: "center", paddingVertical: 20, gap: 12 },
  badge: { color: "#64748b", fontSize: 13, textAlign: "center" },
  footer: { gap: 12, paddingTop: 12 },
  hint: { color: "#64748b", fontSize: 12, textAlign: "center" },
  buttons: { flexDirection: "row", gap: 12 },
  rating: { flex: 1, minHeight: 60, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1 },
  wrong: { backgroundColor: "#fff1f2", borderColor: "#fecdd3" },
  correct: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  wrongText: { fontSize: 18, color: "#be123c", fontWeight: "700" },
  correctText: { fontSize: 18, color: "#047857", fontWeight: "700" },
  primary: { minHeight: 60, backgroundColor: "#4f46e5", borderRadius: 12, paddingHorizontal: 24, justifyContent: "center", alignItems: "center" },
  primaryText: { fontSize: 17, color: "white", fontWeight: "700" },
  secondary: { padding: 16 },
  secondaryText: { color: "#4f46e5", fontSize: 16 },
  result: { color: "#334155", fontSize: 18 },
  error: { minHeight: 20, fontSize: 12, color: "#be123c", textAlign: "center" },
  disabled: { opacity: 0.5 },
});
