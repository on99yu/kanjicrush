import { KanjiTableRow, WordStatRow } from "../types/word";
import { getAccuracy } from "./CalAccuracy";
import { isKnownWord } from "./isKnownWord";
import { shuffleArray } from "./shuffleArray";

export const DAILY_STUDY_TARGET = 50;
export const DAILY_NEW_WORD_TARGET = 15;
const KNOWN_WORD_DAILY_LIMIT = 3;

export type DailyStudyPlan = {
  words: KanjiTableRow[];
  completedToday: number;
  remainingToday: number;
  newCount: number;
  reviewCount: number;
  knownCount: number;
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const countStudiedToday = (statsMap: Record<number, WordStatRow>) => {
  const today = startOfToday();
  return Object.values(statsMap).filter(
    (stats) => (stats.lastAnsweredAt ?? 0) >= today
  ).length;
};

const compareReviewPriority = (a: WordStatRow, b: WordStatRow) => {
  const accuracyDifference = getAccuracy(a) - getAccuracy(b);
  if (accuracyDifference !== 0) return accuracyDifference;

  const wrongDifference = b.wrongCount - a.wrongCount;
  if (wrongDifference !== 0) return wrongDifference;

  return (a.lastAnsweredAt ?? 0) - (b.lastAnsweredAt ?? 0);
};

export function buildDailyStudyPlan(
  words: KanjiTableRow[],
  statsMap: Record<number, WordStatRow>
): DailyStudyPlan {
  const completedToday = countStudiedToday(statsMap);
  const remainingToday = Math.max(0, DAILY_STUDY_TARGET - completedToday);
  const today = startOfToday();

  if (remainingToday === 0) {
    return {
      words: [],
      completedToday,
      remainingToday,
      newCount: 0,
      reviewCount: 0,
      knownCount: 0,
    };
  }

  const availableWords = words.filter(
    (word) => (statsMap[word.id]?.lastAnsweredAt ?? 0) < today
  );
  const newWords = shuffleArray(
    availableWords.filter((word) => !statsMap[word.id])
  );
  const reviewWords = availableWords
    .filter((word) => statsMap[word.id] && !isKnownWord(statsMap[word.id]))
    .sort((a, b) =>
      compareReviewPriority(statsMap[a.id], statsMap[b.id])
    );
  const knownWords = shuffleArray(
    availableWords.filter((word) => isKnownWord(statsMap[word.id]))
  );

  const knownSelection = knownWords.slice(
    0,
    Math.min(KNOWN_WORD_DAILY_LIMIT, remainingToday)
  );
  let slots = remainingToday - knownSelection.length;

  const newSelection = newWords.slice(
    0,
    Math.min(DAILY_NEW_WORD_TARGET, slots)
  );
  slots -= newSelection.length;

  const reviewSelection = reviewWords.slice(0, slots);
  slots -= reviewSelection.length;

  // 학습 초기에는 복습할 단어가 없으므로 남은 목표를 새 단어로 채운다.
  const extraNewSelection = newWords.slice(
    newSelection.length,
    newSelection.length + slots
  );
  slots -= extraNewSelection.length;

  // 새 단어도 부족할 때만 아직 숙지하지 못한 복습 단어로 남은 칸을 채운다.
  const extraReviewSelection = reviewWords.slice(
    reviewSelection.length,
    reviewSelection.length + slots
  );

  const selectedNew = [...newSelection, ...extraNewSelection];
  const selectedReview = [...reviewSelection, ...extraReviewSelection];

  return {
    words: shuffleArray([
      ...selectedReview,
      ...selectedNew,
      ...knownSelection,
    ]),
    completedToday,
    remainingToday,
    newCount: selectedNew.length,
    reviewCount: selectedReview.length,
    knownCount: knownSelection.length,
  };
}
