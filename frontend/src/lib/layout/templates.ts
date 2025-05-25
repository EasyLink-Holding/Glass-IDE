import type { LayoutTemplate } from './types';

export const templates: LayoutTemplate[] = [
  {
    id: 'single',
    name: 'Single Pane',
    root: {
      type: 'slot',
      id: 'main',
    },
  },
  {
    id: 'stacked',
    name: 'Stacked',
    root: {
      type: 'split',
      dir: 'col',
      ratio: [1, 1, 1],
      children: [
        { type: 'slot', id: 'top' },
        { type: 'slot', id: 'middle' },
        { type: 'slot', id: 'bottom' },
      ],
    },
  },
  {
    id: 'two-sides',
    name: 'Two Sidebars',
    root: {
      type: 'split',
      dir: 'row',
      ratio: [1, 3, 1],
      children: [
        { type: 'slot', id: 'left' },
        { type: 'slot', id: 'main' },
        { type: 'slot', id: 'right' },
      ],
    },
  },
  {
    id: 'two-stack-left',
    name: 'Two left stacked',
    root: {
      type: 'split',
      dir: 'row',
      ratio: [1, 3],
      children: [
        {
          type: 'split',
          dir: 'col',
          children: [
            { type: 'slot', id: 'left-top' },
            { type: 'slot', id: 'left-bottom' },
          ],
        },
        { type: 'slot', id: 'right' },
      ],
    },
  },
];
