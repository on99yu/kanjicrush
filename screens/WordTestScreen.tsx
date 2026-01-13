import React, { useState, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { WordContext } from "../context/WordContext";
import WordTestCard from "../components/WordTestCard";
import { Check, Eye, X } from "lucide-react-native";
import { WordStatContext } from "../context/WordStatContext";

// 배열 섞기
function shuffleArray(array: any[]) {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

export default function WordTestScreen() {
  const { words } = useContext(WordContext);
  const { updateProgress } = useContext(WordStatContext);

  const dailyLimit = 100; // 하루 학습 단어 수
  const [testWords, setTestWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<(null | "correct" | "wrong")[]>([]);



  useEffect(() => {
    if (words.length > 0) {
      const selected = shuffleArray(words).slice(0, dailyLimit);
      setTestWords(selected);
      setCurrentIndex(0);
      setShowAnswer(false);
      setResults(new Array(selected.length).fill(null));
    }
  }, [words]);

  if (testWords.length === 0) return null;

  const total = testWords.length;
  const currentWord = testWords[currentIndex];
  const progress = ((currentIndex + 1) / total) * 100;


  // 정답 확인 함수
  const handleCheck = () => {
    setShowAnswer(true);
  };

  // 정답 결과 처리 동작 함수
  const handleResult = async (result: "correct" | "wrong") => {

    const isCorrect = result === "correct";
    const wordId = currentWord?.id;

    // 로컬 결과 저장
    setResults((prev) => {
      const updated = [...prev];
      updated[currentIndex] = result;
      return updated;
    })

    // 스탯 업데이트
    if (typeof wordId === "number") {
      await updateProgress(wordId, isCorrect);
    } else {
      console.warn("currentWord.id가 숫자가 아님. wordId 매핑 확인 필요", currentWord)
    }

    // 다음 단어로 이동
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
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
            랜덤 단어 퀴즈
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
              style={[styles.resultButton, styles.wrongButton]}
            >
              <X size={24} color="#b91c1c" /><Text style={{ color: "#b91c1c", fontSize: 16 }}>틀렸다</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleResult("correct")}
              style={[styles.resultButton, styles.correctButton]}
            >
              <Check size={24} color="#15803d" /><Text style={{ color: "#15803d", fontSize: 16 }}>맞췄다</Text>
            </TouchableOpacity>
          </View>
        )}

        {isComplete && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>오늘 학습 완료 🎉</Text>
            <Text style={styles.summaryText}>
              정답: {correctCount} / 오답: {wrongCount}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f9fafb",
    paddingTop: 250
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
    gap: 50,
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
  summaryBox: {
    alignItems: "center",
    marginTop: 12,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
  },
});
