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

  // 이전 버전에서 모든 단어에 생성했던 빈 통계 행을 정리한다.
  await db.runAsync(`
    DELETE FROM WordStats
    WHERE correctCount = 0 AND wrongCount = 0 AND lastAnsweredAt IS NULL
  `);
};

export const initializeDatabase = async () => {
  const db = await getDBConnection();
  await createTable(db);
  return db;
};

export const syncWords = async (
  db: SQLite.SQLiteDatabase,
  words: KanjiTableRow[]
) => {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      CREATE TEMP TABLE IF NOT EXISTS SyncWordIds (
        id INTEGER PRIMARY KEY
      );
      DELETE FROM SyncWordIds;
      DELETE FROM KanjiChar;
    `);

    const upsertWord = await db.prepareAsync(
      `INSERT INTO KanjiWord (id, word, reading, meaning, createdAt)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           word = excluded.word,
           reading = excluded.reading,
           meaning = excluded.meaning,
           createdAt = excluded.createdAt`
    );
    const insertSyncWordId = await db.prepareAsync(
      "INSERT INTO SyncWordIds (id) VALUES (?)"
    );
    const insertKanji = await db.prepareAsync(
      `INSERT INTO KanjiChar (id, kanji, onyomi, kunyomi, position, wordId, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    try {
      for (const word of words) {
        await upsertWord.executeAsync([
          word.id,
          word.word,
          word.reading,
          word.meaning,
          word.createdAt,
        ]);

        await insertSyncWordId.executeAsync([word.id]);

        for (const kanji of word.kanjiList) {
          await insertKanji.executeAsync([
            kanji.id,
            kanji.kanji,
            kanji.onyomi,
            kanji.kunyomi,
            kanji.position,
            word.id,
            kanji.createdAt,
          ]);
        }
      }
    } finally {
      await upsertWord.finalizeAsync();
      await insertSyncWordId.finalizeAsync();
      await insertKanji.finalizeAsync();
    }

    await db.execAsync(`
      DELETE FROM KanjiWord
      WHERE id NOT IN (SELECT id FROM SyncWordIds);
    `);

    await db.runAsync(
      "INSERT INTO UpdateLog (updatedCount, lastUpdated) VALUES (?, ?)",
      [words.length, new Date().toISOString()]
    );
  });
};

export const deleteAllWords = async (db: SQLite.SQLiteDatabase) => {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM KanjiWord;
      DELETE FROM UpdateLog;
    `);
  });
};
