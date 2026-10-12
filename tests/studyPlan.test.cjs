const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
};
const { buildDailyStudyPlan, reviewIntervalDays, studyDayKey } = require('../utils/buildDailyStudyPlan.ts');
const { isKnownWord } = require('../utils/isKnownWord.ts');
const now = new Date(2026, 9, 10, 12);
const words = Array.from({ length: 100 }, (_, index) => ({ id: index + 1, word: '単語', reading: '', meaning: '', kanjiList: [] }));
const stat = (id, daysAgo = 0, correct = 1, wrong = 0, lastResult = true) => ({
  id, wordId: id, correctCount: correct, wrongCount: wrong, lastResult,
  lastAnsweredAt: new Date(2026, 9, 10 - daysAgo, 12).getTime(),
});
const map = (rows) => Object.fromEntries(rows.map((row) => [row.wordId, row]));

test('첫날 새 단어는 10개이며 50개를 억지로 채우지 않는다', () => {
  const plan = buildDailyStudyPlan(words, {}, now);
  assert.equal(plan.newCount, 10);
  assert.equal(plan.words.length, 10);
});
test('재시작해도 당일 새 단어 상한과 중복 제외를 유지한다', () => {
  const stats = map(words.slice(0, 6).map((word) => stat(word.id)));
  const plan = buildDailyStudyPlan(words, stats, now);
  assert.equal(plan.newCount, 4);
  assert.equal(plan.completedToday, 6);
  assert.ok(plan.words.every((word) => !stats[word.id]));
});
test('오늘 모른다고 한 단어는 다음 날에만 복습한다', () => {
  const stats = { 1: stat(1, 0, 0, 1, false) };
  assert.equal(buildDailyStudyPlan(words.slice(0, 1), stats, now).words.length, 0);
  assert.equal(buildDailyStudyPlan(words.slice(0, 1), stats, new Date(2026, 9, 11, 0, 1)).words.length, 1);
});
test('맞힌 횟수에 따라 1·3·7·14일 간격을 적용한다', () => {
  assert.deepEqual([1, 2, 3, 5].map((count) => reviewIntervalDays(stat(1, 0, count))), [1, 3, 7, 14]);
  assert.equal(buildDailyStudyPlan(words.slice(0, 1), { 1: stat(1, 13, 5) }, now).words.length, 0);
  assert.equal(buildDailyStudyPlan(words.slice(0, 1), { 1: stat(1, 14, 5) }, now).words.length, 1);
});
test('최근 모른다는 응답은 숙달 상태와 복습 간격을 되돌린다', () => {
  const forgotten = stat(1, 1, 10, 1, false);
  assert.equal(isKnownWord(forgotten), false);
  assert.equal(reviewIntervalDays(forgotten), 1);
});
test('복습이 밀리면 복습을 우선하고 하루 총 50개를 넘지 않는다', () => {
  const stats = map(words.slice(0, 60).map((word) => stat(word.id, word.id === 60 ? 20 : 1)));
  const plan = buildDailyStudyPlan(words, stats, now);
  assert.equal(plan.words.length, 50);
  assert.equal(plan.newCount, 0);
  assert.equal(plan.words[0].id, 60);
});
test('당일 50개 완료 시 더 내지 않고 삭제된 단어 기록은 제외한다', () => {
  const stats = map(words.slice(0, 50).map((word) => stat(word.id, 0, 2)));
  assert.equal(buildDailyStudyPlan(words, stats, now).words.length, 0);
  assert.equal(buildDailyStudyPlan([], stats, now).completedToday, 0);
});
test('새 단어를 10개 완료하면 남은 미학습 단어로 목표를 늘리지 않는다', () => {
  const stats = map(words.slice(0, 10).map((word) => stat(word.id)));
  assert.equal(buildDailyStudyPlan(words, stats, now).remainingToday, 0);
});
test('24시간이 아닌 현지 달력 날짜로 복습을 판정한다', () => {
  const yesterday = { ...stat(1), lastAnsweredAt: new Date(2026, 9, 9, 23, 59).getTime() };
  assert.equal(buildDailyStudyPlan(words.slice(0, 1), { 1: yesterday }, new Date(2026, 9, 10, 0, 1)).words.length, 1);
  assert.notEqual(studyDayKey(new Date(yesterday.lastAnsweredAt)), studyDayKey(now));
});
