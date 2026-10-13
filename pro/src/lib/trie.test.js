import { Trie } from './trie';
import { buildInsertSteps, buildSearchSteps, buildDeleteSteps, buildListSteps } from './trieSteps';
import { buildTrieLayout } from './trieLayout';

describe('Trie core', () => {
  test('insert builds shared prefixes', () => {
    const t = new Trie();
    t.insert('cat');
    t.insert('car');
    t.insert('care');
    expect(t.contains('cat')).toBe(true);
    expect(t.contains('ca')).toBe(false);
    expect(t.hasPrefix('ca')).toBe(true);
    expect(t.contains('care')).toBe(true);
  });

  test('insert is idempotent on existing words', () => {
    const t = new Trie();
    t.insert('dog');
    t.insert('dog');
    expect(t.countWords()).toBe(1);
  });

  test('longest-prefix search and auto-complete suggestions', () => {
    const t = new Trie();
    ['dog', 'door', 'dorm', 'dot'].forEach((w) => t.insert(w));
    expect(t.wordsWithPrefix('do').sort()).toEqual(['dog', 'door', 'dorm', 'dot']);
    // 'door' branches d-o-o, so the 'dor' prefix only reaches 'dorm'
    expect(t.wordsWithPrefix('dor')).toEqual(['dorm']);
  });

  test('delete removes a word but keeps shared prefixes', () => {
    const t = new Trie();
    ['cat', 'car', 'care'].forEach((w) => t.insert(w));
    t.delete('car');
    expect(t.contains('car')).toBe(false);
    expect(t.contains('cat')).toBe(true);
    expect(t.contains('care')).toBe(true);
    expect(t.contains('ca')).toBe(false);
  });

  test('delete missing word reports false and never throws', () => {
    const t = new Trie();
    t.insert('hop');
    expect(t.delete('hat')).toBe(false);
    expect(t.contains('hop')).toBe(true);
  });
});

const makeUi = () => ({
  setActiveNode: vi.fn(),
  setHighlightedChars: vi.fn(),
  setNodeStates: vi.fn(),
});

describe('buildInsertSteps', () => {
  test('walks letters, creates new nodes, marks the word end', () => {
    const t = new Trie();
    t.insert('c');
    const ui = makeUi();
    const steps = buildInsertSteps(t, 'cat', ui);
    const d = steps.map((s) => s.description);

    expect(d[0]).toBe('Inserting "cat" into the trie');
    expect(d).toContain('Following existing child c');
    expect(d).toContain('Creating node for "a"');
    expect(d).toContain('Creating node for "t"');
    expect(d[d.length - 1]).toBe('"cat" is now a complete word');
    expect(t.contains('cat')).toBe(true);
  });
});

describe('buildSearchSteps', () => {
  test('follows matching children and reports the final word', () => {
    const t = new Trie();
    t.insert('cat');
    const ui = makeUi();
    const steps = buildSearchSteps(t, 'cat', ui);
    const d = steps.map((s) => s.description);

    expect(d[d.length - 1]).toBe('Found "cat"');
    expect(d).toContain('Comparing letter c');
  });
});

describe('buildDeleteSteps', () => {
  test('narrates descending then unlinking', () => {
    const t = new Trie();
    ['cat', 'car'].forEach((w) => t.insert(w));
    const ui = makeUi();
    const steps = buildDeleteSteps(t, 'cat', ui);
    const d = steps.map((s) => s.description);
    expect(d[0]).toBe('Deleting "cat"');
    expect(d.some((s) => s.includes('Pruning node "t"'))).toBe(true);
    expect(d[d.length - 1]).toContain('deleted');
    expect(t.contains('cat')).toBe(false);
  });
});

describe('buildListSteps', () => {
  test('collects words in alphabetical order', () => {
    const t = new Trie();
    ['rat', 'run', 'rust'].forEach((w) => t.insert(w));
    const steps = buildListSteps(t, makeUi());
    const last = steps[steps.length - 1];
    expect(last.description).toBe('Words in trie (alphabetical): rat, run, rust');
  });
});

describe('buildTrieLayout', () => {
  test('layers letters with parents centered over children', () => {
    const t = new Trie();
    ['cat', 'car'].forEach((w) => t.insert(w));
    const layout = buildTrieLayout(t.root);
    expect(layout.nodes.length).toBe(5); // root(1) + c(1) + a(1) + t/r(2)
    expect(layout.width).toBeGreaterThan(50);
    expect(layout.edges.length).toBe(4);
  });
});
