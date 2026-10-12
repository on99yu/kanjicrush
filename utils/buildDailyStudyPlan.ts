import { KanjiTableRow, WordStatRow } from "../types/word";
import { getAccuracy } from "./CalAccuracy";
import { isKnownWord } from "./isKnownWord";
import { shuffleArray } from "./shuffleArray";

export const DAILY_STUDY_TARGET = 50;
export const DAILY_NEW_WORD_TARGET = 10;
export const STUDY_BATCH_SIZE = 10;

export type DailyStudyPlan = {
  words: KanjiTableRow[];
  completedToday: number;
  remainingToday: number;
  newCount: number;
  reviewCount: number;
  knownCount: number;
};

export function studyDayKey(now = new Date()) {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export function countStudiedToday(statsMap: Record<number, WordStatRow>, now = new Date()) {
  return Object.values(statsMap).filter((stats) => stats.lastAnsweredAt !== null &&
    studyDayKey(new Date(stats.lastAnsweredAt)) === studyDayKey(now)).length;
}

export function reviewIntervalDays(stats: WordStatRow) {
  // 최근에 모른다고 평가하면 누적 정답 수와 관계없이 다음 날 다시 확인한다.
  if (stats.lastResult === false || stats.correctCount === 0) return 1;
  if (isKnownWord(stats)) return 14;
  if (stats.correctCount >= 3 && getAccuracy(stats) >= 70) return 7;
  if (stats.correctCount >= 2 && getAccuracy(stats) >= 60) return 3;
  return 1;
}

function calendarDayNumber(timestamp: number) {
  const date = new Date(timestamp);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
}

export function buildDailyStudyPlan(words: KanjiTableRow[], statsMap: Record<number, WordStatRow>, now = new Date()): DailyStudyPlan {
  const currentStats = Object.fromEntries(words.filter((word) => statsMap[word.id]).map((word) => [word.id, statsMap[word.id]]));
  const completedToday = countStudiedToday(currentStats, now);
  const capacity = Math.max(0, DAILY_STUDY_TARGET - completedToday);
  const newToday = Object.values(currentStats).filter((stats) =>
    stats.correctCount + stats.wrongCount === 1 && stats.lastAnsweredAt !== null &&
    studyDayKey(new Date(stats.lastAnsweredAt)) === studyDayKey(now)).length;
  const todayNumber = calendarDayNumber(now.getTime());
  const due = words.filter((word) => {
    const stats = currentStats[word.id];
    if (!stats) return false;
    if (stats.lastAnsweredAt === null) return true;
    return todayNumber - calendarDayNumber(stats.lastAnsweredAt) >= reviewIntervalDays(stats);
  }).sort((a, b) => {
    const left = currentStats[a.id];
    const right = currentStats[b.id];
    const overdue = (stats: WordStatRow) => todayNumber - calendarDayNumber(stats.lastAnsweredAt ?? 0) - reviewIntervalDays(stats);
    return overdue(right) - overdue(left) || getAccuracy(left) - getAccuracy(right);
  });
  // 복습 누적이 상한을 넘으면 새 단어를 추가하지 않는다.
  const reviews = due.slice(0, capacity);
  const newWords = shuffleArray(words.filter((word) => !currentStats[word.id]))
    .slice(0, Math.min(Math.max(0, DAILY_NEW_WORD_TARGET - newToday), capacity - reviews.length));
  const knownCount = reviews.filter((word) => isKnownWord(currentStats[word.id])).length;
  const selected = [...reviews, ...newWords];
  return {
    words: selected, completedToday, remainingToday: selected.length,
    newCount: newWords.length, reviewCount: reviews.length - knownCount, knownCount,
  };
}
