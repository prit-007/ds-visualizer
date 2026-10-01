export const TOUR_COMPLETED_KEY = 'ds-visualizer:tour-completed';

export const TOUR_STEPS = [
  {
    element: '.sidebar',
    popover: {
      title: 'Your navigation',
      description:
        'Expand Data Structures, Algorithms or Tutorials to jump between every visualizer from this sidebar.',
    },
  },
  {
    element: '.workspace',
    popover: {
      title: 'The workspace',
      description:
        'Operations, the animated step player and the dual-pane pseudocode all live here on each page.',
    },
  },
  {
    element: '.theme-toggle',
    popover: {
      title: 'Light or dark',
      description: 'Switch the theme at any time — your choice is remembered on this device.',
    },
  },
  {
    element: '.sidebar-footer',
    popover: {
      title: 'Help is always nearby',
      description:
        'Settings, help and the GitHub link sit down here, along with the button to replay this tour.',
    },
  },
];
