import {
  PROGRESS_KEY,
  DEFAULT_PROGRESS,
  loadProgress,
  saveProgress,
  recordOperation,
  recordLesson,
  recordPrediction,
  isLessonComplete,
  touchStreak,
  todayKey,
  XP,
} from './progress';

describe('progress store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('loadProgress returns defaults on empty or corrupt storage', () => {
    expect(loadProgress()).toEqual(DEFAULT_PROGRESS());

    localStorage.setItem(PROGRESS_KEY, '{not json');
    expect(loadProgress()).toEqual(DEFAULT_PROGRESS());
  });

  test('save and load roundtrip', () => {
    const progress = { ...DEFAULT_PROGRESS(), xp: 75 };
    saveProgress(progress);

    expect(loadProgress().xp).toBe(75);
  });

  test('recordOperation awards xp and increments mastery per key', () => {
    recordOperation('array:push');
    recordOperation('array:push');
    recordOperation('tree:insert');

    const stored = loadProgress();
    expect(stored.xp).toBe(XP.OPERATION * 3);
    expect(stored.operations['array:push'].count).toBe(2);
    expect(stored.operations['tree:insert'].count).toBe(1);
    expect(stored.streak.lastDay).toBe(todayKey());
  });

  test('recordLesson grants xp once and marks the slug complete', () => {
    expect(isLessonComplete('array')).toBe(false);

    recordLesson('array');
    expect(isLessonComplete('array')).toBe(true);
    expect(loadProgress().xp).toBe(XP.LESSON);

    recordLesson('array');
    expect(loadProgress().xp).toBe(XP.LESSON);
    expect(loadProgress().lessons.array).toBe(true);
  });

  test('recordPrediction tallies attempts and awards xp for correct answers', () => {
    recordPrediction(true);
    recordPrediction(false);

    const stored = loadProgress();
    expect(stored.predictions).toEqual({ correct: 1, total: 2 });
    expect(stored.xp).toBe(XP.CORRECT_PREDICTION);
  });

  test('touchStreak starts at 1, continues across consecutive days and resets after a gap', () => {
    let progress = touchStreak(DEFAULT_PROGRESS(), '2026-10-01');
    expect(progress.streak).toEqual({ count: 1, lastDay: '2026-10-01' });

    progress = touchStreak(progress, '2026-10-01');
    expect(progress.streak.count).toBe(1);

    progress = touchStreak(progress, '2026-10-02');
    expect(progress.streak).toEqual({ count: 2, lastDay: '2026-10-02' });

    progress = touchStreak(progress, '2026-10-05');
    expect(progress.streak).toEqual({ count: 1, lastDay: '2026-10-05' });
  });

  test('todayKey formats a local YYYY-MM-DD date', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
