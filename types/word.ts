
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