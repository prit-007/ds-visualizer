// Shared value parsing for the string/float expansion: value inputs accept
// integers, floats and arbitrary strings; position inputs stay integers.
// `compareValues` orders numbers numerically and everything else
// lexicographically so sorted guards and step comparisons stay honest.

export const parseDataValue = (input) => {
  const trimmed = String(input ?? '').trim();
  if (trimmed === '') return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return parseFloat(trimmed);
  return trimmed;
};

export const compareValues = (a, b) => {
  if (typeof a === 'number' && typeof b === 'number') {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
  return String(a).localeCompare(String(b));
};
