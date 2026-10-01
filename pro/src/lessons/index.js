import arrayLesson from './array.mdx';
import linkedListLesson from './linked-list.mdx';
import treeLesson from './tree.mdx';

export const LESSONS = [
  {
    slug: 'array',
    title: 'Arrays: Contiguous Memory',
    summary: 'Why fixed slots make indexing O(1) and insertion O(n).',
    structure: 'array',
    Component: arrayLesson,
  },
  {
    slug: 'linked-list',
    title: 'Linked Lists: Pointer Chasing',
    summary: 'How pointers trade index access for cheap rewiring.',
    structure: 'linked-list',
    Component: linkedListLesson,
  },
  {
    slug: 'tree',
    title: 'AVL Trees: Self-Balancing Search',
    summary: 'How rotations keep a search tree logarithmic.',
    structure: 'tree',
    Component: treeLesson,
  },
];

export const getLesson = (slug) => LESSONS.find((lesson) => lesson.slug === slug);
