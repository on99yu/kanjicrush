import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { KanjiTableRow } from '../types/word';

type Props = {
  word: KanjiTableRow;
};

export default function WordCard({ word }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  useEffect(() => setShowDetails(false), [word.id]);

  const wordFontSize = word.word.length >= 7 ? 36 : 48;

  const kanjiFontSize = word.kanjiList.length >= 4 ? 20 : 28; // 4개 이상이면 20으로 줄임
  const kanjiPaddingVertical = word.kanjiList.length >= 4 ? 4 : 8;
  const kanjiPaddingHorizontal = word.kanjiList.length >= 4 ? 8 : 12;

  return (
    <View style={styles.container}>
      <Text style={[styles.word, {fontSize : wordFontSize}]}>{word.word}</Text>
      <Text style={styles.meaning}>{word.meaning}</Text>
      <Text style={styles.reading}>읽기 · {word.reading}</Text>

      {word.kanjiList.length > 0 && <TouchableOpacity onPress={() => setShowDetails((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded: showDetails }} style={{ padding: 16 }}><Text style={{ color: '#4f46e5' }}>한자 음독·훈독 {showDetails ? '접기' : '보기'}</Text></TouchableOpacity>}
      {showDetails && <View style={styles.kanjiContainer}>
        {word.kanjiList.map((kanji, index) => (
          <View key={index} style={[
              styles.kanjiRow,
              {
                paddingVertical: kanjiPaddingVertical,
                paddingHorizontal: kanjiPaddingHorizontal,
              },
            ]}>
            <Text style={[styles.kanjiText, { fontSize: kanjiFontSize }]}>
              {kanji.kanji}
            </Text>
            {!!kanji.onyomi && <Text style={styles.readingText}>음독: {kanji.onyomi}</Text>}
            {!!kanji.kunyomi && <Text style={styles.readingText}>훈독: {kanji.kunyomi}</Text>}
          </View>
        ))}
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginVertical: 20,
  },
  word: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  reading: {
    fontSize: 20,
    color: '#555',
    marginBottom: 4,
  },
  meaning: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  kanjiContainer: {
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 6,
  },
  kanjiRow: {
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  kanjiText: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 4,
  },
  readingText: {
    fontSize: 16,
    color: '#333',
  },
});
