
export interface UpdateLogRow {
    updatedCount: number;
    lastUpdated: string;
}

export interface KanjiChar {
  id: number;
  kanji: string;
  onyomi: string;
  kunyomi: string;
  position: number;
  createdAt: string;
}

export interface KanjiTableRow {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  createdAt: string;
  kanjiList: KanjiChar[];
}

export interface WordStatRow{
  id: number;
  wordId: number;
  correctCount: number;
  wrongCount: number;
  lastAnsweredAt: number | null;
  createdAt: string;
  updatedAt: string;
}

// export const getAccuracy = (stats?: WordStatRow) =>{
//   const c = stats?.correctCount ?? 0;
//   const w = stats?.wrongCount ?? 0;
//   const total = c + w
//   return total === 0 ? 0 : Math.round((c/total)*100)
// }