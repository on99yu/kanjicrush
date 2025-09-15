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
};

export const insertWordWithKanji = async (db:SQLite.SQLiteDatabase, word : KanjiTableRow) => {
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