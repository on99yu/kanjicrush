import { View, Text, StyleSheet } from "react-native";
import { KanjiTableRow } from "../types/word";

type Props = {
  word: KanjiTableRow;
  showAnswer: boolean;
};

export default function WordTestCard({ word, showAnswer }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.word}>{word.word}</Text>
      {showAnswer && (
        <>
          <Text style={styles.reading}>{word.reading}</Text>
          <Text style={styles.meaning}>{word.meaning}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor:"#fff",
    padding:24,
    borderRadius:16,
    width:"90%",
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
    fontSize:18,
    marginTop:8,
  },
});
