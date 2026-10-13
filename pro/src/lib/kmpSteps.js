// Pure step builders for string matching: naive scan and Knuth–Morris–Pratt
// (failure table + reuse of prefix matches). All mutations happen at build
// time; steps carry absolute-state actions that drive the page canvas.

export const buildKmpTableSteps = (pattern, ui) => {
  const m = pattern.length;
  const pi = new Array(m).fill(0);
  const steps = [];

  steps.push({
    description: `Building failure (π) table for pattern "${pattern}"`,
    kind: 'move',
    line: 1,
    vars: { pattern },
    action: () => {
      ui.setActiveIndex?.(null);
      ui.setHighlight?.([0, 0]);
    },
  });

  let j = 0;
  for (let i = 1; i < m; i += 1) {
    while (j > 0 && pattern[i] !== pattern[j]) {
      steps.push({
        description: `"${pattern[i]}" ≠ "${pattern[j]}" — bounce back along π to ${pi[j - 1]}`,
        kind: 'compare',
        line: 5,
        vars: { i, j, next: pi[j - 1] },
        action: () => {
          ui.setActiveIndex?.(i);
        },
      });
      j = pi[j - 1];
    }
    if (pattern[i] === pattern[j]) j += 1;
    pi[i] = j;
    steps.push({
      description: `π[${i}]: longest proper prefix == suffix of "${pattern.slice(0, i + 1)}" is ${j}`,
      kind: 'move',
      line: 6,
      vars: { i, pi: j },
      action: () => {
        ui.setActiveIndex?.(i);
      },
    });
  }

  steps.push({
    description: `Failure table complete: [${pi.join(', ')}]`,
    kind: 'found',
    line: 7,
    vars: { pi },
    action: () => {
      ui.setActiveIndex?.(null);
    },
  });

  return steps;
};

export const buildKmpSearchSteps = (text, pattern, ui) => {
  const n = text.length;
  const m = pattern.length;
  const pi = new Array(m).fill(0);
  const matches = [];
  const steps = [];

  steps.push({
    description: `KMP search for "${pattern}" in text "${text}"`,
    kind: 'move',
    line: 1,
    vars: { n, m },
    action: () => {
      ui.setFound?.(null);
      ui.setHighlight?.([0, 0]);
    },
  });

  let j = 0;
  let k = 0;
  for (let i = 1; i < m; i += 1) {
    while (k > 0 && pattern[i] !== pattern[k]) k = pi[k - 1];
    if (pattern[i] === pattern[k]) k += 1;
    pi[i] = k;
  }

  steps.push({
    description: `Failure table ready: [${pi.join(', ')}]`,
    kind: 'compare',
    line: 2,
    vars: { pi },
    action: () => {
      ui.setHighlight?.([0, 0]);
    },
  });

  j = 0;
  const mismatchNarration = (i, tc, pc, usePi) =>
    usePi
      ? `Mismatch (${tc} vs ${pc}) — shift pattern right using π[${j - 1}] = ${pi[j - 1]}`
      : `Mismatch (${tc} vs ${pc}) — no overlap with prefix, slide and retry`;

  for (let i = 0; i < n; i += 1) {
    while (j > 0 && text[i] !== pattern[j]) {
      const piJump = pi[j - 1];
      const atJump = i - j;
      steps.push({
        description: mismatchNarration(i, text[i], pattern[j], true),
        kind: 'compare',
        line: 5,
        vars: { i, j, piJump },
        action: () => {
          ui.setHighlight?.([atJump, i]);
          ui.setFound?.(null);
        },
      });
      j = piJump;
    }
    if (text[i] === pattern[j]) {
      j += 1;
      const matchStart = i - j + 1;
      steps.push({
        description: `Matched text[${i}] = ${text[i]} with pattern[${j - 1}] = ${pattern[j - 1]}`,
        kind: 'move',
        line: 6,
        vars: { i, j },
        action: () => {
          ui.setHighlight?.([matchStart, i]);
        },
      });
    } else if (j === 0) {
      steps.push({
        description: mismatchNarration(i, text[i], pattern[j], false),
        kind: 'compare',
        line: 5,
        vars: { i, j },
        action: () => {
          ui.setHighlight?.([i, i]);
        },
      });
    }
    if (j === m) {
      const at = i - m + 1;
      matches.push(at);
      steps.push({
        description: `Pattern "${pattern}" fully matched at index ${at}`,
        kind: 'found',
        line: 7,
        vars: { at },
        action: () => {
          ui.setFound?.(at);
          ui.setHighlight?.([at, i]);
        },
      });
      j = pi[m - 1];
    }
  }

  steps.push({
    description:
      matches.length > 0
        ? `Occurrences of "${pattern}": ${matches.join(', ')}`
        : `No occurrences of "${pattern}" found`,
    kind: matches.length > 0 ? 'found' : 'error',
    line: 8,
    vars: { matches },
    action: () => {
      ui.setFound?.(matches.length > 0 ? matches[0] : null);
    },
  });

  return steps;
};

export const buildNaiveSearchSteps = (text, pattern, ui) => {
  const n = text.length;
  const m = pattern.length;
  const matches = [];
  const steps = [];

  steps.push({
    description: `Naive search for "${pattern}" in text "${text}"`,
    kind: 'move',
    line: 1,
    vars: { n, m },
    action: () => {
      ui.setFound?.(null);
      ui.setHighlight?.([0, 0]);
    },
  });

  for (let shift = 0; shift <= n - m; shift += 1) {
    let matched = true;
    for (let j = 0; j < m; j += 1) {
      if (text[shift + j] !== pattern[j]) {
        const a = shift + j;
        steps.push({
          description: `Mismatch at alignment ${shift} (text[${a}] = ${text[a]} vs pattern[${j}] = ${pattern[j]}) — shift by 1`,
          kind: 'compare',
          line: 4,
          vars: { shift, j, a },
          action: () => {
            ui.setHighlight?.([shift, a]);
          },
        });
        matched = false;
        break;
      }
      steps.push({
        description: `Matched text[${shift + j}] = ${text[shift + j]} with pattern[${j}] = ${pattern[j]}`,
        kind: 'move',
        line: 3,
        vars: { shift, j },
        action: () => {
          ui.setHighlight?.([shift, shift + j]);
        },
      });
    }
    if (matched) {
      matches.push(shift);
      steps.push({
        description: `Pattern "${pattern}" fully matched at alignment ${shift}`,
        kind: 'found',
        line: 5,
        vars: { shift },
        action: () => {
          ui.setFound?.(shift);
        },
      });
    }
  }

  steps.push({
    description:
      matches.length > 0
        ? `Occurrences of "${pattern}": ${matches.join(', ')}`
        : `No occurrences of "${pattern}" found`,
    kind: matches.length > 0 ? 'found' : 'error',
    line: 6,
    vars: { matches },
    action: () => {
      ui.setFound?.(matches.length > 0 ? matches[0] : null);
    },
  });

  return steps;
};
