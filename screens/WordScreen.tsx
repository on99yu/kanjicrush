import React, { useState, useEffect } from "react";
import { ActivityIndicator, View, StyleSheet, TouchableOpacity, Text } from "react-native";
import WordCard from "../components/WordCard";;
import { useContext } from "react";
import { WordContext } from "../context/WordContext";
import { KanjiTableRow } from "../types/word";
import { shuffleArray } from "../utils/shuffleArray";


export default function WordScreen() {
  const { words, loading } = useContext(WordContext);

  const [shuffledWords, setShuffledWords] = useState<KanjiTableRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);

  useEffect(() => {
    setShuffledWords(shuffleArray(words));
    setCurrentIndex(0);
  }, [words]);


  const currentWords = isShuffled ? shuffledWords : words;
  const totalWords = currentWords.length;


  const goNext = () => {
    if (currentIndex < totalWords - 1) {
      setCurrentIndex((index) => index + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1);
    }
  };

  const toggleShuffle = () => {
    if (!isShuffled) {
      // 셔플 모드로 전환
      setShuffledWords(shuffleArray(words));
      setCurrentIndex(0);
      setIsShuffled(true);
    } else {
      // 정방향 모드로 전환
      setCurrentIndex(0);
      setIsShuffled(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.emptyDescription}>단어를 불러오고 있습니다.</Text>
      </View>
    );
  }

  if (currentWords.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>저장된 단어가 없습니다.</Text>
        <Text style={styles.emptyDescription}>
          홈의 단어장 관리에서 단어를 업데이트해 주세요.
        </Text>
      </View>
    );
  }
  const progress = ((currentIndex + 1) / totalWords) * 100;
  return (
    <View style={styles.container}>

      <View style={styles.progressWrapper}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {totalWords}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <WordCard word={currentWords[currentIndex]} />
      </View>

      <View style={styles.navButtons}>
        <TouchableOpacity
          onPress={goPrev}
          disabled={currentIndex === 0}
          style={[styles.button, currentIndex === 0 && styles.disabledButton]}
        >
          <Text style={styles.buttonText}>◀ 이전</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleShuffle} style={styles.shuffleButton}>
          <Text style={styles.buttonText}>
            {isShuffled ? "정방향" : "셔플"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goNext}
          disabled={currentIndex === totalWords - 1}
          style={[
            styles.button,
            currentIndex === totalWords - 1 && styles.disabledButton,
          ]}
        >
          <Text style={styles.buttonText}>다음 ▶</Text>
        </TouchableOpacity>
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
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  progressWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  progressContainer: {
    height: 10,
    backgroundColor: "#e5e7eb",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#3b82f6",
  },
  progressText: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    alignSelf: "flex-end",
  },
  cardContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    paddingBottom: 80,
  },
  navButtons: {
    position: "absolute",
    bottom: 20,
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    maxWidth: 440,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#6366f1",
    borderRadius: 8,
  },
  shuffleButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#3b82f6",
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: "#a0aec0",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
