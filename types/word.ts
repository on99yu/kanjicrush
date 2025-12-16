
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
  wordId: string;
  correctCount : number;
  wrongCount : number;
  lastansweredAt : number;
}

export interface StudyProgressRow {
  id: number;
  wordId: number;
  accuracy: number;      // 학습률 (0~100)
  correctCount: number;
  wrongCount: number;
  updatedAt: string;
}