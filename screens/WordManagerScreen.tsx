import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { fetchKanjiData } from "../api/kanjiApi";
import { useState, useEffect,} from "react";
import { getDBConnection, insertWordWithKanji } from "../db/sqlite";
import { UpdateLogRow } from "../types/word";
import { WordManagerProps} from "../types/screen";

export default function WordManagerScreen({navigation} : WordManagerProps) {
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
      <TouchableOpacity
        style={styles.screenButton}
        onPress={() => navigation.navigate("WholeWordList")}
        disabled={loading} >
        <Text style={styles.screenButtonText}>전체 단어 보기</Text>
      </TouchableOpacity>

      {updateCount > 0 && (
        <View style={styles.updateTextContainer}>
          <Text>전체 단어 갯수 : {updateCount} </Text>
          <Text>최신 업데이트 시각 : {lastUpdated}</Text>
        </View> )}
      <TouchableOpacity
        style={[styles.UpdateButton, loading && {backgroundColor: "#a5b4fc"}]}
        onPress={handleUpdateWords}
        disabled={loading}>
        <Text style={[styles.screenButtonText, loading && {color: "black"}]}>
          {loading ? "업데이트 중..." : "단어 업데이트"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.UpdateButton, { backgroundColor: "#f59e0b" }]}
        onPress={handleDeleteAllWords}
        disabled={loading}
      >
        <Text style={styles.screenButtonText}>전체 단어 삭제</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.screenButton}
        onPress={()=> navigation.navigate("MainTabs", {screen:"Home"})}>
          <Text style={styles.screenButtonText}>홈으로</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title:{
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  naviButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#4f46e5", // iOS 기본 파란색
    borderRadius: 6,
  },
  naviButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  screenButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    marginBottom: 24,
  },
  screenButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  updateTextContainer:{
    marginBottom: 20,
  },
  UpdateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#c43030ff",
    borderRadius: 8,
    marginBottom: 24,
  },
});
