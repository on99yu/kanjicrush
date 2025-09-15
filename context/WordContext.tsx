// context/WordContext.tsx
import React, { createContext, useEffect, useState, ReactNode } from "react";
import { getDBConnection } from "../db/sqlite";
import { KanjiTableRow } from "../types/word";

type WordContextType = {
  words: KanjiTableRow[];
  loading: boolean;
};

export const WordContext = createContext<WordContextType>({
  words: [],
  loading: true,
});

export const WordProvider = ({ children }: { children: ReactNode }) => {
  const [words, setWords] = useState<KanjiTableRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWords = async () => {
      try {
        const db = await getDBConnection();

        // KanjiWord 불러오기
        const wordRows: any[] = await db.getAllAsync(
          "SELECT * FROM KanjiWord"
        );

        // KanjiChar 불러오기
        const charRows: any[] = await db.getAllAsync(
          "SELECT * FROM KanjiChar"
        );

        // wordId 기준으로 kanjiList 합치기
        const combined: KanjiTableRow[] = wordRows.map((w) => ({
          id: w.id,
          word: w.word,
          reading: w.reading,
          meaning: w.meaning,
          createdAt: w.createdAt,
          kanjiList: charRows
            .filter((c) => c.wordId === w.id)
            .map((c) => ({
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
    };

    loadWords();
  }, []);

  return (
    <WordContext.Provider value={{ words, loading }}>
      {children}
    </WordContext.Provider>
  );
};
