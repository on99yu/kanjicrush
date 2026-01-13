import React, { useContext, useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { WordStatContext } from "../context/WordStatContext";
import { getDBConnection } from "../db/sqlite";
import { getAccuracy } from "../utils/CalAccuracy";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft } from "lucide-react-native";

type Row = { wordId: number; word: string };

export default function WordStatScreen() {
  const navigation = useNavigation();
  const { statsMap, loading } = useContext(WordStatContext);
  const [wordMap, setWordMap] = useState<Record<number, string>>({});

  const sortedList = useMemo(() => {
    const list = Object.values(statsMap);
    list.sort((a, b) => {
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      const accA = getAccuracy(a);
      const accB = getAccuracy(b);
      if (accB !== accA) return accB - accA;
      return (b.lastAnsweredAt ?? 0) - (a.lastAnsweredAt ?? 0);
    });
    return list;
  }, [statsMap]);

  // ✅ stats에 있는 wordId만 KanjiWord에서 가져오기
  useEffect(() => {
    const loadWordsForStats = async () => {
      try {
        const ids = Object.keys(statsMap).map(Number);
        if (ids.length === 0) {
          setWordMap({});
          return;
        }

        const db = await getDBConnection();

        // SQLite IN (...) 파라미터 생성
        const placeholders = ids.map(() => "?").join(",");
        const rows: any[] = await db.getAllAsync(
          `SELECT id as wordId, word FROM KanjiWord WHERE id IN (${placeholders})`,
          ids
        );

        const map: Record<number, string> = {};
        for (const r of rows) map[r.wordId] = r.word;

        setWordMap(map);
      } catch (e) {
        console.error("WordStatScreen word 로드 실패:", e);
      }
    };

    loadWordsForStats();
  }, [statsMap]);

  if (loading) {
    return (
      <View style={{ padding: 16 }}>
        <Text>로딩중...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 16, }}>
      <View style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>
          단어 스탯 (맞춘갯수 많은 순)
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            paddingVertical: 8, paddingHorizontal: 8, marginRight: 8,
            borderWidth: 1, borderColor: "#4A90E2", borderRadius: 10,
          }}
        >
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={sortedList}
        keyExtractor={(item) => String(item.wordId)}
        contentContainerStyle={{ gap: 8, paddingBottom: 24 }}
        renderItem={({ item }) => {
          const word = wordMap[item.wordId] ?? `wordId:${item.wordId}`;
          const acc = getAccuracy(item);

          return (
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderRadius: 10,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", flexShrink: 1 }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {word}
              </Text>

              <Text style={{ fontSize: 14, marginLeft: 10 }}>
                학습률 {acc}% · 맞춤 {item.correctCount}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}
