import axios from "axios";
import { KanjiTableRow } from "../types/word";
import { API_BASE_URL } from "./config";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseKanjiData = (value: unknown): KanjiTableRow[] => {
  if (!Array.isArray(value)) {
    throw new Error("서버에서 유효한 단어 목록을 받지 못했습니다.");
  }

  const wordIds = new Set<number>();
  const charIds = new Set<number>();

  return value.map((word, wordIndex) => {
    if (
      !isRecord(word) ||
      !Number.isSafeInteger(word.id) ||
      (word.id as number) <= 0 ||
      typeof word.word !== "string" ||
      typeof word.reading !== "string" ||
      typeof word.meaning !== "string" ||
      typeof word.createdAt !== "string" ||
      !Array.isArray(word.kanjiList)
    ) {
      throw new Error(`${wordIndex + 1}번째 단어 데이터 형식이 올바르지 않습니다.`);
    }

    const wordId = word.id as number;
    if (wordIds.has(wordId)) {
      throw new Error(`중복된 단어 ID가 있습니다: ${wordId}`);
    }
    wordIds.add(wordId);

    const kanjiList = word.kanjiList.map((char, charIndex) => {
      if (
        !isRecord(char) ||
        !Number.isSafeInteger(char.id) ||
        (char.id as number) <= 0 ||
        typeof char.kanji !== "string" ||
        typeof char.onyomi !== "string" ||
        (char.kunyomi !== null && typeof char.kunyomi !== "string") ||
        !Number.isSafeInteger(char.position) ||
        typeof char.createdAt !== "string"
      ) {
        throw new Error(
          `${wordIndex + 1}번째 단어의 ${charIndex + 1}번째 한자 형식이 올바르지 않습니다.`
        );
      }

      const charId = char.id as number;
      if (charIds.has(charId)) {
        throw new Error(`중복된 한자 ID가 있습니다: ${charId}`);
      }
      charIds.add(charId);

      return {
        id: charId,
        kanji: char.kanji,
        onyomi: char.onyomi,
        kunyomi: char.kunyomi ?? "",
        position: char.position as number,
        createdAt: char.createdAt,
      };
    });

    return {
      id: wordId,
      word: word.word,
      reading: word.reading,
      meaning: word.meaning,
      createdAt: word.createdAt,
      kanjiList,
    };
  });
};

export const fetchKanjiData = async (): Promise<KanjiTableRow[]> => {
  try {
    const res = await axios.get<unknown>(`${API_BASE_URL}/api/kanji`, {
      timeout: 30_000,
    });

    return parseKanjiData(res.data);
  } catch (error) {
    console.error("Error fetching kanji data:", error);
    throw error;
  }
};
