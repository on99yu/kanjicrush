import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { HomeScreenProps } from "../types/screen";

export default function HomeScreen({ navigation }: HomeScreenProps) {

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kanji Crush</Text>
      <TouchableOpacity
        style={styles.WordStudybutton}
        onPress={() => navigation.navigate("Word")}
      >
        <Text style={styles.buttonText}>📚 단어 공부하러 가기</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.WordManagerbutton}
        onPress={() => navigation.navigate("WordManager")}
      >
        <Text style={styles.buttonText}>단어장 관리</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
  },
  WordStudybutton: {
    backgroundColor: "#4f46e5", // indigo-600
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  WordManagerbutton: {
    backgroundColor: "#4f46e5", // indigo-600
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
