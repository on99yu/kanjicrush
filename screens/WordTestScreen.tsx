import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { ActivityIndicator, Alert, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { WordContext } from "../context/WordContext";
import WordTestCard from "../components/WordTestCard";
import { Check, Eye, X } from "lucide-react-native";
import { WordStatContext } from "../context/WordStatContext";
import { KanjiTableRow } from "../types/word";
import {
  buildDailyStudyPlan,
  DailyStudyPlan,
  DAILY_STUDY_TARGET,
} from "../utils/buildDailyStudyPlan";

export default function WordTestScreen() {
  const { words, loading } = useContext(WordContext);
  const { statsMap, loading: statLoading, updateProgress } = useContext(WordStatContext);

  const [testWords, setTestWords] = useState<KanjiTableRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<(null | "correct" | "wrong")[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [plan, setPlan] = useState<DailyStudyPlan | null>(null);
  const initialized = useRef(false);

  const startQuiz = useCallback(() => {
    const nextPlan = buildDailyStudyPlan(words, statsMap);
    setPlan(nextPlan);
    setTestWords(nextPlan.words);
    setCurrentIndex(0);
    setShowAnswer(false);
    setResults(new Array(nextPlan.words.length).fill(null));
    setSubmitting(false);
  }, [words, statsMap]);

  useEffect(() => {
    if (!loading && !statLoading && words.length > 0 && !initialized.current) {
      initialized.current = true;
      startQuiz();
    }
  }, [words, loading, statLoading, startQuiz]);

  if (loading || statLoading || !plan) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.emptyDescription}>퀴즈를 준비하고 있습니다.</Text>
      </View>
    );
  }

  if (testWords.length === 0) {
    if (plan.completedToday >= DAILY_STUDY_TARGET) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.completionEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>오늘 학습 완료</Text>
          <Text style={styles.emptyDescription}>
            오늘 목표 {DAILY_STUDY_TARGET}개를 모두 학습했습니다.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>퀴즈에 사용할 단어가 없습니다.</Text>
        <Text style={styles.emptyDescription}>
          홈의 단어장 관리에서 단어를 먼저 업데이트해 주세요.
        </Text>
      </View>
    );
  }

  const total = testWords.length;
  const currentWord = testWords[currentIndex];
  const progress = ((currentIndex + 1) / total) * 100;


  // 정답 확인 함수
  const handleCheck = () => {
    setShowAnswer(true);
  };

  // 정답 결과 처리 동작 함수
  const handleResult = async (result: "correct" | "wrong") => {
    if (submitting) return;

    const isCorrect = result === "correct";
    const wordId = currentWord?.id;

    if (typeof wordId !== "number") return;

    setSubmitting(true);
    try {
      await updateProgress(wordId, isCorrect);

      setResults((prev) => {
        const updated = [...prev];
        updated[currentIndex] = result;
        return updated;
      });

      if (currentIndex < total - 1) {
        setCurrentIndex((index) => index + 1);
        setShowAnswer(false);
      }
    } catch {
      Alert.alert("저장 실패", "학습 기록을 저장하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const correctCount = results.filter((r) => r === "correct").length;
  const wrongCount = results.filter((r) => r === "wrong").length;

  const isComplete = currentIndex === total - 1 && results[currentIndex] !== null;

  return (
    <View style={styles.container}>
      {/* 진행도 표시 */}
      <View style={styles.progressWrapper}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            오늘의 학습 · 새 단어 {plan.newCount} · 복습 {plan.reviewCount + plan.knownCount}
          </Text>
          <Text style={styles.progressCount}>
            {currentIndex + 1} / {total}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>


      {/* 단어 카드 */}
      <WordTestCard word={currentWord} showAnswer={showAnswer} />

      {/* 버튼 */}
      <View style={styles.navButtons}>
        {!showAnswer && !isComplete && (
          <TouchableOpacity onPress={handleCheck} style={styles.checkButton}>
            <Eye size={18} color="#4f46e5" /><Text style={{ color: "#4f46e5", fontSize: 16 }}>정답 확인</Text>
          </TouchableOpacity>
        )}

        {showAnswer && !isComplete && (
          <View style={styles.resultButtons}>
            <TouchableOpacity
              onPress={() => handleResult("wrong")}
              disabled={submitting}
              style={[styles.resultButton, styles.wrongButton, submitting && styles.disabledButton]}
            >
              <X size={24} color="#b91c1c" /><Text style={{ color: "#b91c1c", fontSize: 16 }}>틀렸다</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleResult("correct")}
              disabled={submitting}
              style={[styles.resultButton, styles.correctButton, submitting && styles.disabledButton]}
            >
              <Check size={24} color="#15803d" /><Text style={{ color: "#15803d", fontSize: 16 }}>맞췄다</Text>
            </TouchableOpacity>
          </View>
        )}

        {isComplete && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              이번 학습 완료 🎉
            </Text>
            <Text style={styles.summaryText}>
              정답: {correctCount} / 오답: {wrongCount}
            </Text>
            <Text style={styles.summaryDescription}>
              홈으로 돌아가면 오늘의 진척도를 확인할 수 있습니다.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
    backgroundColor: "#f9fafb",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  emptyDescription: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
  },
  completionEmoji: {
    fontSize: 48,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    padding: 16,
  },
  progressWrapper: {
    width: "90%",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,  // mb-2
  },
  progressLabel: {
    fontSize: 12,     // text-xs
    fontWeight: "600",
    color: "#6b7280", // text-gray-500
  },
  progressCount: {
    fontSize: 12,     // text-xs
    fontWeight: "600",
    color: "#6b7280", // text-gray-500
  },
  progressTrack: {
    height: 8,              // h-2
    backgroundColor: "#e5e7eb", // bg-gray-200
    borderRadius: 9999,     // rounded-full
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#6366f1", // bg-indigo-500
    borderRadius: 9999,
  },
  navButtons: {
    marginTop: 20,
    alignItems: "center",
    height: 120,
    justifyContent: "flex-start",
  },
  checkButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: "#eef2ff",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#4f46e5",

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,

  },
  resultButtons: {
    flexDirection: "row",
    marginTop: 24,
    gap: 16,
  },
  resultButton: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 20,
    borderRadius: 8,
    gap: 8,
  },
  wrongButton: {
    backgroundColor: "#fee2e2",
  },
  correctButton: {
    backgroundColor: "#dcfce7",
  },
  disabledButton: {
    opacity: 0.5,
  },
  summaryBox: {
    alignItems: "center",
    marginTop: 12,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
  },
  summaryDescription: {
    marginTop: 8,
    color: "#64748b",
    textAlign: "center",
  },
});
