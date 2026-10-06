import * as SQLite from "expo-sqlite";
import { KanjiTableRow, PendingStudyAttempt, WordStatRow } from "../types/word";

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

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS PendingStudyAttempt (
      clientEventId TEXT PRIMARY KEY,
      wordId INTEGER NOT NULL,
      isCorrect INTEGER NOT NULL,
      answeredAt TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (wordId) REFERENCES KanjiWord(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS AppMeta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const progressVersion = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM AppMeta WHERE key = 'progressStorageVersion'"
  );
  if (progressVersion?.value !== "cloud-v1") {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        DELETE FROM PendingStudyAttempt;
        DELETE FROM WordStats;
      `);
      await db.runAsync(
        `INSERT INTO AppMeta (key, value) VALUES ('progressStorageVersion', 'cloud-v1')
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      );
    });
  }

  // 이전 버전에서 모든 단어에 생성했던 빈 통계 행을 정리한다.
  await db.runAsync(`
    DELETE FROM WordStats
    WHERE correctCount = 0 AND wrongCount = 0 AND lastAnsweredAt IS NULL
  `);
};

export const prepareProgressForUser = async (userId: number) => {
  const db = await getDBConnection();
  const activeUser = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM AppMeta WHERE key = 'activeProgressUserId'"
  );

  if (activeUser?.value === String(userId)) return;

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM PendingStudyAttempt;
      DELETE FROM WordStats;
    `);
    await db.runAsync(
      `INSERT INTO AppMeta (key, value) VALUES ('activeProgressUserId', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [String(userId)]
    );
  });
};

export const recordStudyAttempt = async (
  attempt: PendingStudyAttempt
): Promise<WordStatRow> => {
  const db = await getDBConnection();
  const answeredAt = new Date(attempt.answeredAt).getTime();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO PendingStudyAttempt (clientEventId, wordId, isCorrect, answeredAt)
       VALUES (?, ?, ?, ?)`,
      [attempt.clientEventId, attempt.wordId, attempt.isCorrect ? 1 : 0, attempt.answeredAt]
    );

    await db.runAsync(
      `INSERT INTO WordStats (wordId, correctCount, wrongCount, lastAnsweredAt)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(wordId) DO UPDATE SET
         correctCount = WordStats.correctCount + excluded.correctCount,
         wrongCount = WordStats.wrongCount + excluded.wrongCount,
         lastAnsweredAt = excluded.lastAnsweredAt,
         updatedAt = datetime('now')`,
      [attempt.wordId, attempt.isCorrect ? 1 : 0, attempt.isCorrect ? 0 : 1, answeredAt]
    );
  });

  const updated = await db.getFirstAsync<WordStatRow>(
    "SELECT * FROM WordStats WHERE wordId = ?",
    [attempt.wordId]
  );
  if (!updated) throw new Error("학습 기록을 저장하지 못했습니다.");
  return { ...updated, lastResult: attempt.isCorrect };
};

export const getPendingStudyAttempts = async (): Promise<PendingStudyAttempt[]> => {
  const db = await getDBConnection();
  const rows = await db.getAllAsync<{
    clientEventId: string;
    wordId: number;
    isCorrect: number;
    answeredAt: string;
  }>("SELECT clientEventId, wordId, isCorrect, answeredAt FROM PendingStudyAttempt ORDER BY createdAt ASC");

  return rows.map((row) => ({
    ...row,
    isCorrect: row.isCorrect === 1,
  }));
};

export const replaceProgress = async (progress: WordStatRow[]) => {
  const db = await getDBConnection();
  await db.withTransactionAsync(async () => {
    await db.execAsync("DELETE FROM WordStats;");
    const statement = await db.prepareAsync(
      `INSERT INTO WordStats (wordId, correctCount, wrongCount, lastAnsweredAt, updatedAt)
       VALUES (?, ?, ?, ?, datetime('now'))`
    );
    try {
      for (const item of progress) {
        await statement.executeAsync([
          item.wordId,
          item.correctCount,
          item.wrongCount,
          item.lastAnsweredAt,
        ]);
      }
    } finally {
      await statement.finalizeAsync();
    }
  });
};

export const removePendingStudyAttempts = async (clientEventIds: string[]) => {
  if (clientEventIds.length === 0) return;
  const db = await getDBConnection();
  const placeholders = clientEventIds.map(() => "?").join(",");
  await db.runAsync(
    `DELETE FROM PendingStudyAttempt WHERE clientEventId IN (${placeholders})`,
    clientEventIds
  );
};

export const clearAllProgress = async () => {
  const db = await getDBConnection();
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM PendingStudyAttempt;
      DELETE FROM WordStats;
    `);
  });
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
