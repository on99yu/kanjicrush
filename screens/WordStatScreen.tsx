import React, { useContext, useMemo } from "react";
import { View, Text } from "react-native";
import { WordManagerProps } from "../types/screen";
import { WordStatContext } from "../context/WordStatContext";
import { WordStatRow } from "../types/word";
import { getAccuracy } from "../utils/CalAccuracy";
export default function WordStatScreen({ navigation }: WordManagerProps) {
  const { statsMap, loading } = useContext(WordStatContext);

  // statsMap (Record)을 배열로 바꾸고 최근 답변한 순으로 정렬 후 5개만
  const top5 = useMemo(() => {
    const list = Object.values(statsMap);

    list.sort((a, b) => {
      const aTime = a.lastAnsweredAt ?? 0;
      const bTime = b.lastAnsweredAt ?? 0;
      return bTime - aTime; // 최신이 위로
    });

    return list.slice(0, 5);
  }, [statsMap]);

  if (loading) {
    return (
      <View>
        <Text>로딩중...</Text>
      </View>
    );
  }
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>단어 스탯 5개</Text>

      {top5.length === 0 ? (
        <Text>아직 스탯 데이터가 없어.</Text>
      ) : (
        top5.map((s) => (
          <View
            key={s.wordId}
            style={{
              padding: 12,
              borderWidth: 1,
              borderRadius: 10,
            }}
          >
            <Text>wordId: {s.wordId}</Text>
            <Text>정답: {s.correctCount}</Text>
            <Text>오답: {s.wrongCount}</Text>
            <Text>학습률: {getAccuracy(s)}%</Text>
            <Text>
              마지막 답변:{" "}
              {s.lastAnsweredAt ? new Date(s.lastAnsweredAt).toLocaleString() : "-"}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}