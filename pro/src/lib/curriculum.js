export const CONCEPTS = [
  {
    id: 'array-basics',
    title: 'Array basics',
    structure: 'Array',
    href: '/lessons/array',
    deps: [],
    lesson: 'array',
    op: 'array:add',
    summary: 'Contiguous memory, index access, and why inserts shift.',
  },
  {
    id: 'array-ops',
    title: 'Array operations',
    structure: 'Array',
    href: '/array',
    deps: ['array-basics'],
    lesson: 'array',
    op: 'array:insert',
    summary: 'Push, insert-at and remove-at, step by step.',
  },
  {
    id: 'list-basics',
    title: 'Linked list basics',
    structure: 'Linked List',
    href: '/lessons/linked-list',
    deps: ['array-basics'],
    lesson: 'linked-list',
    op: 'linked-list:add',
    summary: 'Nodes and pointers — O(1) insert vs array shifts.',
  },
  {
    id: 'list-ops',
    title: 'Linked list operations',
    structure: 'Linked List',
    href: '/linked-list',
    deps: ['list-basics'],
    lesson: 'linked-list',
    op: 'linked-list:insert',
    summary: 'Pointer hops for add, insert-at and remove-at.',
  },
  {
    id: 'tree-basics',
    title: 'Tree basics',
    structure: 'Tree',
    href: '/lessons/tree',
    deps: ['list-basics'],
    lesson: 'tree',
    op: 'tree:insert',
    summary: 'Roots, children, height and balance vocabulary.',
  },
  {
    id: 'avl-rotations',
    title: 'AVL rotations',
    structure: 'Tree',
    href: '/tree',
    deps: ['tree-basics'],
    lesson: 'tree',
    op: 'tree:delete',
    summary: 'Balance factor, LL/RR/LR/RL rebalancing on insert/delete.',
  },
  {
    id: 'traversals',
    title: 'Traversals',
    structure: 'Tree',
    href: '/tree',
    deps: ['avl-rotations'],
    lesson: 'tree',
    op: 'tree:traversal-inOrder',
    summary: 'Pre/in/post-order plus level-order BFS.',
  },
  {
    id: 'prediction',
    title: 'Predict the next step',
    structure: 'Practice',
    href: '/tree',
    deps: ['traversals'],
    lesson: null,
    op: null,
    quiz: true,
    summary: 'Turn any run into a quiz and score XP for foresight.',
  },
  {
    id: 'stack-queue',
    title: 'Stack & queue',
    structure: 'Linear',
    href: '/stack-queue',
    deps: ['list-basics'],
    lesson: null,
    op: null,
    summary: 'LIFO/FIFO discipline — coming next.',
  },
  {
    id: 'hash-table',
    title: 'Hash tables',
    structure: 'Lookup',
    href: '/hash-table',
    deps: ['array-basics'],
    lesson: null,
    op: null,
    summary: 'Buckets, collisions, O(1) average lookup — coming next.',
  },
  {
    id: 'sorting',
    title: 'Sorting',
    structure: 'Algorithms',
    href: '/sorting',
    deps: ['array-basics'],
    lesson: null,
    op: null,
    summary: 'Compare swaps and O(n log n) — coming next.',
  },
  {
    id: 'graphs',
    title: 'Graphs',
    structure: 'Graph',
    href: '/graph',
    deps: ['tree-basics'],
    lesson: null,
    op: null,
    summary: 'Trees generalize to networks — coming next.',
  },
];

export const LAYER_GAP = 260;
export const ROW_GAP = 100;

export const masteryFor = (concept, progress) => {
  const store = progress || {};
  const lessonDone = concept.lesson ? Boolean(store.lessons && store.lessons[concept.lesson]) : false;
  const opEntry = concept.op && store.operations ? store.operations[concept.op] : null;
  const practiced = Boolean(opEntry && opEntry.count > 0);
  const quizDone = concept.quiz
    ? Boolean(store.predictions && store.predictions.correct > 0)
    : false;
  if (quizDone) return 'mastered';
  if ((lessonDone || quizDone) && practiced) return 'mastered';
  if (lessonDone || practiced) return 'started';
  return 'new';
};

export const layoutCurriculum = (concepts) => {
  const byId = new Map(concepts.map((concept) => [concept.id, concept]));
  const layerOf = new Map();

  const visit = (id, seen) => {
    if (layerOf.has(id)) return layerOf.get(id);
    if (seen.has(id)) return 0;
    seen.add(id);
    const concept = byId.get(id);
    const deps = (concept.deps || []).filter((dep) => byId.has(dep));
    const layer =
      deps.length === 0 ? 0 : 1 + Math.max(...deps.map((dep) => visit(dep, new Set(seen))));
    layerOf.set(id, layer);
    return layer;
  };

  concepts.forEach((concept) => visit(concept.id, new Set()));

  const rows = new Map();
  concepts.forEach((concept) => {
    const layer = layerOf.get(concept.id);
    if (!rows.has(layer)) rows.set(layer, []);
    rows.get(layer).push(concept.id);
  });

  const nodes = concepts.map((concept) => {
    const layer = layerOf.get(concept.id);
    const siblings = rows.get(layer);
    return {
      ...concept,
      layer,
      x: 140 + layer * LAYER_GAP,
      y: 70 + siblings.indexOf(concept.id) * ROW_GAP,
    };
  });

  const edges = concepts.flatMap((concept) =>
    (concept.deps || [])
      .filter((dep) => byId.has(dep))
      .map((from) => ({ from, to: concept.id }))
  );

  const width = Math.max(...nodes.map((node) => node.x)) + 220;
  const height = Math.max(...nodes.map((node) => node.y)) + 110;

  return { nodes, edges, width, height };
};
