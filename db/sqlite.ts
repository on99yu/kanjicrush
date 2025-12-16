import * as SQLite from "expo-sqlite";
import { KanjiTableRow } from "../types/word";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDBConnection = async () => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync("kanji.db");
  }
  return dbInstance;
};

export const createTable = async (db: SQLite.SQLiteDatabase) => {

  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS KanjiWord (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL UNIQUE,
      reading TEXT,
      meaning TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS KanjiChar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kanji TEXT NOT NULL,
      onyomi TEXT,
      kunyomi TEXT,
      position INTEGER,
      wordId INTEGER NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (wordId) REFERENCES KanjiWord(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS UpdateLog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        updatedCount INTEGER,
        lastUpdated TEXT
        );
    `)

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS WordStats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wordId INTEGER NOT NULL UNIQUE,
      correctCount INTEGER NOT NULL DEFAULT 0,
      wrongCount INTEGER NOT NULL DEFAULT 0,
      lastAnsweredAt INTEGER, -- ms timestamp (Date.now())
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (wordId) REFERENCES KanjiWord(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_wordstats_lastAnsweredAt
    ON WordStats(lastAnsweredAt);
  `);
};

export const insertWordWithKanji = async (db: SQLite.SQLiteDatabase, word: KanjiTableRow) => {
  // 1. KanjiWord 삽입
  const result = await db.runAsync(
    `INSERT OR REPLACE INTO KanjiWord (id, word, reading, meaning, createdAt) 
     VALUES (?, ?, ?, ?, ?)`,
    [word.id, word.word, word.reading, word.meaning, word.createdAt]
  );

  // 2. 기존 KanjiChar 삭제 후 다시 삽입
  await db.runAsync(`DELETE FROM KanjiChar WHERE wordId = ?`, [word.id]);

  for (const kanji of word.kanjiList) {
    await db.runAsync(
      `INSERT INTO KanjiChar (id, kanji, onyomi, kunyomi, position, wordId, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        kanji.id,
        kanji.kanji,
        kanji.onyomi,
        kanji.kunyomi,
        kanji.position,
        word.id,
        kanji.createdAt,
      ]
    );
  }

};

export const backfillWordStats = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  await db.execAsync(`
    INSERT OR IGNORE INTO WordStats (wordId, correctCount, wrongCount, lastAnsweredAt)
    SELECT kw.id, 0, 0, NULL
    FROM KanjiWord kw
    LEFT JOIN WordStats ws ON ws.wordId = kw.id
    WHERE ws.wordId IS NULL;
    `);
}