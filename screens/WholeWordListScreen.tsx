import React, { useContext, useState } from "react";
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity } from "react-native";
import { WordContext } from "../context/WordContext";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft } from "lucide-react-native";

export default function KanjiWordListScreen() {

  const navigation = useNavigation()
  const { words, loading } = useContext(WordContext);

  // 페이지네이션 상태
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 100;

  // 현재 페이지에 맞는 단어들
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pagedWords = words.slice(0, end);

  const hasMore = end < words.length;

  const loadMore = () => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  if (loading) return <Text>로딩 중...</Text>;

  return (
    <View style={styles.container}>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          width: '15%',
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 8, paddingHorizontal: 8, marginRight: 8,
          borderWidth: 1, borderColor: "#4A90E2", borderRadius: 10,
        }}
      >
        <ChevronLeft size={24} color="#111827" />
      </TouchableOpacity>
      {/* 테이블 헤더 */}
      <View style={[styles.row, styles.header]}>
        <Text style={[styles.cell, styles.headerText]}>단어</Text>
        <Text style={[styles.cell, styles.headerText]}>읽기</Text>
        <Text style={[styles.cell, styles.headerText]}>의미</Text>
      </View>

      {/* 데이터 리스트 */}
      <FlatList
        data={pagedWords}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{item.word}</Text>
            <Text style={styles.cell}>{item.reading}</Text>
            <Text style={styles.cell}>{item.meaning}</Text>
          </View>
        )}
        ListFooterComponent={
          hasMore ? (
            <View style={styles.footer}>
              <Button title="더 불러오기" onPress={loadMore} />
            </View>
          ) : (
            <Text style={styles.footerText}>모든 단어를 불러왔습니다</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: "#fff",
    gap: 16,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
  },
  header: {
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 2,
  },
  headerText: {
    fontWeight: "bold",
  },
  cell: {
    flex: 1,
    textAlign: "center",
  },
  footer: {
    padding: 12,
    alignItems: "center",
  },
  footerText: {
    textAlign: "center",
    color: "#666",
    marginVertical: 8,
  },
});
