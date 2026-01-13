import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { fetchKanjiData } from "../api/kanjiApi";
import { useState, useEffect, } from "react";
import { getDBConnection, insertWordWithKanji } from "../db/sqlite";
import { UpdateLogRow } from "../types/word";
import { WordManagerProps } from "../types/screen";

export default function WordManagerScreen({ navigation }: WordManagerProps) {
  const [loading, setLoading] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const loadLastUpdate = async () => {
      try {
        const db = await getDBConnection();
        const rows: UpdateLogRow[] = await db.getAllAsync(
          "SELECT * FROM UpdateLog ORDER BY id DESC LIMIT 1"
        );

        if (rows.length > 0) {
          setUpdateCount(rows[0].updatedCount);
          setLastUpdated(new Date(rows[0].lastUpdated).toLocaleString());
        }
      } catch (error) {
        console.error("마지막 업데이트 불러오기 실패:", error);
      }
    };

    loadLastUpdate();
  }, []);

  const handleUpdateWords = async () => {
    setLoading(true);
    try {
      const data = await fetchKanjiData();
      const db = await getDBConnection();

      await db.runAsync(
        `INSERT INTO UpdateLog (updatedCount, lastUpdated) VALUES (?, ?)`,
        [data.length, new Date().toISOString()]
      );

      const rows: UpdateLogRow[] = await db.getAllAsync(
        "SELECT * FROM UpdateLog ORDER BY id DESC LIMIT 1"
      );

      if (rows.length > 0) {
        setUpdateCount(rows[0].updatedCount);
        setLastUpdated(new Date(rows[0].lastUpdated).toLocaleString());
      }

      for (const word of data) {
        await insertWordWithKanji(db, word);
      }

      Alert.alert(
        "업데이트 완료",
        `${data.length}개의 단어가 성공적으로 업데이트되었습니다.`,
        [{ text: "확인" }]
      );
    } catch (error) {
      Alert.alert("업데이트 실패", "단어 업데이트 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllWords = () => {
    Alert.alert(
      "전체 단어 삭제",
      "정말 모든 단어를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await getDBConnection();

              await db.runAsync("DELETE FROM Words");

              setUpdateCount(0);
              setLastUpdated(null);

              Alert.alert("삭제 완료", "모든 단어가 삭제되었습니다.", [{ text: "확인" }]);
            } catch (error) {
              console.error("전체 단어 삭제 실패:", error);
              Alert.alert("삭제 실패", "단어 삭제 중 오류가 발생했습니다.");
            }
          },
        },
      ]
    );
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>단어장 관리</Text>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("WholeWordList")}
          disabled={loading}
        >
          <Text style={styles.primaryBtnText}>전체 단어 보기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("WholeWordStat")}
          disabled={loading}
        >
          <Text style={styles.primaryBtnText}>전체 단어 스탯 보기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {updateCount > 0 ? (
          <>
            <Text style={styles.cardText}>전체 단어 갯수 : {updateCount}</Text>
            <Text style={styles.cardSubText}>최신 업데이트 시각 : {lastUpdated}</Text>
          </>
        ) : (
          <Text style={styles.cardSubText}>아직 업데이트 기록이 없습니다.</Text>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.accentBtn, loading && styles.btnDisabled]}
          onPress={handleUpdateWords}
          disabled={loading}
        >
          <Text style={[styles.accentBtnText, loading && styles.textDisabled]}>
            {loading ? "업데이트 중..." : "단어 업데이트"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dangerBtn, loading && styles.btnDisabled]}
          onPress={handleDeleteAllWords}
          disabled={loading}
        >
          <Text style={styles.dangerBtnText}>전체 단어 삭제</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ghostBtn}
          onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
          disabled={loading}
        >
          <Text style={styles.ghostBtnText}>홈으로</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const SOFT_PURPLE = "#6366f1";
const BG = "#fff";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    backgroundColor: BG,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },

  section: {
    width: "80%",
    maxWidth: 420,
    gap: 24,
    marginBottom: 14,
  },

  card: {
    width: "80%",
    maxWidth: 420,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    marginBottom: 14,
  },
  cardText: { fontSize: 16, fontWeight: "600" },
  cardSubText: { marginTop: 6, color: "#475569" },

  // 공통 버튼 느낌 (높이/정렬 통일)
  btnBase: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  primaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: SOFT_PURPLE,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  accentBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: SOFT_PURPLE,
    alignItems: "center",
  },
  accentBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  dangerBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  dangerBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  ghostBtn: {
    width: "100%",
    // marginTop: '0%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(74,144,226,0.12)", // 은은한 블루
    alignItems: "center",
  },
  ghostBtnText: { color: SOFT_PURPLE, fontSize: 16, fontWeight: "700" },

  btnDisabled: { opacity: 0.6 },
  textDisabled: { color: "#0f172a" },
});
