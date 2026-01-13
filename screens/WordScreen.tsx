import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import WordCard from "../components/WordCard";;
import { useContext } from "react";
import { WordContext } from "../context/WordContext";

function shuffleArray(array: any[]) {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}


export default function WordScreen() {
  const { words } = useContext(WordContext);

  const [shuffledWords, setShuffledWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);

  useEffect(() => {
    setShuffledWords(shuffleArray(words));
  }, [words]);


  const currentWords = isShuffled ? shuffledWords : words;
  const totalWords = words.length;


  const goNext = () => {
    if (currentIndex < totalWords - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
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

  if (currentWords.length === 0) return null
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
  },
  navButtons: {
    flex: 1,
    position: "absolute",
    bottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "60%",
  },
  button: {
    padding: 15,
    backgroundColor: "#6366f1",
    borderRadius: 8,
  },
  shuffleButton: {
    padding: 15,
    backgroundColor: "#3b82f6", // 초록색으로 구분
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
