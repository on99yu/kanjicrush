// context/WordContext.tsx
import React, { createContext, useCallback, useEffect, useState, ReactNode } from "react";
import { getDBConnection } from "../db/sqlite";
import { KanjiTableRow, SQLiteKanjiCharRow, SQLiteKanjiWordRow } from "../types/word";

type WordContextType = {
  words: KanjiTableRow[];
  loading: boolean;
  refreshWords: () => Promise<void>;
};

export const WordContext = createContext<WordContextType>({
  words: [],
  loading: true,
  refreshWords: async () => {},
});

export const WordProvider = ({ children }: { children: ReactNode }) => {
  const [words, setWords] = useState<KanjiTableRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshWords = useCallback(async () => {
      setLoading(true);
      try {
        const db = await getDBConnection();

        // KanjiWord 불러오기
        const wordRows = await db.getAllAsync<SQLiteKanjiWordRow>(
          "SELECT * FROM KanjiWord ORDER BY id ASC"
        );

        // KanjiChar 불러오기
        const charRows = await db.getAllAsync<SQLiteKanjiCharRow>(
          "SELECT * FROM KanjiChar ORDER BY wordId ASC, position ASC, id ASC"
        );

        // wordId 기준으로 kanjiList 합치기
        const charsByWordId = new Map<number, SQLiteKanjiCharRow[]>();
        for (const char of charRows) {
          const chars = charsByWordId.get(char.wordId) ?? [];
          chars.push(char);
          charsByWordId.set(char.wordId, chars);
        }

        const combined: KanjiTableRow[] = wordRows.map((w) => ({
          id: w.id,
          word: w.word,
          reading: w.reading,
          meaning: w.meaning,
          createdAt: w.createdAt,
          kanjiList: (charsByWordId.get(w.id) ?? []).map((c) => ({
              id: c.id,
              kanji: c.kanji,
              onyomi: c.onyomi,
              kunyomi: c.kunyomi,
              position: c.position,
              createdAt: c.createdAt,
          })),
        }));

        setWords(combined);
      } catch (error) {
        console.error("Kanji 데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    refreshWords();
  }, [refreshWords]);

  return (
    <WordContext.Provider value={{ words, loading, refreshWords }}>
      {children}
    </WordContext.Provider>
  );
};
