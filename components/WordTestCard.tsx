import { View, Text, StyleSheet } from "react-native";
import { KanjiTableRow } from "../types/word";

type Props = {
  word: KanjiTableRow;
  showAnswer: boolean;
};

export default function WordTestCard({ word, showAnswer }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>이 단어의 뜻은?</Text>
      <Text style={[styles.word, { fontSize: word.word.length > 6 ? 34 : 48 }]}>{word.word}</Text>
      <View style={styles.answer}>
        {showAnswer ? <>
          <Text style={styles.meaning}>{word.meaning}</Text>
          <Text style={styles.reading}>읽기 · {word.reading}</Text>
        </> : <Text style={styles.hint}>뜻을 먼저 떠올린 뒤 확인하세요.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor:"#fff",
    padding:24,
    borderRadius:16,
    width:"100%",
    alignSelf:"center",
    alignItems:"center",
    shadowColor:"#000",
    shadowOpacity:0.1,
    shadowRadius:8,
    elevation:3,
    marginVertical:20,
  },
  word: {
    fontSize:48,
    fontWeight:"bold",
    marginBottom:16,
  },
  reading: {
    fontSize:20,
    color:"#555",
    marginBottom:4,
  },
  meaning: {
    fontSize:24,
    fontWeight:"600",
    color:"#0f172a",
    textAlign:"center",
    marginTop:8,
  },
  label: { color: "#64748b", fontSize: 13, marginBottom: 20, textAlign: "center" },
  answer: { minHeight: 120, width: "100%", justifyContent: "center", alignItems: "center", gap: 12, paddingTop: 16, borderTopWidth: 1, borderColor: "#e2e8f0" },
  hint: { color: "#64748b", textAlign: "center", lineHeight: 24 },
});
