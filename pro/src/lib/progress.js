export const PROGRESS_KEY = 'ds-visualizer:progress';

export const XP = {
  OPERATION: 10,
  LESSON: 25,
  CORRECT_PREDICTION: 5,
};

export const DEFAULT_PROGRESS = () => ({
  version: 1,
  xp: 0,
  streak: { count: 0, lastDay: null },
  operations: {},
  lessons: {},
  predictions: { correct: 0, total: 0 },
});

export const todayKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

const dayDiff = (from, to) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

export const loadProgress = () => {
  const base = DEFAULT_PROGRESS();
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return base;
    return {
      ...base,
      ...parsed,
      streak: { ...base.streak, ...(parsed.streak || {}) },
      operations:
        parsed.operations && typeof parsed.operations === 'object' ? parsed.operations : {},
      lessons: parsed.lessons && typeof parsed.lessons === 'object' ? parsed.lessons : {},
      predictions: { ...base.predictions, ...(parsed.predictions || {}) },
    };
  } catch {
    return base;
  }
};

export const saveProgress = (progress) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
};

export const touchStreak = (progress, dayKey = todayKey()) => {
  const streak = progress.streak || { count: 0, lastDay: null };
  if (streak.lastDay === dayKey) return progress;
  const gap = streak.lastDay ? dayDiff(streak.lastDay, dayKey) : null;
  const count = gap === 1 ? streak.count + 1 : 1;
  return { ...progress, streak: { count, lastDay: dayKey } };
};

export const recordOperation = (key) => {
  const progress = touchStreak(loadProgress());
  const entry = progress.operations[key] || { count: 0, lastAt: null };
  entry.count += 1;
  entry.lastAt = new Date().toISOString();
  progress.operations[key] = entry;
  progress.xp += XP.OPERATION;
  saveProgress(progress);
  return progress;
};

export const isLessonComplete = (slug) => Boolean(loadProgress().lessons[slug]);

export const recordLesson = (slug) => {
  const progress = loadProgress();
  if (progress.lessons[slug]) return progress;
  const touched = touchStreak(progress);
  touched.lessons[slug] = true;
  touched.xp += XP.LESSON;
  saveProgress(touched);
  return touched;
};

export const recordPrediction = (correct) => {
  const progress = touchStreak(loadProgress());
  progress.predictions.total += 1;
  if (correct) {
    progress.predictions.correct += 1;
    progress.xp += XP.CORRECT_PREDICTION;
  }
  saveProgress(progress);
  return progress;
};
