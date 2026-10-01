export const randomValues = (count) =>
  Array.from({ length: count }, () => Math.floor(Math.random() * 99) + 1);

export const sortedSequence = (count, step = 10) =>
  Array.from({ length: count }, (_, index) => (index + 1) * step);

export const uniqueRandomValues = (count) => {
  const pool = Array.from({ length: 99 }, (_, index) => index + 1);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
};
