// Pure step builders for the two remaining string-matching algorithms:
// Rabin-Karp (rolling hash + verification) and the Z-algorithm (Z array
// over pattern + '$' + text). All hashes/Z values are computed at build
// time; steps carry absolute-state actions for the page canvas.

export const buildRabinKarpSteps = (text, pattern, ui) => {
  const n = text.length;
  const m = pattern.length;
  const BASE = 256;
  const MOD = 101;
  const mod = (x) => ((x % MOD) + MOD) % MOD;
  const hash = (s) => [...s].reduce((a, ch) => mod(a * BASE + ch.charCodeAt(0)), 0);
  const matches = [];
  const steps = [];

  const hp = hash(pattern);
  steps.push({
    description: `Rabin-Karp search for "${pattern}" in text "${text}"`,
    kind: 'move',
    line: 1,
    vars: { n, m },
    action: () => {
      ui.setFound?.(null);
      ui.setHighlight?.([0, 0]);
    },
  });
  steps.push({
    description: `pattern hash hp = ${hp} (base 256, mod ${MOD})`,
    kind: 'compare',
    line: 2,
    vars: { hp },
    action: () => {},
  });

  let hw = hash(text.slice(0, m));
  steps.push({
    description: `first window "${text.slice(0, m)}" hash = ${hw}`,
    kind: 'compare',
    line: 2,
    vars: { hw },
    action: () => {},
  });

  let high = 1;
  for (let i = 1; i < m; i += 1) high = mod(high * BASE);

  for (let shift = 0; shift <= n - m; shift += 1) {
    if (shift > 0) {
      const outCode = text.charCodeAt(shift - 1);
      const inCode = text.charCodeAt(shift + m - 1);
      hw = mod((hw - outCode * high) * BASE + inCode);
      steps.push({
        description: `roll: drop "${text[shift - 1]}" (${outCode}), add "${text[shift + m - 1]}" (${inCode}) → hash ${hw}`,
        kind: 'move',
        line: 4,
        vars: { shift, out: outCode, in: inCode, hw },
        action: () => {
          ui.setHighlight?.([shift, shift + m - 1]);
        },
      });
    }

    if (hw === hp) {
      steps.push({
        description: `hash hit at shift ${shift} (h = ${hw} = hp) — verifying characters`,
        kind: 'compare',
        line: 5,
        vars: { shift, hw, hp },
        action: () => {
          ui.setHighlight?.([shift, shift + m - 1]);
        },
      });
      let bad = -1;
      for (let j = 0; j < m; j += 1) {
        if (text[shift + j] !== pattern[j]) {
          bad = j;
          break;
        }
      }
      if (bad === -1) {
        matches.push(shift);
        steps.push({
          description: `verified match at ${shift}`,
          kind: 'found',
          line: 5,
          vars: { shift },
          action: () => {
            ui.setFound?.(shift);
            ui.setHighlight?.([shift, shift + m - 1]);
          },
        });
      } else {
        steps.push({
          description: `spurious collision at ${shift} — text[${shift + bad}] = "${text[shift + bad]}" ≠ "${pattern[bad]}" = pattern[${bad}]`,
          kind: 'compare',
          line: 5,
          vars: { shift, bad },
          action: () => {
            ui.setHighlight?.([shift + bad, shift + bad]);
          },
        });
      }
    } else {
      steps.push({
        description: `hash ${hw} ≠ hp (${hp}) — slide window`,
        kind: 'compare',
        line: 5,
        vars: { shift, hw, hp },
        action: () => {
          ui.setHighlight?.([shift, shift + m - 1]);
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

export const buildZSearchSteps = (text, pattern, ui) => {
  const m = pattern.length;
  const S = `${pattern}$${text}`;
  const len = S.length;
  const Z = new Array(len).fill(0);
  Z[0] = len;
  const matches = [];
  const steps = [];

  steps.push({
    description: `Z search for "${pattern}" in text "${text}"`,
    kind: 'move',
    line: 1,
    vars: { n: text.length, m },
    action: () => {
      ui.setFound?.(null);
      ui.setHighlight?.([0, 0]);
    },
  });
  steps.push({
    description: `S = "${S}" — Z[i] = longest match between S and S[i..]`,
    kind: 'compare',
    line: 2,
    vars: { S },
    action: () => {},
  });

  let l = 0;
  let r = 0;
  for (let i = 1; i < len; i += 1) {
    let seed = 0;
    if (i <= r) {
      seed = Math.min(r - i + 1, Z[i - l]);
      steps.push({
        description: `i = ${i} inside box [${l}..${r}] → seed Z[${i}] = ${seed}`,
        kind: 'compare',
        line: 5,
        vars: { i, l, r, seed },
        action: () => {},
      });
    }
    let z = seed;
    while (i + z < len && S[z] === S[i + z]) z += 1;
    Z[i] = z;

    const inText = i >= m + 1;
    if (z === 0) {
      steps.push({
        description: `Z[${i}] = 0 — "${S[i]}" ≠ "${S[0]}"`,
        kind: 'compare',
        line: 6,
        vars: { i, z },
        action: () => {
          if (inText) ui.setHighlight?.([i - m - 1, i - m - 1]);
        },
      });
    } else {
      steps.push({
        description: `Z[${i}] = ${z} — matched "${S.slice(0, z)}"`,
        kind: z >= m && inText ? 'found' : 'move',
        line: 6,
        vars: { i, z },
        action: () => {
          if (inText) ui.setHighlight?.([i - m - 1, i - m - 1 + Math.min(z, m) - 1]);
        },
      });
    }

    if (i + z - 1 > r) {
      l = i;
      r = i + z - 1;
      if (z > 0) {
        steps.push({
          description: `box ← [${l}..${r}]`,
          kind: 'move',
          line: 7,
          vars: { i, l, r },
          action: () => {},
        });
      }
    }

    if (inText && z >= m) {
      const k = i - m - 1;
      matches.push(k);
      steps.push({
        description: `Z ≥ ${m} → match at text index ${k}`,
        kind: 'found',
        line: 8,
        vars: { i, k, z },
        action: () => {
          ui.setFound?.(k);
          ui.setHighlight?.([k, k + m - 1]);
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
    line: 9,
    vars: { matches },
    action: () => {
      ui.setFound?.(matches.length > 0 ? matches[0] : null);
    },
  });

  return steps;
};
