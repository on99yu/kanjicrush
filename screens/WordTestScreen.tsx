import React, { useState, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { WordContext } from "../context/WordContext";
import WordTestCard from "../components/WordTestCard";

// 배열 섞기
function shuffleArray(array: any[]) {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

export default function WordTestScreen() {
  const { words } = useContext(WordContext);

  const dailyLimit = 20; // 하루 학습 단어 수
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

  const handleCheck = () => {
    setShowAnswer(true);
  };

  const handleResult = (result: "correct" | "wrong") => {
    const updated = [...results];
    updated[currentIndex] = result;
    setResults(updated);

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
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {total}
        </Text>
      </View>

      {/* 단어 카드 */}
      <WordTestCard word={currentWord} showAnswer={showAnswer} />

      {/* 버튼 */}
      <View style={styles.navButtons}>
        {!showAnswer && !isComplete && (
          <TouchableOpacity onPress={handleCheck} style={styles.checkButton}>
            <Text style={styles.buttonText}>정답 확인</Text>
          </TouchableOpacity>
        )}

        {showAnswer && !isComplete && (
          <View style={styles.resultButtons}>
            <TouchableOpacity
              onPress={() => handleResult("correct")}
              style={[styles.resultButton, styles.correctButton]}
            >
              <Text style={styles.buttonText}>맞췄다 ✅</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleResult("wrong")}
              style={[styles.resultButton, styles.wrongButton]}
            >
              <Text style={styles.buttonText}>틀렸다 ❌</Text>
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
    flex:1,
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:"#f9fafb"
  },
  progressWrapper: {
    paddingHorizontal:20,
    paddingVertical:10,
  },
  progressContainer: {
    height:10,
    backgroundColor:"#e5e7eb",
    borderRadius:5,
    overflow:"hidden",
  },
  progressBar: {
    height:"100%",
    backgroundColor:"#3b82f6",
  },
  progressText: {
    marginTop:6,
    fontSize:14,
    fontWeight:"bold",
    color:"#374151",
    alignSelf:"flex-end",
  },
  navButtons: {
    marginTop:20,
    alignItems:"center",
  },
  checkButton: {
    padding:15,
    backgroundColor:"#10b981",
    borderRadius:8,
  },
  resultButtons: {
    flexDirection:"row",
    gap:12,
  },
  resultButton: {
    padding:15,
    borderRadius:8,
  },
  correctButton: {
    backgroundColor:"#3b82f6",
  },
  wrongButton: {
    backgroundColor:"#ef4444",
  },
  buttonText: {
    color:"white",
    fontWeight:"bold",
  },
  summaryBox: {
    alignItems:"center",
    marginTop:12,
  },
  summaryText: {
    fontSize:18,
    fontWeight:"bold",
    color:"#374151",
  },
});
